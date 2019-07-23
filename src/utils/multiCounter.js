import Counter from './counter';

export default class MultiCounter extends Counter {
  constructor(callback, period, subscribe = true, model = [0, 0]) {
    super(arguments);

    this.model = model;
  }

  getModel() {
    return JSON.parse(JSON.stringify(this.model))
  }

  addData(data) {
    for (let i = 0; i < data.length; i++) {
      this.stacks[this.stacks.length - 1][i] += data
      this.live += data
    }
  }

  substractData(data) {
    for (let i = 0; i < data.length; i++) {
      this.live -= data
    }
  }

  getValue() {
    return this.live.join('/');
  }
}