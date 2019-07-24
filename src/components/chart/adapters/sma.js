export default {
  id: 'sma',
  type: 'line',
  options: {},

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
  },

  // when candle is rendered
  onRender: (serieData, linkedSerie) => {
    serieData.values[serieData.values.length - 1] = linkedSerie.close

    let value = 0

    for (let i = 0; i < serieData.values.length; i++) {
      value += serieData.values[i]
    }

    return {
      value: value / serieData.values.length,
    }
  },
}
