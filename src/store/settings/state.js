import { parseQueryString } from '../../utils/helpers'
import DEFAULTS from './defaults.json'

/**
 *  QUERY STRING PARSER
 *  every options should be settable from querystring using encoded json
 */

const QUERY_STRING = parseQueryString()

/**
 * ACTUAL STORED OBJECT
 */

const STORED = JSON.parse(localStorage.getItem('settings'))

/**
 *  EXTRA
 *
 *  1.SUBDOMAIN
 *  automaticaly map subdomain as a *pair* and replace it in options
 *  eg: ethusd.aggr.trade will set the *pair* options to ethusd.
 */
const EXTRA = {}

const subdomain = window.location.hostname.match(/^([\d\w\-\_]+)\..*\./i)

if (subdomain && subdomain.length >= 2) {
  EXTRA.pair = subdomain[1].replace(/\_/g, '+').toUpperCase()
}

export default Object.assign({}, DEFAULTS, EXTRA, STORED || {}, QUERY_STRING);