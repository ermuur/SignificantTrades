

## How to install & run the server
1. Clone the repo

```bash
git clone https://github.com/Tucsky/SignificantTrades -b server server/
```

2. Install server dependencies & run it

```bash
cd server
npm install
node index
```

3. Install client dependencies then run

```bash
cd client
npm install
npm run dev
```

4. Open a browser window at localhost:8080

...

5. Profit !

## Configuration

All settings are optional and can be changed in the [server configuration file](server/config.json.example) (rename config.json.example into config.json as the real config file is untracked on github).

```js
{
  // the port which the server will be at 
  "port": 3000,
  
  // delay (in ms) between server broadcasts to avoid large event saturation
  "delay": 200, // (the larger the better performance wise)
  
  // default pair it should use 
  "pair": "BTCUSD"
}
```

*Like whats been done here ?* Donate BTC (segwit)<br>
[3NuLQsrphzgKxTBU3Vunj87XADPvZqZ7gc](bitcoin:3NuLQsrphzgKxTBU3Vunj87XADPvZqZ7gc)
