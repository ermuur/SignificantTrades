import Vue from 'vue'

export default {
  TOGGLE_EXCHANGE(state, { exchange, active }) {
    if (!this.state.settings.exchanges[exchange]) {
      Vue.set(this.state.settings.exchanges, exchange, {})
    }

    const index = state.actives.indexOf('exchange');

    if (active && index === -1) {
      state.actives.push(exchange);
    } else if (!active && index !== -1) {
      state.actives.splice(index, 1);
    }
  },
  TOGGLE_LOADING(state, value) {
    state.isLoading = value ? true : false
  },
  TOGGLE_STAT_MODAL(state, id) {
    state.statModalId = !isNaN(id) ? id : null
  },
  TOGGLE_SERIE_MODAL(state, id) {
    state.serieModalId = !isNaN(id) ? id : null
  },
  TOGGLE_EXCHANGE_MODAL(state, id) {
    state.exchangeModalId = !isNaN(id) ? id : null
  }
}