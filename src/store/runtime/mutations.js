export default {  
  TOGGLE_EXCHANGE(state, { exchange, active }) {
    const index = state.actives.indexOf('exchange');

    if (active && index === -1) {
      state.actives.push(exchange);
    } else if (!active && index !== -1) {
      state.actives.splice(index, 1);
    }
  } 
}