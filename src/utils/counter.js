import socket from '../services/socket'
import store from '../store'
import { formatAmount } from './helpers'

const GRANULARITY = store.state.settings.statsGranularity // 5s
const PERIOD = store.state.settings.statsPeriod // 3m

export default class Counter {
  constructor(callback, { period, subscribe, model } = {}) {
    this.callback = callback;
    this.period = !isNaN(period) ? period : PERIOD;
    this.granularity = Math.max(GRANULARITY, this.period / 50)
    this.timeouts = [];

    if (typeof model !== 'undefined') {
      this.model = model;
    }

    console.log('[counter.js] create', {
      callback: this.callback,
      period: this.period,
      granularity: this.granularity,
    })

    this.clear();

    if (subscribe) {
      this._onTrades = this.onTrades.bind(this);
      socket.$on('trades.queued', this._onTrades)
    }

    if (module.hot) {
      module.hot.dispose(() => {
        this.unbind()
      })
    }
  }

  clear() {
    this.live = this.getModel();
    this.stacks = []

    for (let i = 0; i < this.timeouts.length; i++) {
      clearTimeout(this.timeouts[i]);
    }
  }

  unbind() {
    console.log('[counter.js] unbind')
    socket.$off('trades.queued', this._onTrades);
    this.clear()
  }

  onTrades(trades, stats) {
    const data = this.callback(stats, trades)

    if ((this.constructor.name === 'Counter' && !data) || (this.constructor.name === 'MultiCounter' && !+data.join('') === 0)) {
      console.log('data skipped', data);
      return;
    }

    if (!this.stacks.length || trades[0].timestamp > this.timestamp + this.granularity) {
      this.appendStack(trades[0].timestamp)
    }

    this.addData(data)
  }

  appendStack(timestamp) {
    if (!timestamp) {
      timestamp = +new Date()
    }

    this.stacks.push(this.getModel())
    this.timestamp = Math.floor(timestamp / 1000) * 1000;

    this.timeouts.push(setTimeout(this.shiftStack.bind(this), this.period))
  }

  shiftStack(index = 0) {
    const stack = this.stacks.splice(index, 1)[0]

    if (!stack) {
      return;
    }

    this.substractData(stack);

    this.timeouts.shift()
  }

  getModel() {
    return 0
  }

  addData(data) {
    this.stacks[this.stacks.length - 1] += data
    this.live += data
  }

  substractData(data) {
    this.live -= data
  }

  getValue() {
    return formatAmount(this.live);
  }
}