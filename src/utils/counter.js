import socket from '../services/socket'

const GRANULARITY = 1000 * 5 // 5s
const DURATION = 1000 * 60 * 3 // 3m

export default class {
  constructor(model, callback, subscribe = true) {
    this.model = () => model.map(a => 0);
    this.callback = callback;
    this.timeouts = [];

    this.clear();
    
    if (subscribe) {
      this._onTrades = this.onTrades.bind(this);
      socket.$on('trades.queued', this._onTrades)
    }

    if (module.hot) {
      module.hot.dispose(() => {
        socket.$off('trades.queued', this._onTrades);
        this.clear()
      })
    }
  }

  clear() {
    this.live = this.model();
    this.stacks = []

    for (let i = 0; i < this.timeouts.length; i++) {
      clearTimeout(this.timeouts[i]);
    }
  }

  onTrades(trades, stats) {
    const data = this.callback(stats, trades)

    if (!this.stacks.length || trades[0].timestamp > this.timestamp + GRANULARITY) {
      this.appendStack(trades[0].timestamp)
    }
    console.log('onTrades', data, this.live);

    for (let i = 0; i < data.length; i++) {
      this.stacks[this.stacks.length - 1][i] += data[i]
      this.live[i] += data[i]
    }
  }

  appendStack(timestamp) {
    console.log('appendStack');
    if (!timestamp) {
      timestamp = +new Date()
    }

    this.stacks.push(this.model())
    this.timestamp = Math.floor(timestamp / 1000) * 1000;

    this.timeouts.push(setTimeout(this.shiftStack.bind(this), DURATION))
  }

  shiftStack(index = 0) {
    const stack = this.stacks.splice(index, 1)[0]

    if (!stack) {
      return;
    }

    for (let i = 0; i < stack.length; i++) {
      this.live[i] -= stack[i]
      console.log('shiftStack', stack[i]);
    }

    this.timeouts.shift()
  }
}