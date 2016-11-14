'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

var CompositeComponent = function () {
  function CompositeComponent(element) {
    _classCallCheck(this, CompositeComponent);

    this.currentElement = element;
    this.renderedComponent = null;
    this.publicInstance = null;
  }

  _createClass(CompositeComponent, [{
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      return this.publicInstance;
    }
  }, {
    key: 'getHostNode',
    value: function getHostNode() {
      return this.renderedComponent.getHostNode();
    }
  }, {
    key: 'receive',
    value: function receive(nextElement) {
      var type = nextElement.type,
          nextProps = nextElement.props;


      var previousComponent = this.renderedComponent;
      var previousRenderedElement = previousComponent.currentElement;

      var nextRenderedElement = void 0;
      if (isReactClass(type)) {
        var componentWillUpdate = this.publicInstance.componentWillUpdate;


        if (typeof componentWillUpdate === 'function') {
          componentWillUpdate.call(this.publicInstance, this.currentElement.props);
        }

        this.publicInstance.props = nextProps;
        nextRenderedElement = this.publicInstance.render();
      } else {
        nextRenderedElement = type(nextProps);
      }

      if (nextRenderedElement.type === previousRenderedElement.type) {
        previousComponent.receive(nextRenderedElement);
      } else {
        this.renderedComponent = instantiateComponent(nextRenderedElement);
        var nextHostNode = this.renderedComponent.mount();

        var previousHostNode = previousComponent.getHostNode();
        previousComponent.unmount();

        previousHostNode.parentNode.replaceChild(nextHostNode, previousHostNode);
      }
    }
  }, {
    key: 'mount',
    value: function mount() {
      var _currentElement = this.currentElement,
          type = _currentElement.type,
          props = _currentElement.props;

      var renderedElement = void 0;

      if (isReactClass(type)) {
        this.publicInstance = new type(props);
        this.publicInstance._reactInternalInstance = this;

        var componentWillMount = this.publicInstance.componentWillMount;


        if (typeof componentWillMount === 'function') {
          componentWillMount.call(this.publicInstance);
        }

        renderedElement = this.publicInstance.render();
      } else {
        renderedElement = type(props);
      }

      this.renderedComponent = instantiateComponent(renderedElement);
      return this.renderedComponent.mount();
    }
  }, {
    key: 'unmount',
    value: function unmount() {
      if (this.publicInstance && this.publicInstance.componentWillUnmount) {
        this.publicInstance.componentWillUnmount();
      }
      this.renderedComponent.unmount();
    }
  }]);

  return CompositeComponent;
}();

var DOMComponent = function () {
  function DOMComponent(element) {
    _classCallCheck(this, DOMComponent);

    this.currentElement = element;
    this.node = null;
    this.renderedChildren = [];
  }

  _createClass(DOMComponent, [{
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      return this.node;
    }
  }, {
    key: 'getHostNode',
    value: function getHostNode() {
      return this.node;
    }
  }, {
    key: 'receive',
    value: function receive(nextElement) {
      var nextProps = nextElement.props;
      var previousProps = this.currentElement.props;

      var node = this.node;

      this.currentElement = nextElement;

      Object.keys(previousProps).forEach(function (prop) {
        if (prop !== 'children' && previousProps.hasOwnProperty(prop)) {
          node.removeAttribute(prop);
        }
      });

      Object.keys(nextProps).forEach(function (prop) {
        if (prop !== 'children' && previousProps.hasOwnProperty(prop)) {
          node.setAttribute(prop, nextProps[prop]);
        }
      });

      var preChildrenElements = previousProps.children;
      var nextChildrenElements = nextProps.children;

      var previousRenderedChildren = this.renderedChildren;
      var nextRenderedChildren = [];

      nextChildrenElements.forEach(function (nextChildElement, index) {
        var preChildElement = preChildrenElements[index];
        var needReplace = checkTextNodeElement(preChildElement) || nextChildElement.type !== preChildElement.type;
        if (!preChildElement) {
          //append new
          var nextChildComponent = instantiateComponent(nextChildElement);
          nextRenderedChildren.push(nextChildComponent);
          node.appendChild(nextChildComponent.mount());
        } else if (needReplace) {
          //replace
          var _nextChildComponent = instantiateComponent(nextChildElement);
          nextRenderedChildren.push(_nextChildComponent);
          node.replaceChild(_nextChildComponent.mount(), previousRenderedChildren[index].getHostNode());
        } else {
          // recursive update
          var previousRenderedComponent = previousRenderedChildren[index];
          nextRenderedChildren.push(previousRenderedComponent);
          previousRenderedComponent.receive(nextChildElement);
        }
      });

      preChildrenElements.forEach(function (previousChildElement, index) {
        if (!nextChildrenElements[index]) {
          node.removeChild(previousRenderedChildren[index].getHostNode());
        }
      });

      this.renderedChildren = nextRenderedChildren;
    }
  }, {
    key: 'mount',
    value: function mount() {
      var _this = this;

      var element = this.currentElement;
      var isTextNodeElement = checkTextNodeElement(element);
      var node = void 0;
      if (isTextNodeElement) {
        node = document.createTextNode(element);
      } else {
        (function () {
          var type = element.type,
              _element$props = element.props,
              children = _element$props.children,
              attributes = _objectWithoutProperties(_element$props, ['children']);

          node = document.createElement(type);

          Object.keys(attributes).forEach(function (k) {
            node.setAttribute(k, attributes[k]);
          });

          children.forEach(function (child) {
            var childComponent = instantiateComponent(child);
            _this.renderedChildren.push(childComponent);
            node.appendChild(childComponent.mount());
          });
        })();
      }

      this.node = node;
      return this.node;
    }
  }, {
    key: 'unmount',
    value: function unmount() {
      this.renderedChildren.forEach(function (childComponent) {
        childComponent.unmount();
      });
    }
  }]);

  return DOMComponent;
}();

function checkTextNodeElement(element) {
  return ['string', 'number'].indexOf(typeof element === 'undefined' ? 'undefined' : _typeof(element)) !== -1;
}

function isCompositeElement(element) {
  return (typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && typeof element.type === 'function';
}

function instantiateComponent(element) {
  return isCompositeElement(element) ? new CompositeComponent(element) : new DOMComponent(element);
}

window.React = {
  Component: function () {
    function Component(props) {
      _classCallCheck(this, Component);

      this.props = props;
    }

    _createClass(Component, [{
      key: 'setState',
      value: function setState(nextState) {
        var reactComponent = this._reactInternalInstance;

        this.state = Object.assign({}, this.state, nextState);

        if (reactComponent) {
          reactComponent.renderedComponent.receive(this.render());
        }
      }
    }, {
      key: 'isReactComponent',
      value: function isReactComponent() {
        return true;
      }
    }]);

    return Component;
  }(),
  createElement: function createElement(type, props) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }

    var finalProps = _extends({}, props, { children: children });
    return {
      type: type,
      props: finalProps
    };
  }
};

window.ReactDOM = {
  render: function render(element, container) {
    if (container.firstChild) {
      var instance = container.firstChild._internalInstance;
      instance.receive(element);
      return;
    }

    var rootComponent = instantiateComponent(element);
    var node = rootComponent.mount();
    node._internalInstance = rootComponent;
    container.appendChild(node);
    return rootComponent.getPublicInstance();
  },
  unmountComponentAtNode: function unmountComponentAtNode(container) {
    var instance = container.firstChild._internalInstance;
    instance.unmount();
    container.innerHTML = '';
  }
};
