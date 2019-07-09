import actions from './actions'
import mutations from './mutations'
import state from './state'

function save(store) {
  let saveTimeout

  store.watch(
    (state) => state.settings.value,
    (currentValue, oldValue) => {
      clearTimeout(saveTimeout)

      saveTimeout = setTimeout(() => {
        console.log('save..')
        const copy = JSON.parse(JSON.stringify(state))
        localStorage.setItem('settings', JSON.stringify(copy))
      })
    }
  )
}

export default {
  state,
  actions,
  mutations,
  plugins: [save],
}
