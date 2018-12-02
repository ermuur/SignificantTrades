## How to install
1. Clone the repo

```bash
git clone https://github.com/Tucsky/SignificantTrades -b feature/server api/
```

2. Install dependencies

```bash
cd api/
npm install
```

3. Run server

```bash
node index
```

...

5. Profit !

## Configuration
All settings are optional and can be changed in the [server configuration file](server/config.json.example) (rename config.json.example into config.json as the real config file is untracked on github).

```js
{
  // the port which the server will be served at 
  "port": 3000,
  
  // delay (in ms) between server each broadcast to avoid saturation
  "delay": 200, // (the higher the better performance wise)
  
  // pair used by the server
  "pair": "BTCUSD"

  // restrict origin (now using regex)
  origin: '.*',

  // max interval an ip can fetch in a limited amount of time (usage restriction, default 7 day)
  maxFetchUsage: 1000 * 60 * 60 * 24 * 7,

  // the limited amount of time in which the user usage will be stored
  fetchUsageResetInterval: 1000 * 60 * 10,

  // admin access type (whitelist, all, none)
  admin: 'whitelist',

  // enable websocket server on startup
  websocket: true,

  // storage solution, either 
  // "none" (no storage, everything is wiped out after broadcast)
  // "files" (periodical text files),
  // "influx" (time serie database),
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
}
```

All options can be set using CLI
- Setting port `node index port=3001`
- Setting port & pair `node index port=3002 pair=ETHUSD`
- Setting port & pair and restrict to some exchanges `node index port=3002 pair=ETHUSD bitmex bitfinex kraken`

*Like whats been done here ?* Donate<br>
[3NuLQsrphzgKxTBU3Vunj87XADPvZqZ7gc](bitcoin:3NuLQsrphzgKxTBU3Vunj87XADPvZqZ7gc)