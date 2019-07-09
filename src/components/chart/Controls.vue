<template>
  <div class="chart-controls">
    <button class="btn -small" @click="clear">clear</button>
    <ul class="chart-controls__series">
      <li v-for="(serie, index) in series" :key="serie.id" class="chart-serie">
        <div class="chart-serie__name">{{ serie }}</div>
        <ul class="chart-serie__controls">
          <li>
            <button>
              <i class="icon-eye"></i>
            </button>
          </li>
        </ul>
      </li>
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
    ...mapState(['pair', 'timeframe', 'actives', 'exchanges']),
    series: () => {
      return activeSeries.map((serie) => {
        console.log('recompute', serie.id)
        return serie.id
      })
    },
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
  }
}

.chart-serie {
  display: flex;

  &__controls {
    button {
      appearance: none;
      -webkit-appearance: none;
      border: 0;
      background: 0;
      color: white;
      cursor: pointer;
      opacity: 0.8;

      &.-disabled {
        opacity: 0.3;
      }

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
