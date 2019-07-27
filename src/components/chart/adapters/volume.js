export default {
  id: 'volume',
  type: 'histogram',
  options: {
    "overlay": true,
    "priceFormat": {
      "type": "volume"
    },
    "scaleMargins": {
      "top": 0.85,
      "bottom": 0
    }
  },

  // when a new candle pop
  onTick: (serieData) => {
    return 0
  },

  // when data is received
  onTrade: (trade, serieData) => {
    serieData.value += trade.size * trade.price
  },

  // when candle is rendered
  onRender: (serieData) => {
    return {
      value: serieData.value
    }
  },
}
