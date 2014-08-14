var fb = require('fb');
var bitfinex = require('bitfinex');
var fs = require('fs');
var request = require('request');
var path = require('path');

// Read Configuration File
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'cfg.json')).toString());

// Fetch Facebook Access Token
fb.api('oauth/access_token', {
    client_id: config.facebook_app_id,
    client_secret: config.facebook_app_secret,
    grant_type: 'client_credentials'
  }, function (res) {
    if(!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    config.facebook_access_token = res.access_token;
    console.log(config.facebook_access_token);
  });

//var twitTicker = setInterval(tweetTicker, 15 * 60 * 1000);
var twitBalance = setInterval(tweetBalance, 15 * 60 * 1000);
var bookBalance = setInterval(bookBalance, 60 * 60 * 1000);

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

function bookBalance() {
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

          // Book the balance
          var msg = 'PTYcoin currently has ' + btc.toFixed(4) + 
                    ' BTC available at $' + ticker + ' + 1% fee. ' +
                    '#bitcoin #panama http://ptycoin.com/buy';
          fb.setAccessToken(config.facebook_access_token);
          fb.api('panamabitcoins/feed', 'post', { message: msg }, function (res) {
            if(!res || res.error) {
              console.log(!res ? 'error occurred' : res.error);
              return;
            }
            console.log('Post Id: ' + res.id);
          });
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
}
