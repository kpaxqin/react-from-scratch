'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getApp() {
  var Component = window.React.Component;
  var render = window.ReactDOM.render;

  var Counter = function (_Component) {
    _inherits(Counter, _Component);

    function Counter() {
      _classCallCheck(this, Counter);

      return _possibleConstructorReturn(this, (Counter.__proto__ || Object.getPrototypeOf(Counter)).apply(this, arguments));
    }

    _createClass(Counter, [{
      key: 'render',
      value: function render() {
        return React.createElement(
          'div',
          null,
          React.createElement(
            'label',
            null,
            this.props.value
          )
        );
      }
    }]);

    return Counter;
  }(Component);

  var App = function (_Component2) {
    _inherits(App, _Component2);

    function App(props) {
      _classCallCheck(this, App);

      var _this2 = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

      _this2.state = {
        count: _this2.props.count
      };
      return _this2;
    }

    _createClass(App, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this3 = this;

        console.log('componentWillMount');
        this.timer = setInterval(function () {
          var count = _this3.state.count;

          console.log('Interval callback is running: ', count);
          _this3.setState({
            count: count + 1
          });
        }, 1000);
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        console.log('componentWillUnmount');
        window.clearInterval(this.timer);
      }
    }, {
      key: 'render',
      value: function render() {
        var count = this.state.count;
        var isUpdate = this.props.isUpdate;

        return React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            null,
            'Build your own React.js'
          ),
          React.createElement(
            'p',
            null,
            'Current prop is : ',
            this.props.count
          ),
          React.createElement(
            'p',
            null,
            'Current state is :',
            isUpdate ? 'prop has been updated!' : React.createElement(Counter, { value: count })
          )
        );
      }
    }]);

    return App;
  }(Component);

  return App;
}