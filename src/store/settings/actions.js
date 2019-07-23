export default {
  updateStat({ commit }, { index, prop, value }) {
    let mutation = ''

    if (typeof value === 'boolean') {
      mutation += 'TOGGLE_STAT'
    } else {
      mutation += 'SET_STAT_' + prop.toUpperCase()
    }

    commit(mutation, {
      index,
      value
    })
  }
}
