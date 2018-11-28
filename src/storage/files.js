const fs = require('fs');

class FilesStorage {

	constructor(options) {
		this.options = options;

		if (!fs.existsSync('./data')){
			fs.mkdirSync('./data');
		}
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
				const nextDateTimestamp = +date + 1000 * 60 * 60 * 24;
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

			processDate(new Date(new Date(chunk[0][1]).setHours(0, 0, 0, 0)));
		});
	}

	fetch(from, to) {
		const paths = [];

		for (let i = +new Date(new Date(+from).setHours(0, 0, 0, 0)); i <= to; i += 1000 * 60 * 60 * 24) {
			paths.push(this.getBackupFilename(new Date(i)));
		}

		if (!paths.length) {
			return Promise.resolve([]);
		}

		return Promise.all(paths.map(path => {
			return new Promise((resolve, reject) => {
				fs.readFile(path, (error, data) => {
					if (error) {
						console.error(`[storage/files] unable to get ${path} (ms ${i})\n\t`, error.message);
						return resolve([]);
					}

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

	getBackupFilename(date) {
		return 'data/' + (this.options.pair + '_' + date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2));
	}
}

module.exports = FilesStorage;