export default {
  id: 'price',
  type: 'candlestick',
  options: {},

  // called once api is created / cleared
  onInit: (serieData) => {
    serieData.exchanges = {}
  },

  // when a new candle pop
  onTick: (serieData) => {
    const exchanges = Object.keys(serieData.exchanges)

    for (let i = 0; i < exchanges.length; i++) {
      serieData.exchanges[exchanges[i]].open = serieData.exchanges[
        exchanges[i]
      ].high = serieData.exchanges[exchanges[i]].low =
        serieData.exchanges[exchanges[i]].close
    }

    if (serieData.close) {
      serieData.open = serieData.high = serieData.low = serieData.close
    }
  },

  // when data is received
  onTrade: (trade, serieData) => {
    if (!serieData.exchanges[trade.exchange]) {
      serieData.exchanges[trade.exchange] = {
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
      }
      return
    }

    serieData.exchanges[trade.exchange].close = trade.price
    serieData.exchanges[trade.exchange].high = Math.max(
      trade.price,
      serieData.exchanges[trade.exchange].high
    )
    serieData.exchanges[trade.exchange].low = Math.min(
      trade.price,
      serieData.exchanges[trade.exchange].low
    )
  },

  // when candle is rendered
  onRender: (serieData) => {
    console.log('render price');
    const exchanges = Object.keys(serieData.exchanges)

    let opens = []
    let highs = []
    let lows = []
    let closes = []

    for (let i = 0; i < exchanges.length; i++) {
      opens.push(serieData.exchanges[exchanges[i]].open)
      highs.push(serieData.exchanges[exchanges[i]].high)
      lows.push(serieData.exchanges[exchanges[i]].low)
      closes.push(serieData.exchanges[exchanges[i]].close)
    }

    if (!serieData.open) {
      serieData.open = opens.reduce((a, b) => a + b) / opens.length
    }

    serieData.high = highs.reduce((a, b) => a + b) / highs.length
    serieData.low = lows.reduce((a, b) => a + b) / lows.length
    serieData.close = closes.reduce((a, b) => a + b) / closes.length

    /* console.log({
      open: +(serieData.open).toFixed(2),
      high: +(serieData.high).toFixed(2),
      low: +(serieData.low).toFixed(2),
      close: +(serieData.close).toFixed(2),
    }) */

    return {
      open: serieData.open,
      high: serieData.high,
      low: serieData.low,
      close: serieData.close,
    }
  },
}
