import Vue from 'vue'

const emitter = new Vue({
  data() {
    return {
      threshold: 100000,
      maxRows: 20,
      compactRows: false,
      pair: 'BTCUSD',
      avgPeriods: 2,
      timeframe: '1.5%',
      exchanges: null,
      debug: false,
      dark: true,
      significantTradeThreshold: 100000,
      hugeTradeThreshold: 1000000,
      rareTradeThreshold: 10000000,
      plotTradeThreshold: 500000,
      colors: {
        buys: [
          '#4caf50',
          '#5b8230',
          '#9ccc65',
          '#FFA000',
        ],
        sells: [
          '#e57373',
          '#e05b52',
          '#f44336',
          '#e91e63'
        ],
      },
      useShades: true,
      useAudio: false,
      audioIncludeAll: true,
      audioVolume: 1.5,
      settings: [],
      showPlotsSignificants: false,
      showPlotsLiquidations: false,
      showPlotsHighs: true,
      chartHeight: null
    }
  },
  created() {
    for (let prop in this.$data) {
      this.$watch(prop, this.onChange.bind(this, prop));
    }
  },
  methods: {
    toggleExchange(exchange) {
      const index = this.exchanges.indexOf(exchange);

      if (index === -1) {
        this.exchanges.push(exchange);
      } else {
        this.exchanges.splice(index, 1);
      }
    },
    follow(state) {
      this.$emit('follow', state);
    },
    onChange(prop, current, old) {
      this.$emit('change', {
        prop: prop,
        value: current
      })
    }
  }
});

export default emitter;