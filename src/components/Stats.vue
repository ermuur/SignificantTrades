<template>
  <div id="stats" class="stats">
    <div v-for="(value, name) in data" :key="name" class="custom-stat" @click="editByName(name)">
      <div class="custom-stat__name">{{ name }}</div>
      <div class="custom-stat__value">{{ $root.formatAmount(value) }}</div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../services/socket'
import Counter from '../utils/counter'
import MultiCounter from '../utils/MultiCounter'

/** @type {Counter[]} */
const counters = []

export default {
  data() {
    return {
      data: {}
    }
  },

  computed: {
    ...mapState('settings', [
      'statsPeriod',
      'statsGraphs',
      'statsCounters',
      'preferQuoteCurrencySize'
    ]),
    ...mapState('app', [
      'actives'
    ]),
  },
  created() {
    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'settings/SET_STAT_NAME':
          this.renameCounter(mutation.payload.value);
          break

        case 'settings/TOGGLE_STAT':
          if (mutation.payload.value) {
            this.createCounter(this.statsCounters[mutation.payload.index])
          } else {
            this.removeCounter(this.statsCounters[mutation.payload.index].name)
          }
          break

        case 'settings/SET_STAT_PERIOD':
        case 'settings/SET_STAT_OUTPUT':
          this.refreshCounter(this.statsCounters[mutation.payload.index].name);
          break;
      }
    })
  },
  mounted() {
    this.prepareCounters();

    socket.$on('trades.queued', this.onTrades)
    socket.$on('historical', this.onFetch)
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.onTrades)
    socket.$off('historical', this.onFetch)

    this.clearCounters();

    this.onStoreMutation()
  },
  methods: {
    prepareCounters() {
      console.log(`[stats.prepareCounters]`)
      this.clearCounters()

      for (let i = 0; i < this.statsCounters.length; i++) {
        this.createCounter(this.statsCounters[i]);
      }
    },
    onTrades(trades, stats) {
      for (let i = 0; i < counters.length; i++) {
        counters[i].onTrades(trades, stats)

        this.$set(this.data, counters[i].name, counters[i].getValue())
      }
    },
    onFetch(trades, from, to) {
    },
    clearCounters() {
      for (let i = counters.length - 1; i >= 0; i--) {
        if (!counters[i]) {
          console.log('clearCoutner: warning counter', i, 'doesnt exists');
          continue;
        }

        this.removeCounter(i);
      }
    },
    removeCounter(index) {
      const counter = this.getCounter(index);

      if (!counter) {
        console.log(`[removeCounter] couldnt find counter ${index}`);
        return;
      }

      index = counters.indexOf(counter);

      console.log(`\tunbind counter ${counter.name} index ${index}`);
      counter.unbind();

      this.$delete(this.data, counter.name);

      counters.splice(index, 1);
    },
    refreshCounter(index) {
      const counter = this.getCounter(index);

      if (!counter) {
        console.log(`[refreshCounter] couldnt find counter ${index}`);
        return;
      }

      const options = this.statsCounters.filter(a => a.name === counter.name)[0];

      if (!options) {
        console.log(`[refreshCounter] couldnt find options for counter ${counter.name}`);
        return;
      }

      this.removeCounter(counter.name);
      this.createCounter()
    },
    createCounter(options) {
      if (options.enabled && typeof this.data[options.name] === 'undefined') {
        console.log(`create counter ${options.name}`, options);

        const outputType = this.getOutputType(options.output);

        let counter;

        if (outputType === false) {
          counter = new Counter((stats, trades) => eval(options.output), options.period, false);
        } else {
          counter = new MultiCounter((stats, trades) => eval(options.output), options.period, false, new );
        }

        counter.name = options.name;

        counters.push(counter)

        this.$set(this.data, counter.name, 0)
      } else {
        console.log(`counter ${options.name} was skipped`, options.enabled ? 'ENABLED' : 'DISABLED', typeof this.data[options.name] !== 'undefined' ? 'ALREADY IN DATA' : 'NOT IN DATA');
      }
    },
    renameCounter(name) {
      const names = this.statsCounters.map(a => a.name);
      console.log('rename counter', names, name);
      let counter;

      for (let i = 0; i < counters.length; i++) {
        if (names.indexOf(counters[i].name) === -1) {
          counter = counters[i];
          break;
        }
      }

      if (!counter) {
        console.log('no matching counter found');
        return;
      }

      console.log('rename', counter);

      this.data[name] = this.data[counter.name];
      delete this.data[counter.name];
      counter.name = name;
    },
    getCounter(name) {
      if (typeof name === 'number') {
        return counters[name];
      }

      let counter;

      console.log('getCounterByName', name)

      for (let i = 0; i < counters.length; i++) {
        if (counters[i].name === name) {
          counter = counters[i];
          break;
        }
      }

      return counter;
    },
    editByName(name) {
      let index;

      for (let i = 0; i < this.statsCounters.length; i++) {
        if (this.statsCounters[i].name === name) {
          index = i;
          break;
        }
      }

      if (typeof index !== 'number') {
        return;
      }

      this.$store.dispatch('app/openModal', {
        name: 'stat',
        id: index
      })
    },
    getOutputType(fn) {
      var trades = [
        { "exchange": "binance", "timestamp": 1563897189117, "price": 9975.67, "size": 0.049051, "side": "sell" },
        { "exchange": "binance", "timestamp": 1563897189120, "price": 9976.86, "size": 0.256507, "side": "buy" },
      ]

      var stats = socket.getStatsByTrades(trades);

      const output = eval(fn);

      if (Array.isArray(output)) {
        return output.length;
      } else {
        return false;
      }
    }
  },
}
</script>

<style lang="scss">
@import '../assets/sass/variables';

.stats {
  position: relative;
  background-color: rgba(white, 0.05);

  .custom-stat {
    display: flex;
    align-items: center;
    padding: .75em;
    cursor: pointer;

    + .custom-stat {
      padding-top: 0;
    }

    &__name {
      opacity: 0.5;
      letter-spacing: .4px;
      transition: opacity .2s $easeOutExpo;
    }

    &__value {
      text-align: right;
      white-space: nowrap;
      font-family: 'Roboto Condensed';
      z-index: 1;
      flex-grow: 1;
    }

    &:hover {
      .custom-stat__name {
        opacity: 1;
      }
    }
  }
}
</style>
