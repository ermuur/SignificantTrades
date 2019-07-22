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
  openModal({ commit }, { name, id }) {
    if (typeof this.state.app[`${name}ModalId`] === 'number') {
      this.dispatch('closeModal', name)
    }

    commit('TOGGLE_' + name.toUpperCase() + '_MODAL', id)
  },
  closeModal({ commit }, name) {
    if (typeof this.state.app[`${name}ModalId`] !== 'number') {
      return
    }

    commit('TOGGLE_' + name.toUpperCase() + '_MODAL')
  }
}
