function getApp() {
  const { Component } = window.React;
  const { render } = window.ReactDOM;

  class Counter extends Component {
    render() {
      return (
        <div>
          <label>{this.props.value}</label>
        </div>
      )
    }
  }

  class App extends Component {
    constructor(props) {
      super(props)
      this.state = {
        count: 0
      }
    }
    componentWillMount() {
      this.timer = setInterval(() => {
        const { count } = this.state;
        console.log('Interval callback is running: ', count);
        this.setState({
          count: count + 1
        })
      }, 1000)
    }
    componentWillUnmount() {
      window.clearInterval(this.timer);
    }
    render() {
      const { count } = this.state
      return (
        <div>
          <h1>Build your own React.js</h1>
          <Counter
            value={count}
          />
        </div>
      )
    }
  }
  return App
}
