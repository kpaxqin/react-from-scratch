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

    setInterval(() => {
      this.setState({
        count: this.state.count + 1
      })
    }, 1000)
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

render(<App/>, document.getElementById('app'))