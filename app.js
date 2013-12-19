// Tradebuddy
// author: blabliblubblu321
// simple node.js script, that collects current funds from your btc-e account, 
// calculates your profits based on your last trades and the current price and
// print them out to the terminal every few seconds
// 
// This piece of software probably still has some bugs please open a github issue if you find something
// 
// tips/donations:
// This script is absolutely free to use do with it whatever you want
// If you enjoy using it and it is helpful to you with all the crypto trading madness
// Sens me some coins so I can put more effort and time into fixing bugs making this script way better
// 
// BTC: 1D3Zi7qwvtaMb9uiex9CMqTgR8dLhLqzhG
// btc-e codes to: blabliblubblu321
// 
// SETUP:
// enter an api key/secret with only info credentials below

var apiKey = "YOUR_API_KEY";
var apiSecret = "YOUR_API_SECRET";

// go to this folder in your terminal and run "npm install" to install node.js dependencies
// after that run "node app" to start the script

var BTCE = require('btc-e');
var clc = require('cli-color');

btceTrade = new BTCE(apiKey, apiSecret);



Ctrader = {
  classes: {},
  base: 'btc',
  onlyShowBase: true,
  getRatesFor: ['btc_usd', 'ltc_usd', 'ltc_btc', 'nmc_btc', 'nmc_usd']
};

Ctrader.classes.Trade = function(options) {
  var self = this;
  // console.log(options);
  if (!options) options = {};

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

  this.baseComm = getTarget(this.pair);
  if (this.type === 'sell' && getBase(self.pair) !== 'btc') this.baseComm = getBase(this.pair);

  this.setParent = function(parent) {
    self.parent = parent;
  };

  this.getProfit = function() {
    if (self.parent.getCurrentPrice(self.pair)) {
      if (self.type === 'buy') {

        return self.getAmountNow() - self.getAmountPayed();
      } else {
        return self.getAmountPayed() - self.getAmountNow();
      }

    }
    return null;
  };

  this.getAmountPayed = function() {
    if (self.parent.getCurrentPrice(self.pair)) {

      if (getBase(self.pair) === Ctrader.base) {
        return self.amount * self.rate;
      }

      return self.parent.convertCoins(self.rate * self.amount, getTarget(self.pair), Ctrader.base);
    }
    return null;
  };

  this.getAmountNow = function() {
    if (self.parent.getCurrentPrice(self.pair)) {

      if (getBase(self.pair) === getTarget(self.pair)) {
        return self.amount * self.parent.getCurrentPrice(self.pair);
      }
      return self.parent.convertCoins(self.amount * self.parent.getCurrentPrice(self.pair), getTarget(self.pair), Ctrader.base);


    }
    return null;
  };

  this.getProfitPercent = function() {

    var profit = self.getProfit();

    var profitpc = ((((self.parent.rates[self.pair] - self.rate) / self.rate) * 100)).toFixed(1);

    if ((profit < 0 && profitpc > 0) || (profit > 0 && profitpc < 0)) profitpc = profitpc * -1;

    return profitpc;
  };

  this.logProfit = function() {
    var profit = self.getProfit();
    var payed = self.getAmountPayed();

    var cli_color = 'green';
    if (profit < 0) cli_color = 'red';

    // if (payed > 0) {
    console.log(self.type + ': ' + self.pair + '\tamount: ' + self.fiveDigits(self.amount) + '\t' + self.type + '\trate: ' + self.fiveDigits(self.rate) + '\tcurrent: ' + self.fiveDigits(self.parent.rates[self.pair]) + ' ' + getTarget(self.pair) + '\tpayed: ' + self.fiveDigits(payed) + ' ' + Ctrader.base + '\tnow: ' + self.fiveDigits(self.getAmountNow()) + ' ' + Ctrader.base + '\t\tprofit: ' + clc[cli_color](((profit > 0) ? '+' : '') + self.fiveDigits(profit) + ' ' + Ctrader.base + '\t' + self.getProfitPercent() + '%'));

    // }

  };

  this.fiveDigits = function(amount) {

    amount = parseFloat(amount).toFixed(4);
    if (amount > 10) amount = parseFloat(amount).toFixed(3);
    if (amount > 100) amount = parseFloat(amount).toFixed(2);
    if (amount > 1000) amount = parseFloat(amount).toFixed(1);
    if (amount > 10000) amount = parseFloat(amount).toFixed(0);
    return amount;
  };

  this.getBaseCommodity = function() {
    if (self.type === 'buy') {
      return self.pair.split('_')[1];
    }
    return self.pair.split('_')[0];
  };

};

Ctrader.classes.Exchange = function(options) {
  var self = this;
  this.trades = [];
  this.rates = {};
  this.refreshCounter = 0;
  this.funds = {};

  if (!options) options = {};

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this.options[key] = options[key];
    }
  }
  this.convertCoins = function(amount, source_c, target_c) {
    // console.log(self.rates);
    if (source_c === target_c) {
      return amount;
    }
    if (typeof self.rates[source_c + '_' + target_c] !== 'undefined') {
      // console.log(1);
      return amount * self.rates[source_c + '_' + target_c];
    } else if (typeof self.rates[source_c + '_usd'] !== 'undefined' && typeof self.rates['usd_' + target_c] !== 'undefined') {
      // console.log(2);
      return amount * self.rates[source_c + '_usd'] * self.rates['target_' + target_c];
    } else if (typeof self.rates[source_c + '_btc'] !== 'undefined' && typeof self.rates['btc_' + target_c] !== 'undefined') {
      // console.log(3);
      return amount * self.rates[source_c + '_btc'] * self.rates['btc_' + target_c];
    } else if (source_c === 'usd' && typeof self.rates[target_c + '_usd'] !== 'undefined') {
      // console.log(4);
      return amount / self.rates[target_c + '_usd'];
    }
    return 0;
  };

  this.logAccountBalance = function() {
    // console.log(self.funds);
    // console.log(self.rates);
    var dollarValue = 0;
    var tmpBTC = 0.0;
    for (var key in self.funds) {
      if (self.funds[key] > 0 && typeof self.rates[key + '_usd'] !== 'undefined') {
        dollarValue += parseFloat(self.funds[key] * self.rates[key + '_usd']);
      } else if (key === 'usd') {
        dollarValue += parseFloat(self.funds[key]);
      } else if (self.funds[key] > 0 && typeof self.rates[key + '_btc'] !== 'undefined') {
        tmpBTC += parseFloat(self.funds[key] * self.rates[key + '_btc']);
      }
    }
    dollarValue += (tmpBTC * self.rates['btc_usd']);

    if (dollarValue > 0) {

      console.log('\n');
      console.log('Balance: ' + dollarValue.toFixed(2) + ' $');
      console.log('Balance: ' + (dollarValue / self.rates.btc_usd).toFixed(4) + ' BTC');
    }

  };

  this.addTrade = function(options) {
    // console.log(options);
    self.trades.push(new Ctrader.classes.Trade(options));
    self.trades[(self.trades.length - 1)].setParent(self);
  };
  this.callSync = function(callback_array) {

    if (callback_array.length > 1) {
      var func = callback_array[0];
      callback_array.splice(0, 1);

      func(function() {
        self.callSync(callback_array);
      });
    } else {
      callback_array[0]();
    }
  };

  this.updateRatesFor = function(tradePair, done) {
    return function(err, data) {
      if (err) {
        console.log('updateRatesFor(' + tradePair + ') ' + err);
        if (typeof done !== 'undefined') done();
        return;
      }
      self.rates[tradePair] = data.ticker.sell;
      // console.log('ticker callback');
      if (typeof done !== 'undefined') done();
    };
  };

  this.tickerFunction = function(pair) {
    return function(done) {
      // console.log('ticker start');
      btceTrade.ticker(pair, self.updateRatesFor(pair, done));
    };
  };

  this.updateRates = function() {
    if (typeof self.pairs === 'undefined') {
      self.pairs = [];
    }
    for (var i = 0; i < Ctrader.getRatesFor.length; i++) {

      if (self.pairs.indexOf(Ctrader.getRatesFor[i]) === -1) {
        self.pairs.push(Ctrader.getRatesFor[i]);
      }
    }

    if (typeof self.pairs !== 'undefined') {
      self.refreshCounter++;
    }


    if (self.refreshCounter > 2) {
      self.refreshCounter = 0;
      self.refresh(self.updateRates);
    } else {
      console.log('\n');

      if (typeof self.pairs !== 'undefined') {
        var callSync = [];
        for (var i = 0; i < self.pairs.length; i++) {
          callSync.push(self.tickerFunction(self.pairs[i]));
        }
        callSync.push(function() {

          self.logAllTrades();
          setTimeout(self.updateRates, 15000);
        });

        self.callSync(callSync);

      }

    }

  };

  this.logAllTrades = function() {
    for (var i = 0; i < self.pairs.length; i++) {
      self.logTrades(self.pairs[i]);
    }
  };

  this.logTrades = function(pair) {
    for (var i = 0; i < self.trades.length; i++) {

      if (self.trades[i].pair === pair) self.trades[i].logProfit();
    }
  };

  this.getCurrentPrice = function(pair) {
    if (typeof self.rates[pair] !== 'undefined') {
      return self.rates[pair];
    }
    return false;
  };

  this.setFunds = function(funds) {
    self.funds = funds;
  };

  this.getFunds = function() {
    return self.funds;
  };

  this.addToFund = function(commodity, amount) {
    if (typeof self.funds[commodity] !== 'undefined') self.funds[commodity] += amount;
  };

  this.addOrderToFunds = function(order) {
    if (order.type === 'buy') {
      this.addToFund(getTarget(order.pair), (order.amount * order.rate));
    } else {
      this.addToFund(getBase(order.pair), order.amount);
    }
  };

  this.refreshFunds = function(done) {
    btceTrade.getInfo(function(err, info) {
      if (err) {
        console.log('getInfo ' + err);
        return done();
      }

      self.setFunds(info.funds);
      setTimeout(function() {
        btceTrade.orderList({}, function(err, orders) {
          if (err) {
            console.log('orderList ' + err);
          }
          // console.log(orders);
          for (var key in orders) {
            self.addOrderToFunds(orders[key]);
          }

          self.logAccountBalance();
          if (typeof done !== 'undefined') done();
        });
      }, 500);

    });
  };

  this.refreshTrades = function(done) {


    // console.log(btce.getFunds());
    btceTrade.tradeHistory({}, function(err, info) {
      if (err) {
        console.log('tradeHistory ' + err);
        return done();
      }
      self.trades = [];
      // for (var key in info) {
      //   if (info[key].type === 'sell') delete(info[key]);
      // }
      var tradeArray = [];

      for (var key in info) {
        tradeArray.push(info[key]);
      }

      var tmpFunds = self.getFunds();

      tradeArray.sort(function(a, b) {
        if (a.timestamp < b.timestamp) return 1;
        else if (a.timestamp > b.timestamp) return -1;
        return 0;
      });

      self.pairs = [];

      // console.log(tradeArray);
      for (i = 0; i < tradeArray.length; i++) {

        var baseOrTarget = getBase(tradeArray[i].pair);


        var tradeAmount = tradeArray[i].amount;
        if (tradeArray[i].type === 'sell') {
          baseOrTarget = getTarget(tradeArray[i].pair);
          tradeAmount = (tradeArray[i].amount * tradeArray[i].rate);
        }

        if (tmpFunds[baseOrTarget] >= tradeAmount) {
          // console.log('oben');
          // console.log(tmpFunds);
          // console.log(tradeArray[i]);
          if (self.pairs.indexOf(tradeArray[i].pair) === -1) self.pairs.push(tradeArray[i].pair);

          tmpFunds[baseOrTarget] -= tradeAmount;

          if (tradeArray[i].amount > 0.1) self.addTrade(new Ctrader.classes.Trade(tradeArray[i]));

        } else if (tmpFunds[baseOrTarget] < tradeAmount &&
          tmpFunds[baseOrTarget] > 0) {
          // console.log('unten');
          // console.log(tmpFunds);
          // console.log(tradeArray[i]);
          if (self.pairs.indexOf(tradeArray[i].pair) === -1) self.pairs.push(tradeArray[i].pair);

          if (getTarget(tradeArray[i].pair) === baseOrTarget) {

            tradeArray[i].amount = (tmpFunds[baseOrTarget] / tradeArray[i].rate);
          } else {
            tradeArray[i].amount = tmpFunds[baseOrTarget];
          }
          tmpFunds[baseOrTarget] = 0;

          if (tradeArray[i].amount > 0.1) self.addTrade(new Ctrader.classes.Trade(tradeArray[i]));

        }

      }


      if (typeof done !== 'undefined') done();

    });
  };

  this.refresh = function(done) {
    self.refreshFunds(function() {
      self.refreshTrades(function() {
        done();

      });
    });
  };

  this.init = function() {
    self.refresh(self.updateRates);
  };

  this.init();
};

// functions

function notTargetUsd(trade) {
  if (getBase(trade.pair) === 'usd' && trade.type === 'buy') {
    return false;
  } else if (getTarget(trade.pair) === 'usd' && trade.type === 'sell') {
    return false;
  }
  return true;
}

function getBase(pair) {
  return pair.split('_')[0];
}

function getTarget(pair) {
  return pair.split('_')[1];
}


var btce = new Ctrader.classes.Exchange();
