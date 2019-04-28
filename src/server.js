const EventEmitter = require('events');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const http = require('http');
const getIp = require('./helper').getIp;
const getHms = require('./helper').getHms;

class Server extends EventEmitter {

	constructor(options) {
		super();

		this.timestamps = {};
		this.connected = false;
		this.chunk = [];
		this.lockFetch = true;

		this.options = Object.assign({

			// default pair we track
			pair: 'BTCUSD',

			// default server port
			port: 3000,

			// dont broadcast below ms interval
			delay: 0,

			// restrict origin (now using regex)
			origin: '.*',

			// max interval an ip can fetch in a limited amount of time (usage restriction, default 7 day)
			maxFetchUsage: 1000 * 60 * 60 * 24,

			// the limited amount of time in which the user usage will be stored
			fetchUsageResetInterval: 1000 * 60 * 10,

			// admin access type (whitelist, all, none)
			admin: 'whitelist',

			// enable websocket server on startup (if you only use this for storing trade data set to false)
			websocket: true,

			// storage solution, either 
			// "none" (no storage, everything is wiped out after broadcast)
			// "files" (periodical text file),
			// "influx" (timeserie database),
			// "es" (experimental)
			storage: 'files',

			// store interval (in ms)
			backupInterval: 1000 * 60,

			// elasticsearch server to use when storage is set to "es"
			esUrl: 'localhost:9200',

			// influx db server to use when storage is set to "influx"
			influxUrl: 'localhost:9200',

			// create new text file every N ms when storage is set to "file"
			filesInterval: 3600000,

		}, options);

		if (!this.options.exchanges || !this.options.exchanges.length) {
			throw new Error('You need to specify at least one exchange to track');
		}

		this.ADMIN_IPS = [];
		this.BANNED_IPS = [];

		this.exchanges = this.options.exchanges;

		this.queue = [];

		this.notice = null;
		this.usage = {};
		this.stats = {
			trades: 0,
			volume: 0,
			hits: 0,
			unique: 0,
			ips: [],
		}

		if (fs.existsSync('./persistence.json')) {
			try {
				const persistence = JSON.parse(fs.readFileSync('./persistence.json', 'utf8'));

				this.stats = Object.assign(this.stats, persistence.stats);

				if (persistence.usage) {
					this.usage = persistence.usage;
				}

				if (persistence.notice) {
					this.notice = persistence.notice;
				}
			} catch (err) {
				console.log(`[init/persistence] Failed to parse persistence.json\n\t`, err);
			}
		}

		this.initStorage().then(() => {
			this.handleExchangesEvents();
			this.connectExchanges();

			this.createWSServer();
			this.createHTTPServer();

			// update admin & banned ip
			this.updateIpsInterval = setInterval(this.updateIps.bind(this), 1000 * 60);

			// check user usages that are dues for a reset
			this.cleanupUsageInterval = setInterval(this.cleanupUsage.bind(this), 1000 * 90);

			// backup server persistence
			this.updatePersistenceInterval = setInterval(this.updatePersistence.bind(this), 1000 * 60 * 7);

			// profile exchanges connections (keep alive)
			this.profilerInterval = setInterval(this.monitorExchangesActivity.bind(this), 1000 * 60 * 3);

			if (this.storage) {
				this.backupInterval = setInterval(this.backupTrades.bind(this), this.options.backupInterval);
			}

			setTimeout(() => {
				console.log(`[server] Fetch API unlocked`);

				this.lockFetch = false;
			}, 1000 * 60);
		})
	}

	initStorage() {
		if (this.options.storage) {
			this.storage = new (require(`./storage/${this.options.storage}`))(this.options);

			console.log(`[server/backup] Using "${this.options.storage}" storage solution`);

			if (typeof this.storage.connect === 'function') {
				return this.storage.connect();
			} else {
				return Promise.resolve();
			}
		}

		console.log(`[server/backup] No storage solution`);

		return Promise.resolve();
	}

	backupTrades() {
		if (!this.storage || !this.chunk.length) {
			return Promise.resolve();
		}

		console.log(`[server/storage] backup ${this.chunk.length} trades`);

		return this.storage.save(this.chunk.splice(0, this.chunk.length));
	}

	handleExchangesEvents() {
		this.exchanges.forEach(exchange => {
			exchange.on('data', event => {
				this.timestamps[event.exchange] = +new Date();

				this.stats.trades += event.data.length;

				for (let trade of event.data) {
					this.stats.volume += trade[2];

					trade.unshift(event.exchange);

					this.chunk.push(trade);

					if (this.options.delay) {
						this.queue.unshift(trade);
					}
				}

				if (!this.options.delay) {
					this.broadcast(event.data);
				}
			});

			exchange.on('open', event => {
				if (!this.connected) {
					console.log(`[warning] "${exchange.id}" connected but the server state was disconnected`);
					return exchange.disconnect();
				}

				this.broadcast({
					type: 'exchange_connected',
					id: exchange.id
				});
			});

			exchange.on('err', event => {
				this.broadcast({
					type: 'exchange_error',
					id: exchange.id,
					message: event.message
				});
			});

			exchange.on('close', event => {
				if (this.connected) {
					exchange.reconnect(this.options.pair);
				}

				this.broadcast({
					type: 'exchange_disconnected',
					id: exchange.id
				});
			});
		});
	}

	createWSServer() {
		if (!this.options.websocket) {
			return;
		}

		this.wss = new WebSocket.Server({
			noServer: true
		});

		this.wss.on('connection', (ws, req) =>  {
			const ip = getIp(req);
			const usage = this.getUsage(ip);

			this.stats.hits++;

			if (this.stats.ips.indexOf(ip) === -1) {
				this.stats.ips.push(ip);
			}

			const data = {
				type: 'welcome',
				pair: this.options.pair,
				timestamp: +new Date(),
				exchanges: this.exchanges.map((exchange) => {
					return {
						id: exchange.id,
						connected: exchange.connected
					}
				})
			};

			if (ws.admin = this.isAdmin(ip)) {
				data.admin = true;
			}

			if (this.notice) {
				data.notice = this.notice;
			}

			console.log(`[${ip}/ws${ws.admin ? '/admin' : ''}] joined ${req.url} from ${req.headers['origin']}`, usage ? '(RL: ' + ((usage / this.options.maxFetchUsage) * 100).toFixed() + '%)' : '');

			this.emit('connections', this.wss.clients.size);

			ws.send(JSON.stringify(data));

			ws.on('close', event => {
				let error = null;

				switch (event) {
					case 1002:
						error = 'Protocol Error';
					break;
					case 1003:
						error = 'Unsupported Data';
					break;
					case 1007:
						error = 'Invalid frame payload data';
					break;
					case 1008:
						error = 'Policy Violation';
					break;
					case 1009:
						error = 'Message too big';
					break;
					case 1010:
						error = 'Missing Extension';
					break;
					case 1011:
						error = 'Internal Error';
					break;
					case 1012:
						error = 'Service Restart';
					break;
					case 1013:
						error = 'Try Again Later';
					break;
					case 1014:
						error = 'Bad Gateway';
					break;
					case 1015:
						error = 'TLS Handshake';
					break;
				}

				if (error) {
					console.log(`[${ip}] unusual close "${error}"`);
				}

				setTimeout(() => this.emit('connections', this.wss.clients.size), 100);
			});
		});
	}

	createHTTPServer() {
		this.http = http.createServer((req, response) => {
			response.setHeader('Access-Control-Allow-Origin', '*');

			const ip = getIp(req);
			const usage = this.getUsage(ip);
			let path = url.parse(req.url).path;

			if (!new RegExp(this.options.origin).test(req.headers['origin'])) {
				console.error(`[${ip}/BLOCKED] socket origin mismatch "${req.headers['origin']}"`);

				if (req.headers.accept && req.headers.accept.indexOf('json') > -1) {
					setTimeout(function() {
						response.writeHead(400);
						response.end(JSON.stringify({error: 'naughty, naughty...'}));
					}, 5000 + Math.random() * 5000);

					return;
				} else {
					path = null;
				}
			} else if (this.BANNED_IPS.indexOf(ip) !== -1) {
				console.error(`[${ip}/BANNED] at "${req.url}" from "${req.headers['origin']}"`);

				setTimeout(function() {
					response.end();
				}, 5000 + Math.random() * 5000);

				return;
			}

			let showHelloWorld = true;

			const routes = [{
				match: /.*historical\/(\d+)\/(\d+)(?:\/(\d+))?\/?$/,
				response: (from, to, timeframe) => {
					showHelloWorld = false;
					response.setHeader('Content-Type', 'application/json');

					if (this.lockFetch) {
						setTimeout(function() {
							response.end('[]');
						}, Math.random() * 5000);

						return;
					}

					if (isNaN(from) || isNaN(to)) {
						response.writeHead(400);
						response.end(JSON.stringify({error: 'Missing interval'}));
						return;
					}

					let maxFetchInterval = 1000 * 60 * 60 * 4; 

					if (this.storage.format === 'tick') {
						maxFetchInterval *= 365;

						timeframe = parseInt(timeframe) || 1000 * 60; // default to 1m					
						from = Math.floor(from / timeframe) * timeframe;
						to = Math.floor(to / timeframe) * timeframe;

						if (timeframe > 1000 * 60 * 60 * 24) {
							response.writeHead(400);
							response.end(JSON.stringify({error: 'Timeframe cannot exceed 1d'}));
							return;
						}

						if (timeframe < 1000 * 10) {
							response.writeHead(400);
							response.end(JSON.stringify({error: 'Timeframe cannot be smaller than 10s'}));
							return;
						}

						if ((to - from) / timeframe > 1000) {
							response.writeHead(400);
							response.end(JSON.stringify({error: 'Output cannot exceed 1000 points'}));
							return;
						}
					} else {
						from = parseInt(from);
						to = parseInt(to);
					}

					if (from > to) {
						let _from = parseInt(from);
						from = parseInt(to);
						to = _from;

						console.log(`[${ip}] flip interval`);
					}

					if (to - from > maxFetchInterval) {
						response.writeHead(400);
						response.end(JSON.stringify({error: `Interval cannot exceed ${getHms(maxFetchInterval)}`}));
						return;
					}

					if (usage > this.options.maxFetchUsage && to - from > 1000 * 60) {
						response.end('[]');
						return;
					}

					const fetchStartAt = +new Date();

					(this.storage ? this.storage.fetch(from, to, timeframe) : Promise.resolve([]))
						.then(output => {
							if (to - from > 1000 * 60) {
								console.log(`[${ip}] requesting ${getHms(to - from)} (${output.length} ${this.storage.format}s, took ${getHms(+new Date() - fetchStartAt)}, consumed ${(((usage + to - from) / this.options.maxFetchUsage) * 100).toFixed()}%)`);
							}

							if (this.storage.format === 'trade') {
								for (let i = 0; i < this.chunk.length; i++) {
									if (this.chunk[i][1] <= from || this.chunk[i][1] >= to) {
										continue;
									}

									output.push(this.chunk[i]);
								}
							}

							this.logUsage(ip, to - from);

							response.end(JSON.stringify({
								format: this.storage.format,
								results: output
							}));
						})
						.catch(error => {
							response.writeHead(500);
							response.end(JSON.stringify({error: error.message}));
						});
				}
			}];

			for (let route of routes) {
				if (route.match.test(path)) {
					route.response.apply(this, path.match(route.match).splice(1));
					break;
				}
			}

			if (!response.finished && showHelloWorld) {
				response.writeHead(404);
				response.end(`
					<!DOCTYPE html>
					<html>
						<head>
							<title>SignificantTrades</title>
							<meta name="robots" content="noindex">
						</head>
						<body>
							You seems lost, the actual app is located <a target="_blank" href="https://github.com/Tucsky/SignificantTrades">here</a>.<br>
							You like it ? <a target="_blank" href="bitcoin:3GLyZHY8gRS96sH4J9Vw6s1NuE4tWcZ3hX">BTC for more :-)</a>.<br><br>
							<small>24/7 aggregator for ${this.options.pair}</small>
						</body>
					</html>
				`);
			}
		});

		this.http.on('upgrade', (req, socket, head) => {
			const ip = getIp(req);

			if (!new RegExp(this.options.origin).test(req.headers['origin'])) {
				// console.error(`[${ip}/BLOCKED] socket origin mismatch (${this.options.origin} !== ${req.headers['origin']})`);

				socket.destroy();

				return;
			} else if (this.BANNED_IPS.indexOf(ip) !== -1) {
				// console.error(`[${ip}/BANNED] at "${req.url}" from "${req.headers['origin']}"`);

				socket.destroy();

				return;
			}

			if (this.wss) {
				this.wss.handleUpgrade(req, socket, head, ws => {
					this.wss.emit('connection', ws, req);
				});
			}
		});

		this.http.listen(this.options.port, () => {
			console.log('http server listening on port ' + this.options.port);
		});
	}

	connectExchanges() {
		console.log('[server] listen', this.options.pair);

		this.connected = true;
		this.chunk = [];

		this.exchanges.forEach(exchange => {
			exchange.connect(this.options.pair);
		});

		if (this.options.delay) {
			this.delayInterval = setInterval(() => {
				if (!this.queue.length) {
					return;
				}

				this.broadcast(this.queue);

				this.queue = [];
			}, this.options.delay || 1000);
		}
	}

	broadcast(data) {
		if (!this.wss) {
			return;
		}

		this.wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(data));
			}
		});
	}

	disconnectExchanges() {
		console.log('[server] disconnect exchanges');

		clearInterval(this.delayInterval);

		this.connected = false;

		this.exchanges.forEach(exchange => {
			exchange.disconnect();
		});

		this.queue = [];
	}

	monitorExchangesActivity() {
		const now = +new Date();

		this.exchanges.forEach(exchange => {
			if (!exchange.connected) {
				return;
			}

			if (!this.timestamps[exchange.id]) {
				console.log('[warning] no data sent from ' + exchange.id);
				exchange.disconnect() && exchange.reconnect(this.options.pair);

				return;
			}

			if (now - this.timestamps[exchange.id] > 1000 * 60 * 5) {
				console.log('[warning] ' + exchange.id + ' hasn\'t sent any data since more than 5 minutes');

				delete this.timestamps[exchange.id];

				exchange.disconnect() && exchange.reconnect(this.options.pair);

				return;
			}
		})
	}

	isAdmin(ip) {
		if (this.options.admin === 'all' || ['localhost', '127.0.0.1', '::1'].indexOf(ip) !== -1) {
			return true;
		}

		if (this.options.admin !== 'whitelist') {
			return false;
		}

		return this.ADMIN_IPS.indexOf(ip) !== -1;
	}

	updateIps() {
		const files = {
			ADMIN_IPS: '../admin.txt',
			BANNED_IPS: '../banned.txt'
		}

		Object.keys(files).forEach(name => {
			if (fs.existsSync(files[name])) {
				const file = fs.readFileSync(files[name], 'utf8');

				if (!file || !file.trim().length) {
					return false;
				}

				this[name] = file.split("\n");
			} else {
				this[name] = [];
			}
		});
	}

	cleanupUsage() {
		const now = +new Date();
		const storedQuotas = Object.keys(this.usage);

		let length = storedQuotas.length;

		if (storedQuotas.length) {
			storedQuotas.forEach(ip => {
				if (this.usage[ip].timestamp + this.options.fetchUsageResetInterval < now) {
					if (this.usage[ip].amount > this.options.maxFetchUsage) {
						console.log(`[${ip}] Usage cleared (${this.usage[ip].amount} -> 0)`);
					}

					delete this.usage[ip];
				}
			});

			length = Object.keys(this.usage).length;

			if (Object.keys(this.usage).length < storedQuotas.length) {
				console.log(`[clean] deleted ${storedQuotas.length - Object.keys(this.usage).length} stored quota(s)`);
			}
		}

		this.emit('quotas', length);
	}

	updatePersistence() {
		if (this.stats.ips) {
			let clients = this.stats.ips;
			let archived = 0;

			if (fs.existsSync('./clients.txt')) {
				clients = (fs.readFileSync('./clients.txt', 'utf8') || '')
					.trim()
					.split("\n")
					.filter(a => a.length);

				clients = clients
					.concat(this.stats.ips);

				clients = clients.filter((a, i) => clients.indexOf(a) === i);

				this.stats.unique = clients.length;
			} else {
				this.stats.unique = this.stats.ips.length;
			}

			this.stats.ips.length && console.log(`[clean] wiped ${this.stats.ips.length} ips from memory`);

			this.emit('unique', this.stats.unique);

			this.stats.ips = [];

			fs.writeFile('clients.txt', clients.join("\n"), err => {
				if (err) {
					console.error(`[persistence] Failed to write clients.txt\n\t`, err);
				}
			});
		}

		return new Promise((resolve, reject) => {
			fs.writeFile('persistence.json', JSON.stringify({
				stats: this.stats,
				usage: this.usage,
				notice: this.notice
			}), err => {
				if (err) {
					console.error(`[persistence] Failed to write persistence.json\n\t`, err);
					return resolve(false);
				}

				return resolve(true);
			});
		});
	}

	getUsage(ip) {
		if (typeof this.usage[ip] === 'undefined') {
			this.usage[ip] = {
				timestamp: +new Date(),
				amount: 0
			}
		}

		return this.usage[ip].amount;
	}

	logUsage(ip, amount) {
		if (typeof this.usage[ip] !== 'undefined') {
			if (this.usage[ip].amount < this.options.maxFetchUsage) {
				this.usage[ip].timestamp = +new Date();
			}

			this.usage[ip].amount += amount;
		}
	}

}

module.exports = Server;