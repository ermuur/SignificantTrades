export default {
  refreshExchange({ commit }, exchange) {
    const active =
    !this.state.settings.exchanges[exchange] || (this.state.settings.exchanges[exchange].match &&
      !this.state.settings.exchanges[exchange].disabled &&
      !this.state.settings.exchanges[exchange].hidden)

    commit('TOGGLE_EXCHANGE', {
      exchange,
      active,
    })
  },
}
