var twit = require('twit');
var bitfinex = require('bitfinex');
var fs = require('fs');
var request = require('request');

// Read Configuration File
var config = JSON.parse(fs.readFileSync('cfg.json').toString());

//var ticker = setInterval(tweetTicker, 15 * 60 * 1000);
var balance = setInterval(tweetBalance, 15 * 60 * 1000);

// This function fetches the latest exchange rate and 
// tweets an updated ticker
function tweetTicker() {
  // Fetch latest price
  var options = { url: 'https://api.bitfinex.com/v1/pubticker/BTCUSD',
                  headers: { 'User-Agent': 'PTYcoin Tweeter' },
                  timeout: 15000
                };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      // Extract the ticker price
      var ticker = JSON.parse(body);
      var price = parseFloat(ticker.ask).toFixed(2);

      // Tweet the price
      var msg = 'The latest PTYcoin market price for buying #bitcoin in #Panama is $' + price + '! http://ptycoin.com/buy';
      var twitter = new twit(config);
      twitter.post('statuses/update', { status: msg }, function(err, data, response) { console.log(msg) });

    } else {
      console.log(error);
    }
  });
}

function tweetBalance() {
  var bfx = new bitfinex(config.bitfinex_api, config.bitfinex_secret);
  
  // Fetch Balance
  bfx.wallet_balances(function(err, res, body){
    if (!err) {
      var balance = parseFloat(res[3].available).toFixed(2);
   
      // Convert the balance to BTC at current ticker price
      bfx.ticker('BTCUSD', function(err, res, body) {
        if (!err) {
          var ticker = parseFloat(res.ask).toFixed(2);
          var btc = balance / ticker;

          // Tweet the balance
          var msg = 'PTYcoin currently has ' + btc.toFixed(4) + 
                    ' BTC available at $' + ticker + ' + 1% fee. ' +
                    '#bitcoin #panama http://ptycoin.com/buy';
          var twitter = new twit(config);
          twitter.post('statuses/update', { status: msg }, function(err, data, response) { console.log(msg) });
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
}
