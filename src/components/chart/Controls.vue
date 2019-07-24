<template>
  <div class="chart-controls">
    <button class="btn -small" @click="clear">clear</button>
    <ul class="chart-controls__series">
      <li v-for="(serie, index) in series" :key="index">{{ serie }}</li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import { currentTick, activeSeries, chart } from './common'

import { clear } from './ticker'

export default {
  data() {
    return {
      tick: null,
      panning: false,
      fetching: false,
      showControls: false,
    }
  },
  computed: {
    ...mapState('settings', ['pair', 'timeframe', 'exchanges']),
    ...mapState('app', ['actives', 'series']),
  },
  created() {},
  mounted() {},
  beforeDestroy() {},
  methods: {
    clear() {
      clear()
    },
    toggleSerie(index) {},
  },
}
</script>

<style lang="scss">
@import '../../assets/sass/variables';

.chart-controls {
  position: absolute;
  top: 1em;
  left: 1em;
  z-index: 3;
  font-size: 12px;

  ul {
    padding: 0;
    list-style: none;

    li {
      cursor: pointer;
    }
  }
}
</style>
