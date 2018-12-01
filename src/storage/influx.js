const Influx = require('influx');
const getHms = require('../helper').getHms;

class InfluxStorage {

	constructor(options) {
		this.format = 'tick';

		if (!options.influxUrl) {
			throw `Please set the influxdb url using influxURL property in config.json`;
		}

		this.options = options;
	}

	connect() {
		console.log(`[storage/influx] connecting`);

		return new Promise((resolve, reject) => {
			try {
				this.influx = new Influx.InfluxDB({
					host: this.options.influxUrl,
					database: 'significant_trades'
				})

				this.influx.getDatabaseNames()
					.then(names => {
						if (!names.includes('significant_trades')) {
							return this.influx.createDatabase('significant_trades');
						}
					})
					.then(() => {
						resolve();
					})
					.catch(err => {
						console.error(`[storage/influx] error creating Influx database :-(`);

						reject(err);
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

		return this.influx.writeMeasurement('trades', chunk.map(trade => {
			const fields = {
				price: +trade[2],
				side: trade[4] > 0 ? true : false
			};

			if (trade[4] > 0) {
				fields.buy = +trade[3];
			}

			if (trade[4] < 1) {
				fields.sell = +trade[3];
			}

			if (+trade[5] === 1) {
				delete fields.buy;
				delete fields.sell;
				fields.liquidation = +trade[3];
			}

			return {
				tags: {
					exchange: trade[0],
					pair: this.options.pair
				},
				fields: fields,
				timestamp: parseInt(trade[1])
			}
		}), {
			precision: 'ms'
		}).catch(err => {
			console.error(`[storage/influx] error saving data to InfluxDB\n${err.stack}`)
		});
	}

	fetch(from, to, timeframe = 1000 * 60) {
		return this.influx.query(`
			SELECT
				first(price) AS open,
				last(price) AS close,
				max(price) AS high,
				min(price) AS low,
				sum(buy) + sum(sell) AS volume,
				sum(buy) * median(price) as buys,
				sum(sell) * median(price) as sells,
				sum(liquidation) * median(price) as liquidations,
				count(side) as records
			FROM trades 
			WHERE pair='${this.options.pair}' AND time > ${from}ms and time < ${to}ms 
			GROUP BY time(${timeframe}ms), exchange fill(none)
		`).then(ticks => ticks.map(tick => {
			tick.timestamp = +new Date(tick.time);

			delete tick.time;

			return tick;
		}).sort((a, b) => a.timestamp - b.timestamp))
		.catch(error => {
			console.error(`[storage/files] failed to retrieves trades between ${from} and ${to} with timeframe ${timeframe}\n\t`, error.message);
		});
	}
}

module.exports = InfluxStorage;