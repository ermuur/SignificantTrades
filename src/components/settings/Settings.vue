<template>
  <div
    id="settings"
    class="settings__container stack__container"
    @click="$event.target === $el && $emit('close')"
  >
    <div ref="tippin" v-if="tippin" class="tippin-me">
      <iframe
        src="https://tippin.me/buttons/send-lite.php?u=Tucsky"
        frameborder="0"
        scrolling="no"
      ></iframe>
    </div>
    <div class="stack__backdrop"></div>
    <div class="stack__scroller">
      <!-- <a href="https://github.com/Tucsky/SignificantTrades/issues" target="_blank" class="settings__report"><i class="icon-warning"></i> Found a bug or feedback ? Let me know on Github !</a> -->
      <div class="stack__wrapper">
        <a
          href="#"
          class="stack__toggler icon-cross"
          @click="$emit('close')"
        ></a>
        <div class="form-group settings-pair mb8">
          <label
            >Pair
            <span
              class="icon-info-circle"
              title="The pair to aggregate from"
              v-tippy
            ></span
          ></label>
          <input
            type="string"
            placeholder="BTCUSD"
            class="form-control"
            :value="pair"
            @change="$store.commit('settings/SET_PAIR', $event.target.value)"
          />
          <small class="help-text mt8" v-if="showPairSubdomainHelp"
            ><i class="icon-info-circle"></i> Consider using
            <a :href="'https://' + pair.replace(/\+/g, '_').toLowerCase() + '.aggr.trade'"
              >https://{{ pair.replace(/\+/g, '_').toLowerCase() }}.aggr.trade</a
            >
            to hook your settings to <strong>{{ pair }}</strong> indefinitely
            !</small>
        </div>
        <div class="mb8">
          <div class="form-group mb8">
            <label
              class="checkbox-control -auto"
              v-tippy
              title="Size display preference"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="preferQuoteCurrencySize"
                @change="
                  $store.commit('settings/SET_QUOTE_AS_PREFERED_CURRENCY', $event.target.checked)
                "
              />
              <div on="quote" off="base"></div>
              <span>Prefer <strong>{{ preferQuoteCurrencySize ? 'quote' : 'base'}}</strong> (<i :class="preferQuoteCurrencySize ? 'icon-quote' : 'icon-base'"></i>) currency</span>
            </label>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'list')"
          :class="{ closed: settings.indexOf('list') > -1 }"
        >
          Trades list <i class="icon-up"></i>
        </div>
        <div class="mb8">
          <div class="column">
            <div class="form-group column__fill">
              <label
                >Max rows
                <span
                  class="icon-info-circle"
                  title="Numbers of trades to keep visible"
                  v-tippy
                ></span
              ></label>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                class="form-control"
                :value="maxRows"
                @change="$store.commit('settings/SET_MAX_ROWS', $event.target.value)"
              />
            </div>

            <div
              class="form-group column__tight"
              title="Show exchange's logo when available"
              v-tippy
            >
              <label>Logo</label>
              <label class="checkbox-control checkbox-control-input flex-right">
                <input
                  type="checkbox"
                  class="form-control"
                  :checked="showLogos"
                  @change="$store.commit('settings/TOGGLE_LOGOS', $event.target.checked)"
                />
                <div></div>
              </label>
            </div>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'thresholds')"
          :class="{ closed: settings.indexOf('thresholds') > -1 }"
        >
          Thresholds ({{ thresholds.length }}) <i class="icon-up"></i>
        </div>
        <div class="settings-thresholds mb8">
          <a
            href="javascript:void(0);"
            class="settings-thresholds__display-toggle"
            v-tippy
            title="Switch thresholds display"
            @click="
              $store.commit('settings/TOGGLE_THRESHOLDS_TABLE', !showThresholdsAsTable)
            "
            >{{ showThresholdsAsTable ? 'slider' : 'table' }}</a
          >
          <Thresholds ref="thresholdsComponent" />
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'audio')"
          :class="{ closed: settings.indexOf('audio') > -1 }"
        >
          Audio <i class="icon-up"></i>
        </div>
        <div
          class="settings-audio mb8 settings__activable column"
          :class="{ active: useAudio }"
        >
          <div class="form-group column__tight">
            <label
              class="checkbox-control -on-off checkbox-control-input flex-right"
              v-tippy="{ placement: 'bottom' }"
              title="Enable audio"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="useAudio"
                @change="$store.commit('settings/TOGGLE_AUDIO', $event.target.checked)"
              />
              <div></div>
            </label>
          </div>
          <div class="form-group column__tight">
            <label
              class="checkbox-control checkbox-control-input flex-right"
              v-tippy
              title="Include orders down to 10% of significant orders"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="audioIncludeInsignificants"
                @change="
                  $store.commit(
                    'TOGGLE_WIDE_AUDIO_THRESHOLD',
                    $event.target.checked
                  )
                "
              />
              <div class="icon-expand"></div>
            </label>
          </div>
          <div class="form-group column__fill">
            <input
              type="range"
              min="0"
              max="10"
              step=".1"
              :value="audioVolume"
              @change="$store.commit('settings/SET_AUDIO_VOLUME', $event.target.value)"
            />
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'stats')"
          :class="{ closed: settings.indexOf('stats') > -1 }"
        >
          Stats <i class="icon-up"></i>
        </div>
        <div
          class="settings-stats mb8 settings__activable column mb8"
          :class="{ active: showStats }"
        >
          <div class="form-group column__tight">
            <label
              class="checkbox-control -on-off checkbox-control-input flex-right"
              v-tippy="{ placement: 'bottom' }"
              title="Enable stats"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="showStats"
                @change="$store.commit('settings/TOGGLE_STATS', $event.target.checked)"
              />
              <div></div>
            </label>
          </div>
          <div class="form-group column__fill">
            <div class="column">
              <div class="form-group column__fill flex-center">Custom stats</div>
              <div class="form-group column__tight">
                <button class="btn -blue" @click="$store.commit('settings/CREATE_STAT'), $store.dispatch('app/openModal', { name: 'stat', id: statsCounters.length - 1 })">
                  <i class="icon-add mr4"></i> add
                </button>
              </div>
            </div>
            <div v-for="(counter, index) in statsCounters" :key="index" class="column mt8">
              <div class="form-group column__tight">
                <label
                  class="checkbox-control -on-off checkbox-control-input flex-right"
                  v-tippy="{ placement: 'bottom' }"
                  title="Enable counter"
                >
                  <input
                    type="checkbox"
                    class="form-control"
                    :checked="counter.enabled"
                    @change="$store.dispatch('settings/updateStat', { index: index, prop: 'enabled', value: $event.target.checked })"
                  />
                  <div></div>
                </label>
              </div>
              <div class="form-group column__fill column__center">
                {{ counter.name }}
              </div>
              <div class="form-group column__tight">
                <button class="btn -green" @click="$store.dispatch('app/openModal', { name: 'stat', id: index })"><i class="icon-edit"></i></button>
              </div>
            </div>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'counters')"
          :class="{ closed: settings.indexOf('counters') > -1 }"
        >
          Counter <i class="icon-up"></i>
        </div>
        <div
          class="settings-counters mb8 settings__activable column"
          :class="{ active: showCounters }"
        >
          <div class="form-group column__tight">
            <label
              class="checkbox-control -on-off checkbox-control-input flex-right"
              v-tippy="{ placement: 'bottom' }"
              title="Enable counters"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="showCounters"
                @change="$store.commit('settings/TOGGLE_COUNTERS', $event.target.checked)"
              />
              <div></div>
            </label>
          </div>
          <div class="form-group column__tight">
            <label
              class="checkbox-control -cml-abs checkbox-control-input flex-right"
              v-tippy
              :title="
                cumulativeCounters ? 'Cumulative mode' : 'Absolute mode'
              "
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="cumulativeCounters"
                @change="
                  $store.commit(
                    'TOGGLE_CUMULATIVE_COUNTERS',
                    $event.target.checked
                  )
                "
              />
              <div></div>
            </label>
          </div>
          <div class="form-group column__fill">
            <input
              v-tippy
              title="Counters step separed by a comma (ie: 1m, 5m, 10m, 15m)"
              type="string"
              placeholder="Enter a set of timeframe (ie 1m, 15m)"
              class="form-control"
              :value="countersStepsStringified"
              @change="replaceCounters($event.target.value)"
            />
            <small class="mt8">Volume sum by time</small>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'chart')"
          :class="{ closed: settings.indexOf('chart') > -1 }"
        >
          Chart <i class="icon-up"></i>
        </div>
        <div
          class="settings-chart mb8 settings__activable column"
          :class="{ active: showChart }"
        >
          <div class="form-group column__tight">
            <label
              class="checkbox-control -on-off checkbox-control-input flex-right"
              v-tippy="{ placement: 'bottom' }"
              title="Enable chart"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="showChart"
                @change="$store.commit('settings/TOGGLE_CHART', $event.target.checked)"
              />
              <div></div>
            </label>
          </div>
          <div class="column__fill">
            <div class="form-group mb8">
              <label
                class="checkbox-control flex-left"
                v-tippy
                title="Show exchanges status and last price under the chart"
              >
                <input
                  type="checkbox"
                  class="form-control"
                  :checked="showExchangesBar"
                  @change="
                    $store.commit(
                      'settings/TOGGLE_EXCHANGES_BAR',
                      $event.target.checked
                    )
                  "
                />
                <div></div>
                <span>Show exchanges bar</span>
              </label>
            </div>
            <div class="form-group mb8">
              <label
                class="checkbox-control flex-left"
                v-tippy
                title="Check this or RIP your computer"
              >
                <input
                  type="checkbox"
                  class="form-control"
                  :checked="autoClearTrades"
                  @change="
                    $store.commit(
                      'settings/TOGGLE_AUTO_CLEAR',
                      $event.target.checked
                    )
                  "
                />
                <div></div>
                <span>Auto clean</span>
              </label>
            </div>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'exchanges')"
          :class="{ closed: settings.indexOf('exchanges') > -1 }"
        >
          Exchanges <i class="icon-up"></i>
        </div>
        <div class="form-group">
          <div class="settings-exchanges">
            <Exchange
              v-for="(exchange, index) in exchanges"
              :key="index"
              :exchange="exchange"
            />
            <div v-if="!exchanges.length" class="mb8">
              You are not connected to any exchanges
            </div>
          </div>
        </div>
        <div
          class="settings__title"
          @click="$store.commit('settings/TOGGLE_SETTINGS_PANEL', 'other')"
          :class="{ closed: settings.indexOf('other') > -1 }"
        >
          Other <i class="icon-up"></i>
        </div>
        <div class="mb8">
          <div class="form-group mb8">
            <label
              class="checkbox-control"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="!!decimalPrecision"
                @change="$store.commit('settings/SET_DECIMAL_PRECISION', decimalPrecision ? null : 2)"
              />
              <div></div>
              <span @click.stop.prevent="$event.target.children[0].focus()">
                Round up to
                <editable
                  placeholder="auto"
                  :content="decimalPrecision"
                  @output="$store.commit('settings/SET_DECIMAL_PRECISION', $event)"
                ></editable>
                decimal(s)
              </span>
            </label>
          </div>
          <div class="form-group mb8">
            <label
              class="checkbox-control"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="!!aggregationLag"
                @change="$store.commit('settings/SET_AGGREGATION_LAG', aggregationLag ? null : 1000)"
              />
              <div></div>
              <span @click.stop.prevent="$event.target.children[0].focus()">
                Aggregation lag
                <editable
                  placeholder="no lag"
                  :content="aggregationLag"
                  @output="$store.commit('settings/SET_AGGREGATION_LAG', $event)"
                ></editable>
                ms
              </span>
            </label>
          </div>
          <div class="form-group mb8">
            <label
              class="checkbox-control"
            >
              <input
                type="checkbox"
                class="form-control"
                :checked="liquidationsOnlyList"
                @change="$store.commit('settings/TOGGLE_LIQUIDATIONS_ONLY', $event.target.checked)"
              />
              <div></div>
              <span>Only list liquidations</span>
            </label>
          </div>
        </div>
        <div class="mt15 settings__footer flex-middle">
          <div class="form-group">
            <div v-if="version.number">
              <span>
                v{{ version.number }}
                <sup class="version-date">{{ version.date }}</sup>
              </span>
              <i class="divider">|</i>
              <a href="javascript:void(0);" @click="reset()"> reset</a>
              <i class="divider">|</i>
              <a
                target="_blank"
                href="https://github.com/Tucsky/SignificantTrades"
                title="Run your own instance !"
              >github</a>
              <i class="divider">|</i>
              <a
                target="_blank"
                href="https://tippin.me/@Tucsky"
                @click="openTippin"
                title="Bitcoin for more <3"
                v-tippy="{
                  animateFill: false,
                  interactive: true,
                  theme: 'blue',
                }"
              >donate</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ago } from '../../utils/helpers'

import socket from '../../services/socket'

import Exchange from './Exchange.vue'
import Thresholds from './Thresholds.vue'

export default {
  components: {
    Exchange,
    Thresholds,
  },
  data() {
    return {
      tippin: false,
      expanded: [],
      version: {
        number: process.env.VERSION || 'DEV',
        date: process.env.BUILD_DATE || 'now',
      },
    }
  },
  computed: {
    ...mapState('app', [
      'actives',
    ]),
    ...mapState('settings', [
      'pair',
      'maxRows',
      'decimalPrecision',
      'showLogos',
      'liquidationsOnlyList',
      'aggregationLag',
      'showCounters',
      'showStats',
      'statsGraphs',
      'statsCounters',
      'preferQuoteCurrencySize',
      'counterPrecision',
      'cumulativeCounters',
      'hideIncompleteCounter',
      'countersSteps',
      'showChart',
      'thresholds',
      'showThresholdsAsTable',
      'useAudio',
      'audioIncludeInsignificants',
      'audioVolume',
      'timeframe',
      'chartLiquidations',
      'chartPadding',
      'chartGridlines',
      'chartGridlinesGap',
      'chartCandlestick',
      'chartSma',
      'chartSmaLength',
      'chartVolume',
      'chartVolumeThreshold',
      'chartVolumeOpacity',
      'chartVolumeAverage',
      'chartVolumeAverageLength',
      'showExchangesBar',
      'autoClearTrades',
      'settings',
    ]),
    exchanges: () => {
      return socket.exchanges
    },
    showPairSubdomainHelp: (state) => {
      if (!state.$root.isAggrTrade || !state.pair) {
        return false
      }

      const match = window.location.hostname.match(/^([\d\w]+)\..*\./i)

      return (
        !match ||
        match.length < 2 ||
        match[1].toLowerCase() !== state.pair.toLowerCase()
      )
    },
  },
  created() {
    this.stringifyCounters()
    this.stringifyStatsPeriod()
  },
  beforeDestroy() {
    document.removeEventListener('click', this._closeTippinHandler)
  },
  methods: {
    stringifyStatsPeriod() {
      this.statsPeriodStringified = ago(
        +new Date() - this.statsPeriod
      )
    },
    stringifyCounters() {
      const now = +new Date()
      this.countersStepsStringified = this.countersSteps
        .map((a) => ago(now - a))
        .join(', ')
    },
    replaceCounters(value) {
      const counters = value
        .split(',')
        .map((a) => {
          a = a.trim()

          if (/[\d.]+s/.test(a)) {
            return parseFloat(a) * 1000
          } else if (/[\d.]+h/.test(a)) {
            return parseFloat(a) * 1000 * 60 * 60
          } else {
            return parseFloat(a) * 1000 * 60
          }
        })
        .filter(function(item, pos, self) {
          return self.indexOf(item) == pos
        })

      if (counters.filter((a) => isNaN(a)).length) {
        this.$store.dispatch('app/showNotice', {
          type: 'error',
          title: `Invalid counter`,
          message: `Your counters (${value}) contains invalid steps.`,
          id: `counter_replace_error`,
        })
        return
      }

      this.$store.commit('settings/REPLACE_COUNTERS', counters)

      this.stringifyCounters()
      this.stringifyStatsPeriod()
    },
    reset() {
      window.localStorage && window.localStorage.clear()

      window.location.reload(true)
    },
    openTippin(e) {
      e.preventDefault()

      this.tippin = true

      this._closeTippinHandlerTimeout = setTimeout(() => {
        this._closeTippinHandler = this.closeTippin.bind(this)

        document.addEventListener('click', this._closeTippinHandler)
      })
    },
    closeTippin(e) {
      e.preventDefault()

      clearTimeout(this._closeTippinHandlerTimeout)

      if (!document.querySelector('.tippin-me').contains(e.target)) {
        this.tippin = false

        document.removeEventListener('click', this._closeTippinHandler)

        e.stopPropagation()
      }
    },
  },
}
</script>

<style lang="scss">
@import '../../assets/sass/variables';

.settings__report {
  display: block;
  padding: 7px 6px 6px;
  background-color: $red;
}

.settings__container {
  background: none !important;
  color: white;

  .stack__scroller {
    background-color: $dark;
  }

  @media screen and (min-width: 500px) {
    z-index: 2;
    position: fixed;
    height: 100%;
    width: 100%;

    + .app__wrapper {
      transform: translateX(320px);
    }

    .stack__scroller {
      width: 320px;
      height: 100%;
    }

    .stack__wrapper {
      display: flex;
      flex-direction: column;
      min-height: calc(100% - 40px);

      > div:last-child {
        margin-top: auto;
        padding-top: 16px;
      }
    }
  }

  .stack__wrapper {
    padding: 20px;
  }

  a {
    color: white;
  }

  .settings__footer {
    a {
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }

    .form-group {
      flex-basis: auto;
      max-width: none;
      flex-grow: 1;
    }

    .version-date {
      opacity: 0.75;
      line-height: 0;
    }

    .divider {
      opacity: 0.2;
      margin: 0 2px;
    }

    .donation {
      display: block;
      font-weight: 600;
      letter-spacing: -0.5px;
      font-size: 14px;
      font-family: monospace;
      color: white;
      text-shadow: 0 2px rgba(0, 0, 0, 0.2);

      img {
        width: 100%;
        margin: 0px;
        display: block;
        transition: transform 0.2s $easeElastic;

        &:active {
          transform: scale(0.9);
        }
      }

      .donation__address {
        letter-spacing: -0.5px;
        font-size: 10px;
      }
    }
  }

  .checkbox-control {
    + .settings-chart__sub-settings {
      position: relative;

      &:before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: -1.5em;
        width: 2px;
        background-color: rgba(white, 0.2);
      }
    }

    &.-luminosity {
      input {
        ~ div {
          background-color: $blue;

          &:before {
            content: unicode($icon-day);
          }

          &:after {
            content: unicode($icon-night);
          }
        }

        &:checked ~ div {
          background-color: $green;
        }
      }
    }

    &.-on-off input ~ div {
      &:before {
        content: unicode($icon-power-on);
      }

      &:after {
        content: unicode($icon-power-off);
      }
    }

    &.-auto input {
      ~ div {
        width: auto;
        display: flex;

        &:before,
        &:after {
          font-family: inherit;
          position: relative;
          line-height: 1;
          order: 0;
        }

        i {
          order: 1;
          top: 0;
        }

        &:before {
          content: attr(on);
          display: none;
        }

        &:after {
          content: attr(off);
        }
      }

      &:checked ~ div {
        &:before {
          display: block;
        }

        &:after {
          display: none;
        }
      }
    }

    &.-cml-abs input {
      ~ div {
        &:before,
        &:after {
          font-family: inherit;
        }

        &:before {
          content: 'CML';
        }

        &:after {
          content: 'ABS';
        }
      }

      &:not(:checked) ~ div {
        background-color: $blue;
      }
    }
  }

  input[type='range'] {
    -webkit-appearance: none; /* Override default CSS styles */
    appearance: none;
    height: 2.5em; /* Specified height */
    background: rgba(black, 0.5); /* Grey background */
    outline: none; /* Remove outline */
    opacity: 0.7; /* Set transparency (for mouse-over effects on hover) */
    -webkit-transition: 0.2s; /* 0.2 seconds transition on hover */
    transition: opacity 0.2s;
    cursor: ew-resize;
    margin: 0;
    width: auto;

    &::-webkit-slider-thumb {
      -webkit-appearance: none; /* Override default look */
      appearance: none;
      width: 0.5em; /* Set a specific slider handle width */
      height: 2em; /* Slider handle height */
      background: lighten($green, 20%); /* Green background */
      cursor: ew-resize;
    }

    &::-moz-range-thumb {
      width: 0.5em; /* Set a specific slider handle width */
      height: 2em; /* Slider handle height */
      background: lighten($green, 20%); /* Green background */
      cursor: ew-resize;
    }

    &:hover,
    &:active {
      opacity: 1; /* Fully shown on mouse-over */

      &::-webkit-slider-thumb {
        transform: scale(1.1);
        background: white;
        box-shadow: 0 0 2px rgba(white, 0.2), 0 0 20px rgba(white, 0.5);
      }

      &::-moz-slider-thumb {
        transform: scale(1.1);
        background: white;
        box-shadow: 0 0 2px rgba(white, 0.2), 0 0 20px rgba(white, 0.5);
      }
    }
  }

  [contenteditable] {
    display: inline-block;
    cursor: text;
    font-family: monospace;
    color: $green;

    -webkit-touch-callout: auto;
    -webkit-user-select: auto;
    -khtml-user-select: auto;
    -moz-user-select: auto;
    -ms-user-select: auto;
    user-select: auto;

    &:empty:before {
      content: attr(placeholder);
      opacity: .5;
    }
  }

  .settings__title {
    display: flex;
    align-items: center;
    padding: 0.5em 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.5;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    &:hover {
      opacity: 1;
      cursor: pointer;
    }

    .icon-up {
      transition: transform 0.2s $easeElastic;
      margin-left: 0.5em;
    }

    &.closed {
      .icon-up {
        transform: rotateZ(180deg);
      }

      + div {
        display: none;
      }
    }
  }

  .settings__activable {
    > div {
      opacity: 0.2;

      &:first-child {
        opacity: 1;
      }
    }

    &.active > div {
      opacity: 1;
    }
  }

  .settings-audio {
    align-items: center;

    label {
      margin: 0;
    }

    input[type='range'] {
      width: 100%;
      margin: 0;
    }
  }

  .settings-thresholds {
    position: relative;

    &__display-toggle {
      position: absolute;
      right: 0;
      top: -1.75em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }
  }

  .settings-exchanges {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  &.open {
    background-color: #222;
  }

  .settings-chart {
    &__sub-settings {
      margin-left: 2.4em;
      margin-bottom: 0.5em;

      > div {
        + div {
          margin-top: 0.75em;
        }
      }

      > div + div {
        margin-top: 0.75em;
      }

      input[type='range'] {
        font-size: 0.5em;
        vertical-align: middle;
      }
    }
  }
}

.tippin-me {
  position: fixed;
  z-index: 10000;
  width: 280px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
  border: 2em solid white;
  height: 470px;
  animation: 0.33s $easeElastic tippin-in;

  @keyframes tippin-in {
    from {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0.1;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  iframe {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
}
</style>
