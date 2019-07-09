import { seriesOptions, currentTick, activeSeries, chart } from './common'
import store from '../../store'

export function reset() {
  let i = activeSeries.length

  while (i-- >= 0) {
    const serie = activeSeries[i]

    if (!serie) {
      continue
    }

    chart.removeSeries(serie.api)

    if (currentTick.series[serie.id]) {
      delete currentTick.series[serie.id]
    }

    activeSeries.splice(i, 1)
  }
}

export function clear() {
  if (currentTick.timestamp) {
    delete currentTick.timestamp
  }

  currentTick.rendered = true

  for (let i = 0; i < activeSeries.length; i++) {
    const serie = activeSeries[i]

    currentTick.series[serie.id] = {
      value: null,
      rendered: true,
      empty: true
    }

    if (typeof serie.adapter === 'object') {
      if (typeof serie.adapter.onInit === 'function') {
        serie.adapter.onInit(currentTick.series[serie.id])
      }
    }

    serie.api.setData([])
  }
}

export function populateTick(trades) {
  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i]

    if (
      !currentTick.timestamp ||
      trade.timestamp > currentTick.timestamp + store.state.timeframe
    ) {
      newTick(trade.timestamp)
    }

    for (let j = 0; j < activeSeries.length; j++) {
      const serie = activeSeries[j]

      updateTickSerie(serie, trade)
    }
  }

  redrawTick()
}

export function onFetch(trades) {
  clear()
  onTrades(trades)
}

export function newTick(timestamp) {
  redrawTick()

  currentTick.timestamp =
    Math.floor(timestamp / store.state.timeframe) * store.state.timeframe

  for (let i = 0; i < activeSeries.length; i++) {
    clearTickSerie(activeSeries[i])
  }

  currentTick.rendered = false
}

/** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Object}[]} serie */
export function updateTickSerie(serie, trade) {
  if (typeof serie.adapter === 'object') {
    serie.adapter.onTrade(trade, currentTick.series[serie.id])
  } else {
    currentTick.series[serie.id].value += trade[serie.adapter]
  }

  currentTick.series[serie.id].rendered = false

  currentTick.rendered = false
}

/** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} serie */
export function clearTickSerie(serie) {
  if (typeof serie.adapter === 'object') {
    currentTick.series[serie.id].value = serie.adapter.onTick(
      currentTick.series[serie.id]
    )
  } else if (
    typeof serie.adapter === 'string' &&
    typeof trade[serie.adapter] !== 'undefined'
  ) {
    currentTick.series[serie.id].value = 0
  } else if (typeof trade[serie.id] !== 'undefined') {
    currentTick.series[serie.id].value = 0
  }

  currentTick.series[serie.id].rendered = false
}

export function redrawTick() {
  if (currentTick.rendered === true) {
    return
  }

  for (let i = 0; i < activeSeries.length; i++) {
    const serieAPI = activeSeries[i].api
    const serieData = currentTick.series[activeSeries[i].id]

    if (!serieData || serieData.rendered) {
      continue
    }

    let value

    if (typeof activeSeries[i].adapter === 'object') {
      value = activeSeries[i].adapter.onRender(serieData)
      value.time = currentTick.timestamp / 1000
    } else {
      value = {
        time: currentTick.timestamp / 1000,
        value: serieData.value,
      }
    }

    if (serieData.empty) {
      serieAPI.setData([value]);
    } else {
      serieAPI.update(value)
    }

    serieData.rendered = true
    serieData.empty = false
  }

  currentTick.rendered = true
}
