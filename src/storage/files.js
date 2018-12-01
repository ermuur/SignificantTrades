const fs = require('fs');

class FilesStorage {

	constructor(options) {
		this.options = options;
		this.format = 'trade';

		if (!this.options.filesInterval) {
			this.options.filesInterval = 3600000; // 1h file default
		}

		if (!fs.existsSync('./data')){
			fs.mkdirSync('./data');
		}
	}

	/**
	 * Construit le nom du fichier a partir d'une date
	 * BTCUSD_2018-12-01-22
	 *
	 * @param {Date} date
	 * @returns {string}
	 * @memberof FilesStorage
	 */
	getBackupFilename(date) {
		let filename = `
			data/${this.options.pair}
			_${date.getFullYear()}
			-${('0' + (date.getMonth()+1)).slice(-2)}
			-${('0' + date.getDate()).slice(-2)}
		`;

		if (this.options.filesInterval < 1000 * 60 * 60 * 24) {
			filename += `-${('0' + date.getHours()).slice(-2)}`;
		}

		if (this.options.filesInterval < 1000 * 60 * 60) {
			filename += `-${('0' + date.getMinutes()).slice(-2)}`;
		}

		if (this.options.filesInterval < 1000 * 60) {
			filename += `-${('0' + date.getSeconds()).slice(-2)}`;
		}

		return filename.replace(/\s+/g, '');
	}

	save(chunk) {
		if (!chunk || !chunk.length) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			if (!chunk.length) {
				return resolve(true);
			}

			const processDate = (date) => {
				const nextDateTimestamp = +date + this.options.filesInterval;
				const path = this.getBackupFilename(date);

				let tradesOfTheDay = [];

				for (let i = 0; i < chunk.length; i++) {
					if (chunk[i][1] < nextDateTimestamp) {
						tradesOfTheDay.push(chunk[i]);
						chunk.splice(i, 1);
						i--;
					}
				}

				if (!tradesOfTheDay.length) {
					return processDate(new Date(nextDateTimestamp));
				}

				fs.appendFile(path, tradesOfTheDay.map(trade => trade.join(' ')).join("\n") + "\n", (err) => {
					if (err) {
						throw new Error(err);
					}

					if (chunk.length && chunk[0][1] >= nextDateTimestamp) {
						return processDate(new Date(nextDateTimestamp));
					} else {
						return resolve(true);
					}
				});
			}

			processDate(new Date(Math.floor(chunk[0][1] / this.options.filesInterval) * this.options.filesInterval));
		});
	}

	fetch(from, to, timeframe) {
		const paths = [];

		for (let i = Math.floor(from / this.options.filesInterval) * this.options.filesInterval; i <= to; i += this.options.filesInterval) {
			paths.push(this.getBackupFilename(new Date(i)));
		}

		if (!paths.length) {
			return Promise.resolve([]);
		}

		return Promise.all(paths.map(path => {
			return new Promise((resolve, reject) => {
				fs.readFile(path, 'utf8', (error, data) => {
					if (error) {
						// console.error(`[storage/files] unable to get ${path}\n\t`, error.message);
						return resolve([]);
					}

					data = data.trim().split("\n");

					if (data[0].split(' ')[1] >= from && data[data.length - 1].split(' ')[1] <= to) {
						return resolve(data.map(row => row.split(' ')));
					} else {
						const chunk = [];

						for (let j = 0; j < data.length; j++) {
							const trade = data[j].split(' ');

							if (trade[1] <= from || trade[1] >= to) {
								continue;
							}

							chunk.push(trade);
						}

						return resolve(chunk);
					}
				})
			});
		})).then(chunks => [].concat.apply([], chunks));
	}

}

module.exports = FilesStorage;