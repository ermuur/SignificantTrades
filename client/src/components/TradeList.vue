<template>
  <div class="trades" :class="{ '-compact': compactRows }">
    <ul v-if="trades.length">
      <li v-for="trade in trades" class="trades__item" :key="trade.id" :class="trade.classname" :style="{ 'background-image': trade.image, 'background-color': trade.background, 'color': trade.foreground }">
        <template v-if="trade.message">
          <div class="trades__item__side icon-side"></div>
          <div class="trades__item__message" v-html="trade.message"></div>
          <div class="trades__item__date" :timestamp="trade.timestamp">{{ trade.date }}</div>
        </template>
        <template v-else>
          <div class="trades__item__side icon-side"></div>
          <div class="trades__item__exchange">{{ trade.exchange }}</div>
          <div class="trades__item__price"><span class="icon-currency"></span> <span v-html="trade.price"></span></div>
          <div class="trades__item__amount">
            <span class="trades__item__amount__fiat"><span class="icon-currency"></span> <span v-html="trade.amount"></span></span>
            <span class="trades__item__amount__coin"><span class="icon-commodity"></span> <span v-html="trade.size"></span></span>
          </div>
          <div class="trades__item__date" :timestamp="trade.timestamp">{{ trade.date }}</div>
        </template>
      </li>
    </ul>
    <div v-else class="trades__item trades__item--empty">
      Nothing to show, yet.
    </div>
  </div>
</template>

<script>
  import options from '../services/options'
  import socket from '../services/socket'
  import Sfx from '../services/sfx'

  export default {
    data () {
      return {
        ticks: {},
        trades: [],
        gifs: []
      }
    },
    computed: {
      compactRows: () => options.compactRows
    },
    created() {
      this.getGifs();
      this.refreshColorsPercentages();

      socket.$on('trades', this.onTrades);
      socket.$on('history', this.onFetch);
      socket.$on('pair', this.onPair);
    },
    mounted() {
      if (options.useAudio) {
        this.sfx = new Sfx();

        if (this.sfx.context.state === 'suspended') {
          const resumeOnFocus = (() => {
            this.sfx.context.resume();

            window.removeEventListener('focus', resumeOnFocus, false);
          }).bind(this)

          window.addEventListener('focus', resumeOnFocus, false);
        }
      }

      setTimeout(() => {
        options.$on('change', this.onSettings);
      }, 1000);

      this.timeAgoInterval = setInterval(() => {
        for (let element of this.$el.querySelectorAll('[timestamp]')) {
          element.innerHTML = this.ago(element.getAttribute('timestamp'));
        }
      }, 1000);

      this.onFetch();
    },
    beforeDestroy() {
      socket.$off('pair', this.onPair);
      socket.$off('trades', this.onTrades);
      socket.$off('history', this.onFetch);
      options.$off('change', this.onSettings);

      clearInterval(this.timeAgoInterval);

      this.sfx && this.sfx.disconnect();
    },
    methods: {
      onSettings(data) {
        switch (data.prop) {
          case 'useAudio':
            if (data.value) {
              this.sfx = new Sfx();
            } else {
              this.sfx && this.sfx.disconnect() && delete this.sfx;
            }
          break;
          case 'colors':
            this.refreshColorsPercentages();
            this.trades.splice(0, this.trades.length);

            clearTimeout(this._refreshColorRenderList);

            this._refreshColorRenderList = setTimeout(() => {
              this.onTrades(socket.trades.slice(socket.trades.length - 1000, socket.trades.length));
            }, 500);
          break;
        }
      },
      onPair(pair) {
        this.trades.splice(0, this.trades.length);
      },
      onFetch() {
        if (!this.trades.length && socket.trades.length) {
          this.onTrades(socket.trades, true);

          socket.$off('history', this.onFetch);
        }
      },
      onTrades(trades, silent = false) {
        for (let trade of trades) {
          if (options.exchanges && options.exchanges.indexOf(trade[0]) === -1) {
            continue;
          }

          const size = trade[2] * trade[3];

          if (trade[5] === 1) {
            this.sfx && !silent && this.sfx.liquidation();

            if (size >= options.threshold) {
              this.appendRow(trade, ['liquidation'], `${app.getAttribute('data-symbol')}<strong>${formatAmount(size, 1)}</strong> liquidated <strong>${trade[4] > 0 ? 'SHORT' : 'LONG'}</strong> @ ${app.getAttribute('data-symbol')}${formatPrice(trade[2])}`);
            }
            continue;
          }

          if (options.useAudio && ((options.audioIncludeAll && size > options.threshold * .1) || size > options.significantTradeThreshold)) {
            this.sfx && !silent && this.sfx.tradeToSong(size / options.significantTradeThreshold, trade[4]);
          }

          // group by [exchange name + buy=1/sell=0] (ex bitmex1)
          const tid = trade[0] + trade[4];

          if (options.threshold) {
            if (this.ticks[tid]) {
              if (+new Date() - this.ticks[tid][2] > 5000) {
                delete this.ticks[tid];
              } else {

                // average group prices
                this.ticks[tid][2] = (this.ticks[tid][2] * this.ticks[tid][3] + size) / 2 / ((this.ticks[tid][3] + trade[3]) / 2);

                // sum volume
                this.ticks[tid][3] += trade[3];

                if (this.ticks[tid][2] * this.ticks[tid][3] >= options.threshold) {
                  this.appendRow(this.ticks[tid]);
                  delete this.ticks[tid];
                }

                continue;
              }
            }

            if (!this.ticks[tid] && size < options.threshold) {
              this.ticks[tid] = trade;
              continue;
            }
          }

          this.appendRow(trade);
        }

        this.trades.splice(+options.maxRows || 20, this.trades.length);
      },
      appendRow(trade, classname = [], message = null) {
        let icon;
        let image;
        let amount = trade[2] * trade[3];
        let color = this.getTradeColor(trade);

        if (trade[4] > 0) {
          classname.push('buy');
        } else {
          classname.push('sell');
        }

        if (amount >= options.significantTradeThreshold) {
          classname.push('significant');
        }

        if (amount >= options.hugeTradeThreshold) {
          if (amount < options.rareTradeThreshold && this.gifs.huge && this.gifs.huge.length) {
            image = this.gifs.huge[Math.floor(Math.random() * (this.gifs.huge.length - 1))];
          }

          classname.push('huge');
        }

        if (amount >= options.rareTradeThreshold) {
          if (this.gifs.rare && this.gifs.rare.length) {
            image = this.gifs.rare[Math.floor(Math.random() * (this.gifs.rare.length - 1))];
          }

          classname.push('rare');
        }

        amount = formatAmount(amount);

        if (image) {
          image = 'url(\'' + image + '\')';
        }

        this.trades.unshift({
          id: Math.random().toString(36).substring(7),
          background: color.background,
          foreground: color.foreground,
          side: trade[4] > 0 ? 'BUY' : 'SELL',
          size: trade[3],
          exchange: trade[0],
          price: formatPrice(trade[2]),
          amount: amount,
          classname: classname.map(a => 'trades__item--' + a).join(' '),
          icon: icon,
          date: this.ago(trade[1]),
          timestamp: trade[1],
          image: image,
          message: message
        });
      },
      getGifs(refresh) {
        [{
          threshold: 'huge',
          query: 'cash',
        },{
          threshold: 'rare',
          query: 'explosion'
        }].forEach(animation => {
          const storage = localStorage ? JSON.parse(localStorage.getItem(animation.threshold + '_gifs')) : null;

          if (!refresh && storage && +new Date() - storage.timestamp < 1000 * 60 * 60 * 24) {
            this.gifs[animation.threshold] = storage.data;
          } else {
            fetch('https://api.giphy.com/v1/gifs/search?q=' + animation.query + '&rating=r&limit=100&api_key=b5Y5CZcpj9spa0xEfskQxGGnhChYt3hi')
              .then(res => res.json())
              .then(res => {
                if (!res.data || !res.data.length) {
                  return;
                }

                this.gifs[animation.threshold] = [];

                for (let item of res.data) {
                  this.gifs[animation.threshold].push(item.images.original.url);
                }

                localStorage.setItem(animation.threshold + '_gifs', JSON.stringify({
                  timestamp: +new Date(),
                  data: this.gifs[animation.threshold]
                }))
              });
          }
        });
      },
      refreshColorsPercentages() {
        this.colors = {};

        const thresholds = [
          0,
          options.significantTradeThreshold,
          options.hugeTradeThreshold,
          options.rareTradeThreshold
        ];

        for (let side in options.colors) {
          this.colors[side] = options.colors[side].map((color, index) => ({
            pct: thresholds[index] / options.rareTradeThreshold,
            color: this.hexToRgb(color)
          }));
        }
      },
      ago(timestamp) {
        const seconds = Math.floor((new Date() - timestamp) / 1000);
        let interval, output;

        if ((interval = Math.floor(seconds / 31536000)) >= 1)
          output = interval + 'y';
        else if ((interval = Math.floor(seconds / 2592000)) >= 1)
          output = interval + 'm';
        else if ((interval = Math.floor(seconds / 86400)) >= 1)
          output = interval + 'd';
        else if ((interval = Math.floor(seconds / 3600)) >= 1)
          output = interval + 'h';
        else if ((interval = Math.floor(seconds / 60)) >= 1)
          output = interval + 'm';
        else
          output = Math.ceil(seconds) + 's';

        return output;
      },
      hexToRgb(hex) {
        const bigint = parseInt(hex.replace(/[^0-9A-F]/gi, ''), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        return {
          r,
          g,
          b
        };
      },
      getTradeColor(trade) {
        const amount = trade[2] * trade[3];
        const pct = amount / options.rareTradeThreshold;
        const palette = this.colors[trade[4] > 0 ? 'buys': 'sells'];

        for (var i = 1; i < palette.length - 1; i++) {
          if (pct < palette[i].pct) {
            break;
          }
        }

        const lower = palette[i - 1];
        const upper = palette[i];
        const range = upper.pct - lower.pct;
        const rangePct = (pct - lower.pct) / range;
        const pctLower = 1 - rangePct;
        const pctUpper = rangePct;
        const color = {
          r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
          g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
          b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };

        const opacity = +(.33 + Math.min(.66, amount / options.significantTradeThreshold * .66)).toFixed(2);
        let luminance = Math.sqrt(0.299 * Math.pow(color.r, 2) + 0.587 * Math.pow(color.g, 2) + 0.114 * Math.pow(color.b, 2));

        if (opacity < 1) {
          if (options.dark) {
            luminance *= opacity;
          } else {
            luminance = 255;
          }
        }

        return {
          background: 'rgba(' + [color.r, color.g, color.b, opacity].join(',') + ')',
          foreground: 'rgba(' + (luminance > 200 ? '0,0,0' : '255,255,255') + ',' + Math.min(1, opacity * 1.25) + ')'
        }
      }
    }
  }
</script>

<style lang="scss">
	@import '../assets/sass/variables';

  @keyframes highlight {
    0% {
        opacity: .75;
    }

    100% {
        opacity: 0;
    }
  }

  .trades {
    ul {
      margin: 0;
      padding: 0;
      display: flex;
      flex-flow: column nowrap;
    }

    &.-compact {
      font-size: .80em;

      .trades__item__date {
        flex-basis: 32px;
      }
    }
  }

  .trades__item {
    display: flex;
    flex-flow: row nowrap;
    padding: .28em .5em;
    background-position: center center;
    background-size: cover;
    background-blend-mode: overlay;
    position: relative;
    align-items: center;
    font-size: .8em;

    &:after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0;
      background-color: white;
      animation: 5s $easeOutExpo highlight;
      pointer-events: none;
    }

    &.trades__item--empty {
      justify-content: center;
      padding: 20px;
      font-size: 80%;

      &:after {
        display: none;
      }
    }

    &.trades__item--sell {
      .icon-side:before {
        content: unicode($icon-down);
      }
    }

    &.trades__item--buy {
      .icon-side:before {
        content: unicode($icon-up);
      }
    }

    &.trades__item--significant {
      font-size: .92em;
    }

    &.trades__item--liquidation {
      background-color: $pink !important;
    }

    &.trades__item--huge {
      font-size: 1em;
      padding: .4em .5em;

      > div {
        position: relative;
      }

      &:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: rgba(black, .1);
      }
    }

    &.trades__item--rare {
      padding: 10px 7px;
      box-shadow: 0 0 20px rgba(red, .5);
      z-index: 1;
    }

    > div {
      flex-grow: 1;
      flex-basis: 0;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.trades__item__side {
        flex-grow: 0;
        flex-basis: 1.14em;
        font-size: 1.22em;

        + .trades__item__message {
          margin-left: 7px;
        }
      }

      &.trades__item__exchange {
        flex-grow: .75;

        small {
          opacity: .8;
        }
      }

      &.trades__item__amount {
        position: relative;

        > span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all .1s ease-in-out;
          display: block;

          &.trades__item__amount__fiat {
            position: absolute;
          }

          &.trades__item__amount__coin {
            transform: translateX(25%);
            opacity: 0;
          }
        }

        &:hover {
          > span.trades__item__amount__coin {
            transform: none;
            opacity: 1;
          }

          > span.trades__item__amount__fiat {
            transform: translateX(-25%);
            opacity: 0;
          }
        }
      }

      &.trades__item__date {
        text-align: right;
        flex-basis: 40px;
        flex-grow: 0;
      }

      &.trades__item__message {
        flex-grow: 2;
        text-align: center;
        font-size: 90%;
      }
    }
  }
</style>