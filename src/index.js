function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    // internal instance of rendered component, see mount();
    // eg: const App = ()=> <Foo />; 
    // then appInternalInstance.renderedComponent will be fooInternalInstance
    this.renderedComponent = null;
    this.publicInstance = null;
  }
  getPublicInstance() {
    return this.publicInstance
  }
  getHostNode() {
    // recursively get host node
    return this.renderedComponent.getHostNode();
  }
  receive(nextElement) {
    const { type, props: nextProps } = nextElement;

    // save previous renderedComponent and element
    const previousComponent = this.renderedComponent;
    const previousRenderedElement = previousComponent.currentElement;

    // get next rendered element
    let nextRenderedElement;
    if (isReactClass(type)) {
      const { componentWillUpdate } = this.publicInstance;

      if (typeof componentWillUpdate === 'function') {
        componentWillUpdate.call(this.publicInstance, this.currentElement.props);
      }

      this.publicInstance.props = nextProps;
      nextRenderedElement = this.publicInstance.render();
    } else {
      nextRenderedElement = type(nextProps);
    }

    // next element type might be different from previous
    // eg: const App = ({areYouOk})=> areYouOk ? <Congratulations /> : <GoodLuck />
    // if type not changed, just call receive on previous renderedComponent
    if (nextRenderedElement.type === previousRenderedElement.type) {
      previousComponent.receive(nextRenderedElement)
    } else { // otherwise, re-create renderedComponent instance 
      this.renderedComponent = instantiateComponent(nextRenderedElement);

      // get dom node of rendered tree
      const nextHostNode = this.renderedComponent.mount();

      const previousHostNode = previousComponent.getHostNode();

      previousComponent.unmount();

      // replace dom node
      previousHostNode.parentNode.replaceChild(nextHostNode, previousHostNode)
    }
  }
  mount() {
    const { type, props } = this.currentElement;
    let renderedElement;

    // es6 class
    if (isReactClass(type)) {
      // create public instance
      this.publicInstance = new type(props);
      // record internal instance
      this.publicInstance._reactInternalInstance = this;

      const { componentWillMount } = this.publicInstance;

      // call componentWillMount life-cycle method if exist
      if (typeof componentWillMount === 'function') {
        componentWillMount.call(this.publicInstance);
      }

      // get renderedElement by call render method
      renderedElement = this.publicInstance.render();
    } else { // function component
      renderedElement = type(props);
    }

    // * recursivly instatiate renderedElement and mount
    // since it could only be DOM node in the leaf of component tree
    // so the return value of recursive mount method will be DOM node.
    this.renderedComponent = instantiateComponent(renderedElement);
    return this.renderedComponent.mount()
  }
  unmount() {
    // call componentWillUnmount life-cycle if exist
    if (this.publicInstance && this.publicInstance.componentWillUnmount) {
      this.publicInstance.componentWillUnmount();
    }

    this.renderedComponent.unmount();
  }
}

class DOMComponent {
  constructor(element) {
    this.currentElement = element;
    this.node = null;
    this.renderedChildren = [];
  }
  getPublicInstance() {
    return this.node;
  }
  getHostNode() {
    return this.node;
  }
  receive(nextElement) {
    const { props: nextProps } = nextElement;
    const { props: previousProps } = this.currentElement;
    const node = this.node;

    this.currentElement = nextElement;

    // remove old attrs
    Object.keys(previousProps).forEach(function(prop) {
      if (prop !== 'children' && !nextProps.hasOwnProperty(prop)) {
        node.removeAttribute(prop)
      }
    });

    // set next attrs
    Object.keys(nextProps).forEach(function(prop) {
      if (prop !== 'children' && previousProps.hasOwnProperty(prop)) {
        node.setAttribute(prop, nextProps[prop])
      }
    });

    const preChildrenElements = previousProps.children;
    const nextChildrenElements = nextProps.children;

    const previousRenderedChildren = this.renderedChildren
    const nextRenderedChildren = []

    nextChildrenElements.forEach((nextChildElement, index) => {
      const preChildElement = preChildrenElements[index];

      // replace child node if previous child is text node or type not match
      const needReplace = checkTextNodeElement(preChildElement) || (nextChildElement.type !== preChildElement.type);
      if (!preChildElement) {//append new if previous child not exist
        const nextChildComponent = instantiateComponent(nextChildElement);
        nextRenderedChildren.push(nextChildComponent);
        node.appendChild(nextChildComponent.mount());
      } else if (needReplace) {// do replace if need
        const nextChildComponent = instantiateComponent(nextChildElement);
        nextRenderedChildren.push(nextChildComponent);
        node.replaceChild(nextChildComponent.mount(), previousRenderedChildren[index].getHostNode());
      } else { // update if child type is not text node and not changed 
        const previousRenderedComponent = previousRenderedChildren[index];
        nextRenderedChildren.push(previousRenderedComponent);

        // call receive on renderedComponent to update recursively
        previousRenderedComponent.receive(nextChildElement);
      }
    });

    // unmount & remove extra child that don't exist
    preChildrenElements.forEach((previousChildElement, index) => {
      if (!nextChildrenElements[index]) {
        const previousRenderedComponent = previousRenderedChildren[index];
        previousRenderedComponent.unmount();

        node.removeChild(previousRenderedComponent.getHostNode());
      }
    });

    this.renderedChildren = nextRenderedChildren;

  }
  mount() {
    const element = this.currentElement;
    const isTextNodeElement = checkTextNodeElement(element);
    let node;

    if (isTextNodeElement) {
      node = document.createTextNode(element);
    } else {
      const { type, props : { children, ...attributes } } = element;

      // create dom node by tag
      node = document.createElement(type);

      // set attributes of dom node
      Object.keys(attributes).forEach(k => {
        node.setAttribute(k, attributes[k]);
      });

      // tag without children like <input/> is not supported yet
      // recursively create instance for childrens
      // CompositeComponent have only one child -- the component it **renders**: const Parent = ()=> <Child />
      // but HostComponent(DOMComponent) can have multiple children -- the components it **contains**: const App = ()=> <div><A/><B/><C/></div>
      children.forEach(child => {
        const childComponent = instantiateComponent(child);
        this.renderedChildren.push(childComponent)

        // call mount to get dom node of child component recursively then append as child node
        node.appendChild(childComponent.mount());
      });
    }

    this.node = node;
    return this.node;
  }
  unmount() {
    this.renderedChildren.forEach((childComponent) => {
      childComponent.unmount()
    })

  }
}

function checkTextNodeElement(element) {
  return ['string', 'number'].indexOf(typeof element) !== -1;
}

function isCompositeElement(element) {
  return typeof element === 'object' && typeof element.type === 'function';
}

// create internal instance of element
function instantiateComponent(element) {
  return isCompositeElement(element)
    ? new CompositeComponent(element)
    : new DOMComponent(element);
}

window.React = {
  Component: class Component {
    constructor(props) {
      this.props = props;
    }
    setState(nextState){
      const reactComponent = this._reactInternalInstance;

      this.state = Object.assign({}, this.state, nextState);

      if (reactComponent) {
        reactComponent.renderedComponent.receive(this.render())
      }
    }
    isReactComponent() {
      return true
    }
  },
  createElement(type, props, ...children) {
    const finalProps = {...props, children};
    return {
      type,
      props: finalProps
    }
  }
};

window.ReactDOM = {
  render(element, container) {
    // Update if already mounted
    if (container.firstChild) {
      const instance = container.firstChild._internalInstance;
      instance.receive(element);
      return;
    }

    // create component internal instance
    const rootComponent = instantiateComponent(element);
    
    // create dom node tree
    const node = rootComponent.mount();

    // recored internalInstance on node so we can check & update the dom tree on re-render
    node._internalInstance = rootComponent;

    // append the dom tree to container
    container.appendChild(node);

    // get public instance see CompositeComponent & DOMComponent
    return rootComponent.getPublicInstance();
  },
  unmountComponentAtNode(container) {
    const instance = container.firstChild._internalInstance;
    instance.unmount();
    container.innerHTML = '';
  }
};
