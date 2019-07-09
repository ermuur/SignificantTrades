export default {
  reloadExchangeState({ commit, state }, exchange) {
    if (!state.exchanges[exchange]) {
      Vue.set(state.exchanges, exchange, {})
    }

    const active =
      state.exchanges[exchange].match &&
      !state.exchanges[exchange].disabled &&
      !state.exchanges[exchange].hidden

    commit('TOGGLE_EXCHANGE', {
      exchange,
      active,
    })
  },
}
