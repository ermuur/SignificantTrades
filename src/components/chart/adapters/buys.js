export default {
  id: 'buys',
  type: 'line',
  options: {
    "color": "#4caf50",
    "overlay": true,
    "lastValueVisible": false,
    "priceLineVisible": false,
    "priceFormat": {
      "type": "volume"
    },
    "scaleMargins": {
      "top": 0.85,
      "bottom": 0
    }
  },

  // called once api is created / cleared
  onInit: (serieData) => {
    serieData.values = []
  },

  // when a new candle pop
  onTick: (serieData) => {
    serieData.values.push(0)

    if (serieData.values.length > 14) {
      serieData.values.splice(0, serieData.values.length - 14)
    }

    return 0
  },

  // when data is received
  onTrade: (trade, serieData) => {
    if (trade.side === 'buy') {
      serieData.value += trade.size * trade.price
    }
  },

  // when candle is rendered
  onRender: (serieData) => {
    var k = 2 / (14 + 1)

    if (serieData.values.length > 1) {
      serieData.values[serieData.values.length - 1] = serieData.value * k + serieData.values[serieData.values.length - 2] * (1 - k);
    } else {
      serieData.values[serieData.values.length - 1] = serieData.value;
    }

    return {
      value: serieData.values[serieData.values.length - 1],
    }
  },
}
