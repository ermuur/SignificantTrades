<template>
  <div
    id="app"
    class="app"
    :data-prefer="preferQuoteCurrencySize ? 'quote' : 'base'"
    :data-base="baseCurrency"
    :data-quote="quoteCurrency"
    :data-symbol="symbol"
    :data-pair="pair"
    :class="{
      loading: isLoading,
    }"
  >
    <StatModal v-if="statModalId !== null" :contextName="'stat'" :contextId="statModalId" />
    <SerieModal v-if="serieModalId !== null" :contextName="'serie'" :contextId="serieModalId" />
    <ExchangeModal
      v-if="exchangeModalId !== null"
      :contextName="'exchange'"
      :contextId="exchangeModalId"
    />

    <Settings v-if="showSettings" @close="showSettings = false" />

    <div class="app__wrapper">
      <div class="notices">
        <Notice v-for="(notice, index) in notices" :key="index" :notice="notice" />
      </div>
      <div v-if="showSearch" ref="searchWrapper" class="app__search" @click="$event.target === $refs.searchWrapper && $store.commit('app/TOGGLE_SEARCH', false)">
        <Autocomplete
        :load="search"
        :selected="pairs"
        @submit="$store.commit('settings/SET_PAIR', $event.join('+')), $store.commit('app/TOGGLE_SEARCH', false)" />
      </div>
      <Header @toggleSettings="showSettings = !showSettings" />

      <div class="app__layout">
        <div class="app__left" v-if="showChart">
          <Chart />
          <Exchanges v-if="showExchangesBar" />
        </div>
        <div class="app__right">
          <Stats v-if="showStats" />
          <Counters v-if="showCounters" />
          <TradeList />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { formatPrice, formatAmount } from './utils/helpers'

import socket from './services/socket'

import Notice from './components/Notice.vue'
import Header from './components/Header.vue'
import Settings from './components/settings/Settings.vue'
import TradeList from './components/TradeList.vue'
import Chart from './components/chart/Chart.vue'
import Counters from './components/Counters.vue'
import Stats from './components/Stats.vue'
import Exchanges from './components/Exchanges.vue'

import ExchangeModal from './components/settings/modals/ExchangeModal.vue'
import SerieModal from './components/settings/modals/SerieModal.vue'
import StatModal from './components/settings/modals/StatModal.vue'

import Autocomplete from './components/ui/Autocomplete.vue'

export default {
  components: {
    Notice,
    Header,
    Settings,
    TradeList,
    Chart,
    Counters,
    Stats,
    Exchanges,
    ExchangeModal,
    SerieModal,
    StatModal,
    Autocomplete,
  },
  name: 'app',
  data() {
    return {
      price: null,
      baseCurrency: 'bitcoin',
      quoteCurrency: 'dollar',
      symbol: '$',

      showSettings: false,
      showStatistics: false,
    }
  },
  computed: {
    ...mapState('settings', [
      'pair',
      'showCounters',
      'showStats',
      'showChart',
      'showExchangesBar',
      'decimalPrecision',
      'autoClearTrades',
      'preferQuoteCurrencySize',
    ]),
    ...mapState('app', [
      'pairs',
      'actives',
      'isLoading',
      'statModalId',
      'serieModalId',
      'exchangeModalId',
      'notices',
      'currentPrice',
      'priceDirection',
      'showSearch'
    ]),
  },
  created() {
    this.$root.formatPrice = formatPrice
    this.$root.formatAmount = formatAmount

    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'settings/TOGGLE_AUTO_CLEAR':
          this.toggleCleanInterval(mutation.payload)
          break
        case 'settings/SET_PAIR':
          socket.connectExchanges()
          this.updatePairCurrency(this.pair)
          break
        case 'app/UPDATE_PRICE':
          window.document.title = this.currentPrice
            .toString()
            .replace(/<\/?[^>]+(>|$)/g, '')
          break
        case 'app/SET_PRICE_DIRECTION':
          let favicon = document.getElementById('favicon');

          if (favicon) {
            document.head.removeChild(favicon);
          }

          favicon = document.createElement('link');
          favicon.id = 'favicon';
          favicon.rel = 'shortcut icon';
          favicon.href = `static/${this.priceDirection}.png`;

          favicon.setAttribute('direction', this.priceDirection);

          document.head.appendChild(favicon);

          break
        case 'app/TOGGLE_SEARCH':
          if (this.showSearch) {
            setTimeout(() => {
              this.$refs.searchWrapper.querySelector('.autocomplete__input').focus();
            })
          }
          break;
      }
    })

    this.toggleCleanInterval(this.autoClearTrades)

    // Is request blocked by browser ?
    // If true notice user that most of the exchanges may be unavailable
    fetch('showads.js')
      .then(() => {})
      .catch((response, a) => {
        this.$store.dispatch('app/showNotice', {
          type: 'error',
          title: `Disable your AdBlocker`,
          message: `Some adblockers may block access to exchanges api.\nMake sure to turn it off, you wont find any ads here ever :-)`,
          id: `adblock_error`,
        })
      })

    socket.initialize()

    this.updatePrice()
  },
  mounted() {},
  beforeDestroy() {
    clearTimeout(this._updatePriceTimeout)
    clearInterval(this._autoWipeCacheInterval)

    this.onStoreMutation()
  },
  methods: {
    search(query) {
      return socket.exchanges.map(a => a.indexedProducts.map(product => `${product} (${a.id})`)).reduce((a, b) => {
        return a.concat(b);
      }, []).filter((a, index, arr) => arr.indexOf(a) === index && new RegExp(query, "i").test(a))
    },
    updatePairCurrency(pair) {
      const name = pair.replace(/\-[\w\d]*$/, '')

      const symbols = {
        BTC: ['bitcoin', '฿'],
        GBP: ['pound', '£'],
        EUR: ['euro', '€'],
        USD: ['dollar', '$'],
        JPY: ['yen', '¥'],
        ETH: ['ethereum', 'ETH'],
        XRP: ['xrp', 'XRP'],
        LTC: ['ltc', 'LTC'],
        TRX: ['trx', 'TRX'],
        ADA: ['ada', 'ADA'],
        IOTA: ['iota', 'IOTA'],
        XMR: ['xmr', 'XMR'],
        NEO: ['neo', 'NEO'],
        EOS: ['eos', 'EOS'],
      }

      this.baseCurrency = 'coin'
      this.quoteCurrency = 'dollar'
      this.symbol = '$'

      for (let symbol of Object.keys(symbols)) {
        if (new RegExp(symbol + '$').test(name)) {
          this.quoteCurrency = symbols[symbol][0]
          this.symbol = symbols[symbol][1]
        }

        if (new RegExp('^' + symbol).test(name)) {
          this.baseCurrency = symbols[symbol][0]
        }
      }

      if (/^(?!XBT|BTC).*\d+$/.test(name)) {
        this.quoteCurrency = symbols.BTC[0]
        this.symbol = symbols.BTC[1]
      }
    },
    toggleCleanInterval(isAutoWipeCacheEnabled) {
      clearInterval(this._autoWipeCacheInterval)

      if (!isAutoWipeCacheEnabled) {
        return
      }

      this._autoWipeCacheInterval = setInterval(
        socket.cleanOldData.bind(socket),
        1000 * 60 * 5
      )
    },
    updatePrice() {
      let price = 0
      let total = 0

      for (let i = 0; i < socket.exchanges.length; i++) {
        if (
          socket.exchanges[i].price === null ||
          this.actives.indexOf(socket.exchanges[i].id) === -1
        ) {
          continue
        }

        total++
        price += socket.exchanges[i].price
      }

      price = price / total

      if (price) {
        this.$store.dispatch('app/updatePrice', price)
      }

      this._updatePriceTimeout = setTimeout(this.updatePrice.bind(this), 1000)
    },
  },
}
</script>

<style lang="scss">
@import './assets/sass/variables';
@import './assets/sass/helper';
@import './assets/sass/layout';
@import './assets/sass/form';
@import './assets/sass/icons';
@import './assets/sass/currency';
@import './assets/sass/tooltip';
@import './assets/sass/dropdown';
@import './assets/sass/button';
@import './assets/sass/autocomplete';
@import './assets/sass/modal';
@import './assets/sass/picker';
@import './assets/sass/notice';
</style>
