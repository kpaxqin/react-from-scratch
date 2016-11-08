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
  mount() {
    const { type, props } = this.currentElement;
    let renderedElement;

    if (isReactClass(type)) {
      this.publicInstance = new type(props);

      renderedElement = this.publicInstance.render();
    } else {
      renderedElement = type(props);
    }

    this.renderedComponent = instantiateComponent(renderedElement);
    return this.renderedComponent.mount()
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
  mount() {
    const element = this.currentElement;
    let node;
    if (['string', 'number'].includes(typeof element)) {
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
    const rootComponent = instantiateComponent(element);
    container.appendChild(rootComponent.mount());
    return rootComponent.getPublicInstance();
  }
};
