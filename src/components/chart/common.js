import * as TV from 'lightweight-charts'
import options from './options.json'
import store from '../../store'

export let chartOptions = options.chart
export let seriesOptions = options.series

/** @type {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function, options: any}[]} */
export const activeSeries = []

/** @type {{
 * timestamp: number,
 * exchanges: {open: number, high: number, low: number, close: number}[],
 * series: {Object.<number, {
 *  value: any,
 *  updated: boolean
 * }>}
 * }} */
export const currentTick = {
  series: {},
}

/** @type {TV.IChartApi} */
export let chart = null

/**
 * Create the chart
 *
 * @param {Element} container
 * @param {Object} options
 */
export function createChart(container, options) {
  chart = window.chart = TV.createChart(container, options)
}

/**
 * Create a serie
 *
 * @param {string} id
 * @return {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function, options: any}} serie
 */
export function getSerieById(id) {
  for (let i = 0; i < activeSeries.length; i++) {
    if (activeSeries[i].id === id) {
      return activeSeries[i];
    }
  }

  throw new Error(`couldn't find serie ${id} in activeSeries`)
}

/**
 * Create a serie
 *
 * @param {{type: string, options: Object, onInit: Function, onTrade: Function, onRender: Function}} adapter
 * @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function, options: any}} linkedTo
 */
export function createSerie(adapter, linkedTo) {
  let type = adapter.type || 'line'
  let id = adapter.id;

  if (linkedTo) {
    id += '_' + linkedTo.adapter.id;
  }

  let options = Object.assign({}, seriesOptions[type] || {}, adapter.options || {}, store.state.settings.seriesOptions[id] || {})

  if (currentTick.series[id]) {
    throw new Error(`Serie ${id} already exists`)
  }

  type = type.charAt(0).toUpperCase() + type.slice(1)

  // create serie
  const api = chart['add' + type + 'Series'](options)

  // register serie api
  const serie = { id, api, adapter, options };

  if (linkedTo) {
    if (!linkedTo.linked) {
      linkedTo.linked = []
    }

    linkedTo.linked.push(serie);
    serie.linkedTo = linkedTo;
  }

  activeSeries.push(serie)

  // create serie data layer
  currentTick.series[id] = {
    value: null,
    rendered: true,
  }

  // onInit callback
  if (typeof adapter === 'object') {
    if (typeof adapter.onInit === 'function') {
      adapter.onInit(currentTick.series[id])
    }
  }

  console.log('serie', id, 'created', options);

  store.commit('app/TOGGLE_SERIE', id)

  return serie
}

/**
 * Remove a serie
 *
 * @param {string} id
 */
export function removeSerie(id) {
  let serie

  if (id && typeof id === 'object') {
    serie = id;
  } else {
    serie = getSerieById(id)
  }

  if (!serie) {
    return
  }

  const index = activeSeries.indexOf(serie);

  chart.removeSeries(serie.api)

  if (currentTick.series[serie.id]) {
    delete currentTick.series[serie.id]
  }

  activeSeries.splice(index, 1)

  store.commit('app/TOGGLE_SERIE', serie.id)
}