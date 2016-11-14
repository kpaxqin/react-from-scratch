function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedComponent = null;
    this.publicInstance = null;
  }
  getPublicInstance() {
    return this.publicInstance
  }
  getHostNode() {
    return this.renderedComponent.getHostNode();
  }
  receive(nextElement) {
    const { type, props: nextProps } = nextElement;

    const previousComponent = this.renderedComponent;
    const previousRenderedElement = previousComponent.currentElement;

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

    if (nextRenderedElement.type === previousRenderedElement.type) {
      previousComponent.receive(nextRenderedElement)
    } else {
      this.renderedComponent = instantiateComponent(nextRenderedElement);
      const nextHostNode = this.renderedComponent.mount();

      const previousHostNode = previousComponent.getHostNode();
      previousComponent.unmount();

      previousHostNode.parentNode.replaceChild(nextHostNode, previousHostNode)
    }
  }
  mount() {
    const { type, props } = this.currentElement;
    let renderedElement;

    if (isReactClass(type)) {
      this.publicInstance = new type(props);

      const { componentWillMount } = this.publicInstance;

      if (typeof componentWillMount === 'function') {
        componentWillMount.call(this.publicInstance);
      }

      renderedElement = this.publicInstance.render();
    } else {
      renderedElement = type(props);
    }

    this.renderedComponent = instantiateComponent(renderedElement);
    return this.renderedComponent.mount()
  }
  unmount() {
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

    Object.keys(previousProps).forEach(function(prop) {
      if (prop !== 'children' && previousProps.hasOwnProperty(prop)) {
        node.removeAttribute(prop)
      }
    });

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
      const needReplace = checkTextNodeElement(preChildElement) || (nextChildElement.type !== preChildElement.type);
      if (!preChildElement) {//append new
        const nextChildComponent = instantiateComponent(nextChildElement);
        nextRenderedChildren.push(nextChildComponent);
        node.appendChild(nextChildComponent.mount());
      } else if (needReplace) {//replace
        const nextChildComponent = instantiateComponent(nextChildElement);
        nextRenderedChildren.push(nextChildComponent);
        node.replaceChild(nextChildComponent.mount(), previousRenderedChildren[index].getHostNode());
      } else {// recursive update
        const previousRenderedComponent = previousRenderedChildren[index];
        nextRenderedChildren.push(previousRenderedComponent);
        previousRenderedComponent.receive(nextChildElement);
      }
    });

    preChildrenElements.forEach((previousChildElement, index) => {
      if (!nextChildrenElements[index]) {
        node.removeChild(previousRenderedChildren[index].getHostNode());
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

      node = document.createElement(type);

      Object.keys(attributes).forEach(k => {
        node.setAttribute(k, attributes[k]);
      });

      children.forEach(child => {
        const childComponent = instantiateComponent(child);
        this.renderedChildren.push(childComponent)
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
    setState(){}
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
    if (container.firstChild) {
      const instance = container.firstChild._internalInstance;
      instance.receive(element);
      return;
    }

    const rootComponent = instantiateComponent(element);
    const node = rootComponent.mount();
    node._internalInstance = rootComponent;
    container.appendChild(node);
    return rootComponent.getPublicInstance();
  },
  unmountComponentAtNode(container) {
    const instance = container.firstChild._internalInstance;
    instance.unmount();
    container.innerHTML = '';
  }
};
