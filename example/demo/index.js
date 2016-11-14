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
        count: this.props.count
      }
    }
    componentWillMount() {
      console.log('componentWillMount')
      this.timer = setInterval(() => {
        const { count } = this.state;
        console.log('Interval callback is running: ', count);
        this.setState({
          count: count + 1
        })
      }, 1000)
    }
    componentWillUnmount() {
      console.log('componentWillUnmount')
      window.clearInterval(this.timer);
    }
    render() {
      const { count } = this.state
      const { isUpdate } = this.props;
      return (
        <div>
          <h1>Build your own React.js</h1>
          <p>
            Current prop is : {this.props.count}
          </p>
          <p>
            Current state is :
            {
              isUpdate
                ? 'prop has been updated!'
                : (<Counter value={count} />)
            }

          </p>

        </div>
      )
    }
  }
  return App
}
