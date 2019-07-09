import Vue from 'vue'
import Vuex from 'vuex'

import settings from './settings'
import runtime from './runtime'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    settings,
    runtime
  }
})

store.subscribe((mutation, state) => {
  switch (mutation.type) {
    case 'SHOW_EXCHANGE':
    case 'HIDE_EXCHANGE':
    case 'TOGGLE_EXCHANGE_VISIBILITY':
    case 'ENABLE_EXCHANGE':
    case 'DISABLE_EXCHANGE':
    case 'TOGGLE_EXCHANGE_CHART':
    case 'SET_EXCHANGE_MATCH':
      console.log(store);
      debugger;
      break
  }
})

export default store
