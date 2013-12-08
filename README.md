# tradebuddy

collects current funds from your btc-e account, calculates and prints out your profits to terminal all 15 seconds

I have written this script to help me keep an eye on my recent trades but I am absolutely new to this whole trading thing so don't hesiatate to tell me if you have suggestions on what I got wrong or what is missing in here.

simple node.js script, that collects current funds from your btc-e account, 
calculates your profits based on your last trades and the current price and
print them out to the terminal every few seconds

This piece of software probably still has some bugs please open a github issue if you find something

author: **blabliblubblu321**

### example
```
sell: btc_usd	amount: 0.3763	sell	rate: 762.00	current: 737.00 usd	profit: 9.4077 usd	3.3%	profit change: 0%
sell: btc_usd	amount: 1.4691	sell	rate: 765.00	current: 737.00 usd	profit: 41.135 usd	3.7%	profit change: 0%
```

### nonce errors
the btc-e node.js module has a small bug that leads iit to sometimes use the same nonce in two api calls. I have created a pull request until its merged use this fixed version: https://github.com/blabliblubblu321/node-btc-e

### requirements
- node.js
- btc-e api key (info credentials)

## tips/donations:

This script is absolutely free to use do with it whatever you want
If you enjoy using it and it is helpful to you with all the crypto trading madness
Send me some coins so I can put more effort and time into fixing bugs making this script way better

BTC: 1D3Zi7qwvtaMb9uiex9CMqTgR8dLhLqzhG

btc-e codes to: blabliblubblu321

## setup:
enter an api key/secret with only info credentials in app.js

go to this folder in your terminal and run "npm install" to install node.js dependencies
after that run "node app" to start the script

## license

MIT
