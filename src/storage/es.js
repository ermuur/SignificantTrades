const elasticsearch = require('elasticsearch');
const crypto = require('crypto');
const getHms = require('../helper').getHms;

class EsStorage {

	constructor(options) {
		if (!options.esUrl) {
			throw `Please set the elasticsearch url using esURL property in config.json`;
		}

		this.pattern = '<trades-{now/d}>';
		this.options = options;
	}

	connect() {
		console.warn(`[storage/es] ES STORAGE IS EXPERIMENTAL\n\tFor stable solution use "files" or "influx" storages`);

		console.log(`[storage/es] connecting`);

		return new Promise((resolve, reject) => {
			try {
				this.es = new elasticsearch.Client({
					host: this.url,
					log: 'trace'
				});

				this.es.ping({
					requestTimeout: 1000
				}, error => {
					if (error) {
						console.error(`[storage/es] elasticsearch cluster is down :-(`);

						reject(error);
					}

					console.log('put template', this.pattern.replace(/<?(\w+)-.*>?/, '$1') + '-*');

					this.es.indices.putTemplate({
						name: 'trades',
						body: {
							template: 'trades-*',
							settings : {
								number_of_shards: 1,
								number_of_replicas: 0,
								refresh_interval: '5s'
							},
							mappings: {
								trades: {
									properties: {
										timestamp: {
											type: 'date'
										}
									}
								}
							}
						}
					}).then(() => {
						resolve();
					})
					.catch(error => {
						console.error(`[storage/es] failed to create index template\n\t` + error.message);
					})
				});

			} catch (error) {
				throw error;
			}
		})
	}

	save(chunk) {
		if (!chunk || !chunk.length) {
			return Promise.resolve();
		}

		const data = [];

		for (let i = 0; i < chunk.length; i++) {
			data.push({index: {
				_index: this.pattern,
				_type: 'trades',
				_id: crypto.createHash('sha256').update(JSON.stringify(chunk[i])).digest('hex')
			}});

			data.push({
				pair: this.options.pair,
				exchange: chunk[i][0],
				timestamp: chunk[i][1],
				price: chunk[i][2],
				amount: chunk[i][3],
				side: chunk[i][4]
			})
		}

		return this.es.bulk({
			body: data,
		});
	}

	fetch(from, to) {
		const total = (to - from) / 100;
		let interval = '30s';

		if (total > 1000 * 30) {
			interval = helper.getHms(total);
		}

		return this.es.search({
			index: this.pattern,
			type: 'trades',
			body: {
				"size": 0,
				"query": {
						"range" : {
								"timestamp" : {
									gt: from,
									lt: to
								}
						}
					},
					"aggs": {
						"trades": {
							"tick_exchange": {
								"sum": {
										"field": "amount"
								}
							},
							"date_histogram": {
								"field": "timestamp",
								"interval": interval
							},
							"aggs": {
									"tick_volume": {
										"sum": {
												"field": "amount"
										}
									},
									"tick_buys": {
										"sum": {
												"script": "doc['side'].value == 0 ? 0 : doc['amount'].value"
										}
									},
									"tick_sells": {
										"sum": {
												"script": "doc['side'].value == 1 ? 0 : doc['amount'].value"
										}
									},
									"avg_price": {
										"avg": {
												"field": "price"
										}
									}
							}
						}
					}
				}
			})
			.then(data => {
				return data.hits.hits.reduce((r, e) => r.push(
					[a._source.exchange, a._source.timestamp, a._source.price, a._source.amount, a._source.side],
					[a._source.exchange, a._source.timestamp, a._source.price, a._source.amount, a._source.side],
				) && r, []);
				return data.hits.hits.map(a => [a._source.exchange, a._source.timestamp, a._source.price, a._source.amount, a._source.side]);
			}).catch(error => {
				console.error(`[storage/files] failed to retrieves trades between ${from} and ${to}\n\t`, error.message);
			})
	}
}

module.exports = EsStorage;