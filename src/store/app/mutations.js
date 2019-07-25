import Vue from 'vue'

import { formatPrice } from '../../utils/helpers'

export default {
  TOGGLE_EXCHANGE(state, { exchange, active }) {
    if (!this.state.settings.exchanges[exchange]) {
      Vue.set(this.state.settings.exchanges, exchange, {})
    }

    const index = state.actives.indexOf(exchange)

    if (active && index === -1) {
      state.actives.push(exchange)
    } else if (!active && index !== -1) {
      state.actives.splice(index, 1)
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
  },
  TOGGLE_SERIE(state, id) {
    const index = state.series.indexOf(id)

    if (index !== -1) {
      state.series.splice(index, 1)
    } else {
      state.series.push(id)
    }
  },
  CREATE_NOTICE(state, notice) {
    state.notices.push(notice)
  },
  REMOVE_NOTICE(state, notice) {
    const index = state.notices.indexOf(notice)

    if (index !== -1) {
      if (notice.hideTimeout) {
        clearTimeout(notice.hideTimeout)
      }

      state.notices.splice(index, 1)
    }
  },
  UPDATE_PRICE(state, price) {
    state.previousPrices.push(price);

    if (state.previousPrices.length > 4) {
      state.previousPrices.shift()
    }

    state.currentPrice = formatPrice(price);

    let total = 0

    for (let i = 0; i < state.previousPrices.length; i++) {
      total += state.previousPrices[i];
    }

    state.averagePrice = total / state.previousPrices.length;
  },
  SET_PRICE_DIRECTION(state, direction) {
    state.priceDirection = direction
  },
  TOGGLE_SEARCH(state, value) {
    state.showSearch = typeof value !== 'undefined' ? !!value : !state.showSearch
  }
}
