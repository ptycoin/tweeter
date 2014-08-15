var twit = require('twit');
var irc  = require('irc');
var bitfinex = require('bitfinex');
var fs = require('fs');
var request = require('request');
var path = require('path');

// Read Configuration File
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'cfg.json')).toString());

// Setup Balance Variables
var data = { 'ticker': 0, 'balance': 0 };
updateBalance();
var balUpdate = setInterval(updateBalance, 60 * 1000);

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
updateTwitter();
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

function updateIRC(channels) {
  if (data.ticker > 0 && data.balance > 0) {
    var msg = 'PTYcoin currently has ' + data.balance + 
              ' BTC available at $' + data.ticker + ' + 1% fee. ' +
              'http://ptycoin.com/buy';

    for (i=0; i < channels.length; i++) {
      console.log(channels[i], '-', msg);
      bot.say(channels[i], msg);
    }
  }
}

function updateTwitter() {
  if (data.ticker > 0 && data.balance > 0) {
    var msg = 'PTYcoin currently has ' + data.balance + 
              ' BTC available at $' + data.ticker + ' + 1% fee. ' +
              '#bitcoin #panama http://ptycoin.com/buy';

    twitter.post('statuses/update', { status: msg }, 
                 function(err, data, response) { 
                   console.log('Twitter -', msg) 
                 });
  }
}
