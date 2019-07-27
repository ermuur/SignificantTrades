import { currentTick, activeSeries, removeSerie } from './common'
import store from '../../store'

export function reset() {
  let i = activeSeries.length

  while (i-- >= 0) {
    const serie = activeSeries[i]

    if (!serie) {
      continue
    }

    removeSerie(serie)
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

    if (typeof serie.adapter.onInit === 'function') {
      serie.adapter.onInit(currentTick.series[serie.id])
    }

    // serie.api.setData([])
  }
}

export function populateTick(trades) {
  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i]

    if (
      !currentTick.timestamp ||
      trade.timestamp > currentTick.timestamp + store.state.settings.timeframe
    ) {
      newTick(trade.timestamp)
    }

    for (let j = 0; j < activeSeries.length; j++) {
      if (typeof activeSeries[j].linkedTo !== 'undefined') {
        continue;
      }

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
    Math.floor(timestamp / store.state.settings.timeframe) * store.state.settings.timeframe

  for (let i = 0; i < activeSeries.length; i++) {
    if (typeof activeSeries[i].linkedTo !== 'undefined') {
      continue;
    }

    clearTickSerie(activeSeries[i])

    if (activeSeries[i].linked) {
      for (let j = 0; j < activeSeries[i].linked.length; j++) {
        clearTickSerie(activeSeries[i].linked[j])
      }
    }
  }

  currentTick.rendered = false
}

/** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Object}[]} serie */
export function updateTickSerie(serie, trade) {
  serie.adapter.onTrade(trade, currentTick.series[serie.id])

  currentTick.series[serie.id].rendered = false

  currentTick.rendered = false
}

/** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} serie */
export function clearTickSerie(serie) {
  currentTick.series[serie.id].value = serie.adapter.onTick(
    currentTick.series[serie.id]
  )

  currentTick.series[serie.id].rendered = false
}

const renderSerie = (serie) => {
  const serieAPI = serie.api
  const serieData = currentTick.series[serie.id]

  if (!serieData || serieData.rendered) {
    return
  }

  let value = serie.adapter.onRender(serieData, serie.linkedTo ? currentTick.series[serie.linkedTo.id] : null)
  value.time = currentTick.timestamp / 1000

  if (serieData.empty) {
    serieAPI.setData([value]);
  } else {
    serieAPI.update(value)
  }

  serieData.rendered = true
  serieData.empty = false
}

export function redrawTick() {
  if (currentTick.rendered === true) {
    return
  }

  for (let i = 0; i < activeSeries.length; i++) {
    if (typeof activeSeries[i].linkedTo !== 'undefined') {
      continue;
    }

    renderSerie(activeSeries[i])

    if (activeSeries[i].linked) {
      for (let j = 0; j < activeSeries[i].linked.length; j++) {
        renderSerie(activeSeries[i].linked[j])
      }
    }
  }

  currentTick.rendered = true
}
