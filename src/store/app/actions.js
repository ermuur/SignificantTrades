export default {
  updatePrice({ commit }, price) {
    if (price === this.state.app.previousPrices[this.state.app.previousPrices.length]) {
      console.log('price is same')
      return;
    }

    commit('UPDATE_PRICE', price)

    let direction = this.state.app.averagePrice < price ? 'up' : 'down';

    if (direction !== this.state.app.priceDirection) {
      commit('SET_PRICE_DIRECTION', direction);
    }
  },
  refreshExchange({ commit }, exchange) {
    const active =
      !this.state.settings.exchanges[exchange] ||
      (this.state.settings.exchanges[exchange].match &&
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
  },
  showNotice({ commit, dispatch }, notice) {
    dispatch('hideNotice', notice.id)

    if (notice.type !== 'error' || notice.delay) {
      notice.hideTimeout = setTimeout(() => {
        dispatch('hideNotice', notice.id)
      }, notice.delay || 2000)
    }

    commit('CREATE_NOTICE', notice)
  },
  hideNotice({ commit }, id) {
    for (let i = 0; i < this.state.app.notices.length; i++) {
      if (this.state.app.notices[i].id === id) {
        commit('REMOVE_NOTICE', this.state.app.notices[i])
      }
    }
  },
}
