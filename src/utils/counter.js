import socket from '../services/socket'
import store from '../store'

const GRANULARITY = store.state.settings.statsGranularity // 5s
const PERIOD = store.state.settings.statsPeriod // 3m


export default class {
  constructor(callback, period, subscribe = true) {
    this.callback = callback;
    this.period = !isNaN(period) ? period : PERIOD;
    this.timeouts = [];

    this.clear();

    if (subscribe) {
      this._onTrades = this.onTrades.bind(this);
      socket.$on('trades.queued', this._onTrades)
    }

    if (module.hot) {
      module.hot.dispose(() => {
        this.destroy()
      })
    }
  }

  clear() {
    this.live = 0;
    this.stacks = []

    for (let i = 0; i < this.timeouts.length; i++) {
      clearTimeout(this.timeouts[i]);
    }
  }

  destroy() {
    socket.$off('trades.queued', this._onTrades);
    this.clear()
  }

  onTrades(trades, stats) {
    const data = this.callback(stats, trades)

    if (!this.stacks.length || trades[0].timestamp > this.timestamp + GRANULARITY) {
      this.appendStack(trades[0].timestamp)
    }

    this.stacks[this.stacks.length - 1] += data
    this.live += data
  }

  appendStack(timestamp) {
    if (!timestamp) {
      timestamp = +new Date()
    }

    this.stacks.push(0)
    this.timestamp = Math.floor(timestamp / 1000) * 1000;

    this.timeouts.push(setTimeout(this.shiftStack.bind(this), this.period))
  }

  shiftStack(index = 0) {
    const stack = this.stacks.splice(index, 1)[0]

    if (!stack) {
      return;
    }

    this.live -= stack

    this.timeouts.shift()
  }
}