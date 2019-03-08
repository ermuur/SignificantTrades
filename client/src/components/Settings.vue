<template>
  <div class="settings__container stack__container open">
    <chrome-picker v-if="picking !== null" ref="picker" :value="options.colors[picking.side][picking.index]" @input="updateColor"></chrome-picker>
    <div class="stack__wrapper" ref="settingsWrapper">
      <a href="#" class="stack__toggler icon-cross" @click="$emit('close')"></a>
      <div class="settings__title" v-on:click="toggleSection('basics')" v-bind:class="{closed: options.settings.indexOf('basics') > -1}">Basics <i class="icon-up"></i></div>
      <div class="settings__list settings__column">
        <div class="form-group">
          <label>Max rows <span class="icon-info-circle" v-bind:title="help.maxRows" v-tippy></span></label>
          <input type="number" min="0" max="1000" step="1" class="form-control" v-model="options.maxRows">
        </div>
        <div class="form-group">
          <label>&nbsp;</label>
          <label class="checkbox-control flex-right" v-tippy title="Use compact rows">
            <input type="checkbox" class="form-control" v-model="options.compactRows">
            <div></div>
          </label>
        </div>
      </div>
      <div class="mt8 settings__title" v-on:click="toggleSection('chart')" v-bind:class="{closed: options.settings.indexOf('chart') > -1}">Chart <i class="icon-up"></i></div>
      <div>
        <div class="settings__column">
          <div class="form-group">
            <label>Timeframe <span class="icon-info-circle" v-bind:title="help.timeframe" v-tippy></span></label>
            <input type="string" placeholder="XX% or XXs" class="form-control" v-model="options.timeframe">
          </div>
          <div class="form-group">
            <label>Avg. price <span class="icon-info-circle" v-bind:title="help.avgPeriods" v-tippy></span></label>
            <div class="input-group">
              <input type="number" min="0" max="100" step="1" class="form-control" v-model="options.avgPeriods">
            </div>
          </div>
        </div>
        <div class="settings__plots settings__column">
          <div class="form-group">
            <label class="checkbox-control flex-right" v-tippy title="Shows significants orders on the chart">
              <input type="checkbox" class="form-control" v-model="options.showPlotsSignificants">
              <span @click.prevent><editable :content.sync="options.plotTradeThreshold" v-tippy="{ placement: 'bottom', arrow: true }" title="Define threshold"></editable></span>
              <div></div>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-control flex-right" v-tippy title="Shows liquidations bars on the chart">
              <input type="checkbox" class="form-control" v-model="options.showPlotsLiquidations">
              <span>Liquidations</span>
              <div></div>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-control flex-right" v-tippy title="Annotate highest volume node on both side">
              <input type="checkbox" class="form-control" v-model="options.showPlotsHighs">
              <span>Volume highs</span>
              <div></div>
            </label>
          </div>
        </div>
      </div>
      <div class="mt8 settings__title" v-on:click="toggleSection('exchanges')" v-bind:class="{closed: options.settings.indexOf('exchanges') > -1}">Exchanges <i class="icon-up"></i></div>
      <div class="form-group">
        <div class="settings__exchanges">
          <a v-if="exchanges.length" v-for="(exchange, index) in exchanges" v-bind:key="index"
            class="settings__exchanges__item"
            href="#"
            v-on:click="options.toggleExchange(exchange)"
            v-bind:class="{'settings__exchanges__item--active': options.exchanges.indexOf(exchange) !== -1}">
            {{ exchange }}
          </a>
          <div v-if="!exchanges.length" class="mb8">You are not connected to any exchanges</div>
        </div>
      </div>
      <div class="mt8 settings__title" v-on:click="toggleSection('thresholds')" v-bind:class="{closed: options.settings.indexOf('thresholds') > -1}">Thresholds <i class="icon-up"></i></div>
      <div class="settings__thresholds">
        <div class="form-group">
          <label class="settings__thresholds__step">
            <span>Base</span>
            <i class="icon-currency"></i> <editable :content.sync="options.threshold"></editable>
            <span class="color color--buys" :style="{ 'color': options.colors.buys[0] }" @click="openPicker('buys', 0, $event)">{{ options.colors.buys[0] }}</span>
            <span class="color color--sells" :style="{ 'color': options.colors.sells[0] }" @click="openPicker('sells', 0, $event)">{{ options.colors.sells[0] }}</span>
            <i class="icon-info-circle" v-bind:title="help.threshold" v-tippy></i>
          </label>
          <label class="settings__thresholds__step">
            <span>Significant</span>
            <i class="icon-currency"></i>
            <editable :content.sync="options.significantTradeThreshold"></editable>
            <span class="color color--buys" :style="{ 'color': options.colors.buys[1] }" @click="openPicker('buys', 1, $event)">{{ options.colors.buys[1] }}</span>
            <span class="color color--sells" :style="{ 'color': options.colors.sells[1] }" @click="openPicker('sells', 1, $event)">{{ options.colors.sells[1] }}</span>
            <i class="icon-info-circle" v-bind:title="help.significantTradeThreshold" v-tippy></i>
          </label>
          <label class="settings__thresholds__step">
            <span>Huge</span>
            <i class="icon-currency"></i> <editable :content.sync="options.hugeTradeThreshold"></editable>
            <span class="color color--buys" :style="{ 'color': options.colors.buys[2] }" @click="openPicker('buys', 2, $event)">{{ options.colors.buys[2] }}</span>
            <span class="color color--sells" :style="{ 'color': options.colors.sells[2] }" @click="openPicker('sells', 2, $event)">{{ options.colors.sells[2] }}</span>
            <i class="icon-info-circle" v-bind:title="help.hugeTradeThreshold" v-tippy></i>
          </label>
          <label class="settings__thresholds__step">
            <span>Rare</span> <i class="icon-currency"></i> <editable :content.sync="options.rareTradeThreshold"></editable>
            <span class="color color--buys" :style="{ 'color': options.colors.buys[3] }" @click="openPicker('buys', 3, $event)">{{ options.colors.buys[3] }}</span>
            <span class="color color--sells" :style="{ 'color': options.colors.sells[3] }" @click="openPicker('sells', 3, $event)">{{ options.colors.sells[3] }}</span>
            <i class="icon-info-circle" v-bind:title="help.rareTradeThreshold" v-tippy></i>
          </label>
        </div>
      </div>
      <div class="mt8 settings__title" v-on:click="toggleSection('audio')" v-bind:class="{closed: options.settings.indexOf('audio') > -1}">Audio <i class="icon-up"></i></div>
      <div class="settings__audio settings__column" v-bind:class="{active: options.useAudio}">
        <div class="form-group">
          <label class="checkbox-control flex-right" v-tippy title="Enable audio">
            <input type="checkbox" class="form-control" v-model="options.useAudio">
            <div></div>
          </label>
        </div>
        <div class="form-group">
          <label class="checkbox-control flex-right" v-tippy title="Include insignificants">
            <input type="checkbox" class="form-control" v-model="options.audioIncludeAll">
            <div class="icon-expand"></div>
          </label>
        </div>
        <div class="form-group">
          <input type="range" min="0" max="5" step=".1" v-model="options.audioVolume">
        </div>
      </div>
      <div class="mt15 settings__column settings__footer flex-middle">
        <div class="form-group">
          <div v-if="version.number">
            <span>v{{ version.number }} <sup class="version-date">{{ version.date }}</sup></span>
            <i class="divider">|</i>
            <a href="javascript:void(0);" v-on:click="reset()"> reset</a>
            <i class="divider">|</i>
            <a href="bitcoin:​3NuLQsrphzgKxTBU3Vunj87XADPvZqZ7gc" target="_blank" title="Bitcoin for more <3" v-tippy="{animateFill: false, interactive: true, theme: 'blue'}">donate</a>
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-control settings_luminosity flex-right" title="Switch luminosity" v-tippy>
            <input type="checkbox" class="form-control" v-model="options.dark">
            <span>{{ options.dark ? 'Day mode' : 'Night mode' }}</span>
            <div></div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue'
  import { Chrome } from 'vue-color'

  import options from '../services/options'
  import socket from '../services/socket'

  export default {
    components: {
      'chrome-picker': Chrome
    },
    data() {
      return {
        exchanges: [],
        options: options,
        restricted: true,
        height: 0,
        picking: null,
        help: {
          pair: `The pair to aggregate from<br><small><i>special access required</i></small>`,
          avgPeriods: `Define how many periods are used to smooth the chart<br><ol><li>Exchange prices are averaged <strong>within</strong> the tick first (using weighed average in that timeframe if enabled, if not then the close value is used)</li><li>If cumulated periods are > 1 then the price is averaged (using weighed or simple average) using the number of periods you choosed right there (2 by default)</li></ol>`,
          maxRows: `Numbers of trades to keep visible`,
          timeframe: `Define how much trades we stack together in the chart, type a amount of seconds or % of the visible range<br><ul><li>Type 1.5% for optimal result</li><li>Minimum is 5s whatever you enter</li></ul>`,
          exchanges: `Enable/disable exchanges<br>(exclude from list & chart)`,
          threshold: `Minimum amount a trade should have in order to show up on the list`,
          significantTradeThreshold: `Highlight the trade in the list`,
          hugeTradeThreshold: `Shows animation under it !`,
          rareTradeThreshold: `Shows another animation !`,
        },
        version: {
          number: process.env.VERSION || 'DEV',
          date: process.env.BUILD_DATE || 'now'
        }
      }
    },
    created() {
      socket.$on('admin', () => this.restricted = false);

      this.exchanges = socket.exchanges;

      socket.$on('exchanges', exchanges => {
        this.exchanges = exchanges;
      });
    },
    mounted() {
      this._closePicker = this.closePicker.bind(this);

      this.$el.addEventListener('click', this._closePicker);
    },
    beforeDestroy() {
      this.$el.removeEventListener('click', this._closePicker);
    },
    methods: {
      switchPair(event) {
        socket.$emit('alert');
        socket.send('pair', options.pair);
      },
      openPicker(side, index, $event) {
        this.picking = { side, index };

        setTimeout(() => {
          this.$refs.picker.$el.style.left = Math.min(window.innerWidth - this.$refs.picker.$el.clientWidth - 16, $event.target.offsetLeft) + 'px';
          this.$refs.picker.$el.style.top = ($event.pageY + 16) + 'px';
        })

        $event.stopPropagation();
      },
      closePicker($event) {
        if (this.$refs.picker && this.$refs.picker.$el.contains($event.target)) {
          $event.preventDefault();

          return;
        }

        this.picking = null;
      },
      updateColor(color) {
        if (!this.picking) {
          return;
        }

        Vue.set(options.colors[this.picking.side], this.picking.index, color.hex);

        options.onChange('colors', options.colors);
      },
      toggleSection(name) {
        const index = options.settings.indexOf(name);

        if (index === -1) {
          options.settings.push(name);
        } else {
          options.settings.splice(index, 1);
        }
      },
      reset() {
        window.removeEventListener('beforeunload', this.$root.autoSaveHandler);
        window.localStorage && window.localStorage.clear();

        window.location.reload(true);
      }
    }
  }
</script>

<style lang="scss">
	@import '../assets/sass/variables';

  .vc-chrome {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 1;

    animation: .5s $easeOutExpo picker-in;
  }

  [contenteditable] {
    display: inline-block;
    cursor: text;
    color: $green;
    font-family: monospace;
  }

  @keyframes picker-in {
    from {
      opacity: 0;
      transform: translateY(-10%);
    }
    to {
      opacity: 1;
      transform: translateY(0%);
    }
  }

  .settings__container {
    background-color: #222;
    color: white;
    overflow: visible;

    .stack__wrapper {
      padding: 20px;
      overflow: visible;
    }

    a {
      color: white;
    }

    .settings__footer {
      a {
        opacity: .5;

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
        opacity: .75;
        line-height: 0;
      }

      .divider {
        opacity: .2;
        margin: 0 2px;
      }

      .donation {
        display: block;
        font-weight: 600;
        letter-spacing: -.5px;
        font-size: 14px;
        font-family: monospace;
        color: white;
        text-shadow: 0 2px rgba(0, 0, 0, 0.2);

        img {
          width: 100%;
          margin: 0px;
          display: block;
          transition: transform .2s $easeElastic;

          &:active {
            transform: scale(.9);
          }
        }

        .donation__address {
          letter-spacing: -.5px;
          font-size: 10px;
        }
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;

      &.restricted {
        opacity: .5;

        &, input, label {
          cursor: not-allowed;
        }
      }

      .form-control {
        padding: 8px 8px;
        background-color: white;
        border-radius: 2px;
        border: 0;
        width: calc(100% - 16px);
        letter-spacing: -.5px;
        min-width: 0;
      }

      .input-group {
        display: flex;

        > .form-control {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        > .checkbox-control {
          align-items: stretch;

          > div {
            height: 100%;
            padding: 0 1.25em;
            width: auto;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
      }

      .checkbox-control {
        display: flex;
        align-items: center;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: pointer;

        input {
          display: none;

          &:checked {
            ~ div {
              background-color: $green;

              &:before, &:after {
                transition: all .5s $easeOutExpo;
              }

              &:before {
                opacity: 1;
                transform: none;
              }

              &:after {
                opacity: 0;
                transform: translateY(50%) skewY(20deg);
              }
            }
          }
        }

        > div {
          padding: .5em;
          width: 1em;
          height: 1em;
          border-radius: 2px;
          background-color: rgba(white, .3);
          transition: all .2s $easeOutExpo;
          position: relative;

          &:before, &:after {
            font-family: 'icon';
            font-size: 1em;
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            transform: translateY(-50%) skewY(-20deg);
            opacity: 0;
            transition: all .2s $easeOutExpo;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          &:not([class^="icon-"]):before {
            content: unicode($icon-check);
          }

          &:after {
            transform: none;
            opacity: 1;
          }
        }

        div + span {
          margin-left: 5px;
        }

        span + div {
          margin-left: 5px;
        }

        &.settings_luminosity {
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
      }

      > label {
        margin-bottom: 5px;
        line-height: 1.3;

        .icon-info-circle {
          margin-left: 2px;
          line-height: 0;
          top: 1px;
          position: relative;
          opacity: .3;
          transition: opacity .2s $easeOutExpo;
          cursor: help;

          &:hover {
            opacity: 1;
          }
        }

        &:last-child {
          margin: 0;
        }
      }
    }

    .settings__column {
      display: flex;
      flex-direction: row;

      > div {
        margin-right: 8px;
        margin-bottom: 8px;
        flex-grow: 1;
        flex-basis: 50%;
        max-width: 50%;

        &:last-child {
          margin-right: 0;
        }
      }

      &:last-child .form-group {
        margin-bottom: 0;
      }
    }

    .settings__title {
      text-align: left;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: .5px;
      opacity: .5;
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
        transition: transform .2s $easeElastic;
        display: inline-block;
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

    .settings__plots {
      .checkbox-control {
        flex-direction: column;
        padding: 4px 0 10px;

        > span {
          margin-bottom: 5px;
          width: 100%;
          text-align: center;
          line-height: 1.5;
        }
      }

      [contenteditable] {
        &:after {
          content: '+';
        }
      }
    }

    .settings__list {
      align-items: center;

      .form-group:first-child {
        flex-grow: 1;
        flex-basis: auto;
        max-width: none;
      }

      .form-group:last-child {
        flex-grow: 0;
        flex-basis: auto;
        position: relative;

        > label:first-child:before {
          content: 'Compact';
          position: absolute;
          right: 0;
        }
      }
    }

    .settings__audio {
      align-items: center;

      label {
        margin: 0;
      }

      input[type="range"] {
        width: 100%;
        margin: 0;
      }

      .form-group {
        flex-basis: auto;
        flex-grow: 0;
        margin: 0 1em 0 0;
        max-width: none;
        opacity: .2;

        &:first-child {
          opacity: 1;
        }

        &:last-child {
          flex-grow: 1;
          width: 100%;
        }
      }

      &.active {
        .form-group {
          opacity: 1;
        }
      }
    }

    .settings__thresholds {
      padding-bottom: 4px;

      .form-group {
        flex-basis: auto;
        flex-grow: 0;
        max-width: none;
      }

      .settings__thresholds__step {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        > i {
          top: -1px;
          margin: 0 5px;
        }

        > .color {
          font-weight: 600;
          margin-right: 4px;
        }

        > [contenteditable] {
          flex-grow: 1;
        }

        > :nth-child(1) {
          flex-basis: 60px;
          justify-self: flex-start;
        }
      }

      .label {
        margin-bottom: 2px;
      }

      .icon-currency {
        color: $green;
      }
    }

    .settings__exchanges {
      .settings__exchanges__item {
        padding: 5px 8px;
        background-color: rgba(white, .15);
        color: white;
        transition: all .2s $easeOutExpo;
        border-radius: 2px;
        margin-right: 4px;
        margin-bottom: 4px;
        display: inline-block;
        position: relative;

        &:before {
          content: '';
          position: absolute;
          top: calc(50% - 0px);
          height: 1px;
          background-color: white;
          transition: width 0.2s $easeOutExpo .2s;
          left: 12%;
          width: 76%;
        }

        &.settings__exchanges__item--active {
          background-color: $green;
          color: white;

          &:before {
            width: 0%;
          }
        }
      }
    }

    &.open {
      background-color: #222;
    }
  }
</style>
