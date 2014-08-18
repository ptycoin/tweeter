var twit = require('twit');
var irc  = require('irc');
var bitfinex = require('bitfinex');
var ws = require('ws');
var fs = require('fs');
var request = require('request');
var path = require('path');

// Read Configuration File
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'cfg.json')).toString());

// Setup Balance Variables
var data = { 'ticker': 0, 'balance': 0 };
var rippledata = { 'bid': 0, 'ask': 0 };

//updateBalance();
//var balUpdate = setInterval(updateBalance, 60 * 1000);

// Sets up Ripple Websocket
var ripple = new ws(config.ripple.server);
ripple.on('open', updateRipple);
ripple.on('message', parseRipple);
var rippleUpdate = setInterval(updateRipple, 60 * 1000);

// Sets up IRC Bot
var bot = new irc.Client(config.irc.server, config.irc.botName, { channels : config.irc.channels });
//bot.addListener('raw', function (message) { console.log(message); });
//bot.addListener('error', function(message) { console.log('error: ', message); });
//bot.addListener('registered', function(message) { console.log('registered: ', message); });
//bot.addListener('message', function(nick, to, text, message) { console.log('message: ', text); });
bot.addListener('join', function(channel, nick, message) { updateIRC([ channel ]); });
var ircUpdate = setInterval(updateIRC(config.irc.channels), config.frequency * 60 * 1000);
 
// Setup Twitter Update
var twitter = new twit(config);
var twitterUpdate = setInterval(updateTwitter, config.frequency * 60 * 1000);

function updateBalance() {
  var bfx = new bitfinex(config.bitfinex_api, config.bitfinex_secret);
  
  // Fetch Balance
  bfx.wallet_balances(function(err, res, body){
    if (!err) {
      var balance = parseFloat(res[3].available).toFixed(2);
   
      // Convert the balance to BTC at current ticker price
      bfx.ticker('BTCUSD', function(err, res, body) {
        if (!err) {
          data.ticker = parseFloat(res.ask).toFixed(2);
          data.balance = balance / data.ticker;
          data.balance = data.balance.toFixed(4);
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
}

function updateRipple() {
  // Fetch Bid and Ask 
  var bid = { command : "book_offers",
              limit: 1,
              taker_gets : {
                  currency : "USD",
                  issuer : config.ripple.address
              },
              taker_pays : {
                  currency : "BTC",
                  issuer : config.ripple.address
              }
            };
  var ask = { command : "book_offers",
              limit: 1,
              taker_gets : {
                  currency : "BTC",
                  issuer : config.ripple.address
              },
              taker_pays : {
                  currency : "USD",
                  issuer : config.ripple.address
              }
            };
  ripple.send(JSON.stringify(bid));
  ripple.send(JSON.stringify(ask));
}

function parseRipple(data, flags) {
  var json = JSON.parse(data);
  if (json.status == "success") { 
    if (json.result.offers.length >= 1) {
      if (json.result.offers[0].TakerGets.currency == 'USD') {
        rippledata.bid = parseFloat(json.result.offers[0].TakerGets.value) / parseFloat(json.result.offers[0].TakerPays.value);
        rippledata.bid = rippledata.bid.toFixed(2);
      }
      if (json.result.offers[0].TakerGets.currency == 'BTC') {
        rippledata.ask = parseFloat(json.result.offers[0].TakerPays.value) / parseFloat(json.result.offers[0].TakerGets.value);
        rippledata.ask = rippledata.ask.toFixed(2);
      }
    } 
    console.log('bid', rippledata.bid, '- ask', rippledata.ask);
  }
}

function updateIRC(channels) {
  if (rippledata.bid > 0 || rippledata.ask > 0) {
    var msg = 'PTYcoin Ripple Exchange Rates for BTC/USD: Bid $' + rippledata.bid + 
              ', Ask $' + rippledata.ask + ' #bitcoin #panama http://ptycoin.com/ripple';

    for (i=0; i < channels.length; i++) {
      console.log(channels[i], '-', msg);
      bot.say(channels[i], msg);
    }
  }
}

function updateTwitter() {
  if (data.ticker > 0 && data.balance > 0) {
    //var msg = 'PTYcoin currently has ' + data.balance + 
    //          ' BTC available at $' + data.ticker + ' + 1% fee. ' +
    //          '#bitcoin #panama http://ptycoin.com/buy';
    var msg = 'PTYcoin Ripple Exchange Rates for BTC/USD: Bid $' + rippledata.bid + 
              ', Ask $' + rippledata.ask + ' #bitcoin #panama ptycoin.com/ripple';

    twitter.post('statuses/update', { status: msg }, 
                 function(err, data, response) { 
                   console.log('Twitter -', msg) 
                 });
  }
}
