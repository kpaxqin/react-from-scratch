function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

function mountComposite(element) {
  const { type, props } = element;
  let renderedElement

  if (isReactClass(type)) {
    const publicInstance = new type(props);

    renderedElement = publicInstance.render();
  } else {
    renderedElement = type(props);
  }

  return mount(renderedElement)
}

function mountHost(element) {
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
      const childNode = mount(child);
      node.appendChild(childNode);
    });
  }
  return node;
}

function isCompositeElement(element) {
  return typeof element === 'object' && typeof element.type === 'function';
}

function mount(element) {
  return isCompositeElement(element)
    ? mountComposite(element)
    : mountHost(element)
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
    const rootNode = mount(element);
    container.appendChild(rootNode);
  }
};
