const EventEmitter = require('events');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const http = require('http');
const axios = require('axios');

class Server extends EventEmitter {

	constructor(options) {
		super();

		this.timestamps = {};
		this.connected = false;
		this.processingAction = false;
		this.chunk = [];
		this.lockFetch = true;

		this.options = Object.assign({

			// default pair we track
			pair: 'BTCUSD',

			// default server port
			port: 3000,

			// dont broadcast below ms interval
			delay: 0,

			// restrict origin
			origin: '.*',

			// max interval an ip can fetch in a period of time (default 1 day)
			maxUsage: 1000 * 60 * 60 * 24,

			// usage period reset
			usageResetInterval: 1000 * 60 * 10,

			// do backup interval
			backupInterval: 1000 * 60 * 10,

			// create backup file every X ms
			backupTimeframe: 1000 * 60 * 60 * 24,

			// admin access type (whitelist, all, none)
			admin: 'whitelist',

			// enable websocket server
			websocket: true,

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

		this.listen();
		this.connect();

		this.createWSServer();
		this.createHTTPServer();

		this.updateIpsInterval = setInterval(this.updateIps.bind(this), 1000 * 60);
		this.cleanupUsageInterval = setInterval(this.cleanupUsage.bind(this), 1000 * 90);
		this.updatePersistenceInterval = setInterval(this.updatePersistence.bind(this), 1000 * 60 * 7);
		this.profilerInterval = setInterval(this.profiler.bind(this), 1000 * 60 * 3);
		this.backupInterval = setInterval(this.updateDayTrades.bind(this), this.options.backupInterval);

		setTimeout(() => {
			console.log(`[server] Fetch API unlocked`);

			this.lockFetch = false;
		}, 1000 * 60);
	}

	listen() {
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
			const ip = this.getIp(req);
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

			console.log(`[${ip}/ws${ws.admin ? '/admin' : ''}] joined ${req.url} from ${req.headers['origin']}`, usage ? '(RL: ' + ((usage / this.options.maxUsage) * 100).toFixed() + '%)' : '');

			this.emit('connections', this.wss.clients.size);

			ws.send(JSON.stringify(data));

			ws.on('message', event => {
				if (this.processing) {
					console.log(`[${ip}/cmd] message blocked due to current action`, event);
				}

				let method, message;

				try {
					const json = JSON.parse(event);

					method = json.method;
					message = json.message;
				} catch (error) {
					console.log(`[${ip}/cmd]`, 'invalid message', event);
					return;
				}

				switch (method) {
					case 'pair':
						if (!ws.admin) {
							return;
						}

						this.options.pair = message.toUpperCase();

						console.log(`[${ip}/cmd] switching pair`, this.options.pair);

						this.action(method, next => {
							this.disconnect();

							this.broadcast({
								type: 'pair',
								pair: this.options.pair,
							})

							setTimeout(() => {
								this.connect();

								next();
							}, 5000);
						})
					break;
					default:
						console.log(`[${ip}/cmd] unrecognized method`, method);
					break;
				}
			});

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

			const ip = this.getIp(req);
			const usage = this.getUsage(ip);
			let path = url.parse(req.url).path;

			if (!new RegExp(this.options.origin).test(req.headers['origin'])) {
				console.error(`[${ip}/BLOCKED] socket origin mismatch "${req.headers['origin']}"`);

				if (req.headers.accept.indexOf('json') > -1) {
					setTimeout(function() {
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
				match: /^\/?history\/(\d+)(?:\/(\d+))?\/?$/,
				response: (from, to) => {
					response.setHeader('Content-Type', 'application/json');

					if (this.lockFetch) {
						showHelloWorld = false;

						setTimeout(function() {
							response.end('[]');
						}, Math.random() * 5000);

						return;
					}

					let date, path, chunk, output = [];

					from = +from;
					to = +to;

					if (isNaN(from) && isNaN(to)) {
						response.writeHead(400);
						response.end(JSON.stringify({error: 'Missing interval'}));
						return;
					}

					if (isNaN(to)) {
						if (from > 60) {
							response.writeHead(400);
							response.end(JSON.stringify({error: 'Max look back is 60mins at once, please set a lower range'}));
							return;
						} else {
							to = +new Date();
							from = to - from * 60 * 1000;
						}
					}

					if (from > to) {
						response.writeHead(400);
						response.end(JSON.stringify({error: 'Invalid interval'}));
						return;
					}

					if (to - from > this.options.backupTimeframe * 1) {
						response.writeHead(400);
						response.end(JSON.stringify({error: 'Interval cannot exceed 1 day'}));
						return;
					}

					if (usage > this.options.maxUsage && to - from > 1000 * 60) {
						response.end('[]');
						return;
					}

					const ts = +new Date();

					for (let i = +new Date(new Date(+from).setHours(0, 0, 0, 0)); i <= to; i += this.options.backupTimeframe) {
						date = new Date(i);
						path = this.getBackupFilename(date);

						try {
							chunk = fs.readFileSync(path, 'utf8').trim().split("\n");

							if (chunk[0].split(' ')[1] >= from && chunk[chunk.length - 1].split(' ')[1] <= to) {
								output = output.concat(chunk.map(row => row.split(' ')));
							} else {

								for (let j = 0; j < chunk.length; j++) {
									const trade = chunk[j].split(' ');

									if (trade[1] <= from || trade[1] >= to) {
										continue;
									}

									output.push(trade);
								}
							}
						} catch (error) {
							// console.log(`[server/history] unable to get ${path} (ms ${i})\n\t`, error.message);
						}
					}

					for (let i = 0; i < this.chunk.length; i++) {
						if (this.chunk[i][1] <= from || this.chunk[i][1] >= to) {
							continue;
						}

						output.push(this.chunk[i]);
					}

					if (to - from > 1000 * 60) {
						console.log(`[${ip}] requesting ${this.getHms(to - from)} (${output.length} trades, took ${this.getHms(+new Date() - ts)}, consumed ${(((usage + to - from) / this.options.maxUsage) * 100).toFixed()}%)`);
					}

					this.logUsage(ip, to - from);

					response.end(JSON.stringify(output));
				}
			},
			{
				match: /^\/?cors\/(.*)\/?$/,
				response: (arg) => {
					const location = url.parse(arg);

					if (req.method !== 'POST' && req.method !== 'GET') {
						console.log(`[${ip}/cors] cors request method invalid (${req.method})`);
					}

					if ([
						'api.kraken.com',
						'api.binance.com',
						'api.bitfinex.com',
						'api.gdax.com',
						'api.pro.coinbase.com',
						'api.prime.coinbase.com',
						'www.bitstamp.net',
						'api.hitbtc.com',
						'poloniex.com',
						'www.okex.com',
						'api.huobi.pro',
						'www.bitmex.com',
						'api.coinex.com',
					].indexOf(location.hostname) === -1) {
						console.log(`[${ip}/cors] unknown host ${location.hostname}`);
					} else {
						showHelloWorld = false;

						console.log(`[${ip}/cors] ${location.host} -> ${location.pathname}`);

						axios[req.method.toLowerCase()](arg)
							.then(_response => {
								response.writeHead(200);
								response.end(_response.data && typeof _response.data === 'object' ? JSON.stringify(_response.data) : _response.data);
							})
							.catch(error => {
								console.log(error);
								response.writeHead(500);
								response.end();
							})
					}
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
							<small>24/7 aggregator for BTCUSD</small>
						</body>
					</html>
				`);
			}
		});

		this.http.on('upgrade', (req, socket, head) => {
			const ip = this.getIp(req);

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

	connect() {
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

	disconnect() {
		console.log('[server] disconnect exchanges');

		clearInterval(this.delayInterval);

		this.connected = false;

		this.exchanges.forEach(exchange => {
			exchange.disconnect();
		});

		this.queue = [];
	}

	action(method, fn) {
		if (this.processingAction) {
			return console.error('[warning] wait until current action is done');
		}

		console.log(`[${method}] starting`);

		this.processingAction = true;

		fn(() => {
			console.log(`[${method}] done`);
			this.processingAction = false;
		});
	}

	profiler() {
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
				if (this.usage[ip].timestamp + this.options.usageResetInterval < now) {
					if (this.usage[ip].amount > this.options.maxUsage) {
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

			console.log(`[clean] wiped ${this.stats.ips.length} ips from memory`);

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

	updateDayTrades(exit = false) {
		return new Promise((resolve, reject) => {
			if (!this.chunk.length) {
				return resolve(true);
			}

			console.log(`[server/backup] preparing to backup ${this.chunk.length} trades... (${this.getHms(this.options.backupInterval)} of data)`);

			if (!fs.existsSync('./data')){
				fs.mkdirSync('./data');
			}

			const processDate = (date) => {
				const nextDateTimestamp = +date + this.options.backupTimeframe;
				const path = this.getBackupFilename(date);

				console.log(`[server/backup] retrieve trades < ${nextDateTimestamp}`);

				let tradesOfTheDay = [];

				for (let i = 0; i < this.chunk.length; i++) {
					if (this.chunk[i][1] < nextDateTimestamp) {
						tradesOfTheDay.push(this.chunk[i]);
						this.chunk.splice(i, 1);
						i--;
					}
				}

				if (!tradesOfTheDay.length) {
					console.log(`[server/backup] no trades that day, on to the next day (first timestamp: ${this.chunk[0][1]})`);
					return processDate(new Date(nextDateTimestamp));
				}

				console.log(`[server/backup] write ${tradesOfTheDay.length} trades into ${path}`);

				fs.appendFile(path, tradesOfTheDay.map(trade => trade.join(' ')).join("\n") + "\n", (err) => {
					if (err) {
						throw new Error(err);
					}

					if (this.chunk.length && this.chunk[0][1] >= nextDateTimestamp) {
						console.log(`[server/backup] next chunk start at ${this.chunk[0][1]}, next day at ${nextDateTimestamp}`);

						return processDate(new Date(nextDateTimestamp));
					} else {
						return resolve(true);
					}
				});
			}

			processDate(new Date(new Date(this.chunk[0][1]).setHours(0, 0, 0, 0)));
		});
	}

	getBackupFilename(date) {
		return 'data/' + (this.options.pair + '_' + date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2));
	}

	getHms(d) {
		var h = Math.floor(d / 1000 / 3600);
		var m = Math.floor(d / 1000 % 3600 / 60);
		var s = Math.floor(d / 1000 % 3600 % 60);
		var output = '';

		output += (h > 0 ? h + 'h' + (m ? ', ' : '') : "");
		output += (m > 0 ? m + 'm' + (s ? ', ' : '') : "");
		output += (s > 0 ? s + 's' : "");

		if (!output.length || (d < 60 * 1000 && d > s * 1000))
			output += (output.length ? ', ' : '') + (d - s * 1000) + 'ms';

		return output.trim();
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
			if (this.usage[ip].amount < this.options.maxUsage) {
				this.usage[ip].timestamp = +new Date();
			}

			this.usage[ip].amount += amount;
		}
	}

	getIp(req) {
		let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

		if (ip.indexOf('::ffff:') === 0) {
			ip = ip.substr('::ffff:'.length, ip.length);
		}

		return ip;
	}

}

module.exports = Server;