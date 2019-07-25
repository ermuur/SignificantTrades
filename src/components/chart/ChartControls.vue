<template>
  <div class="chart-controls">
    <dropdown :options="timeframes" :selected="timeframe" @output="setTimeframe(+$event)"></dropdown>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../../services/socket'

import { ago } from '../../utils/helpers'

export default {
  data() {
    return {
      timeframes: {},
    }
  },
  computed: {
    ...mapState('settings', ['pair', 'timeframe', 'exchanges']),
    ...mapState('app', ['actives', 'series']),
  },
  created() {
    const now = +new Date()

    ;[1000 * 10, 1000 * 30, 1000 * 60, 1000 * 60 * 3].forEach(
      (span) => (this.timeframes[span] = ago(now - span))
    )
  },
  mounted() {},
  beforeDestroy() {},
  methods: {
    setTimeframe(timeframe) {
      document.activeElement.blur()

      setTimeout(() => {
        this.$store.commit('settings/SET_TIMEFRAME', timeframe)
      }, 50)
    },
  },
}
</script>

<style lang="scss">
@import '../../assets/sass/variables';

.chart-controls {
  position: absolute;
  top: 1em;
  right: 59px;
  margin-right: 1em;
  z-index: 3;
  font-size: 12px;
  text-align: right;
}
</style>
