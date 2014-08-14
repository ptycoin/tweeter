var twit = require('twit');
var fs = require('fs');
var request = require('request');

// Read Configuration File
var config = JSON.parse(fs.readFileSync('cfg.json').toString());

// Fetch latest price
var options = { url: 'https://api.bitfinex.com/v1/ticker/BTCUSD',
                headers: { 'User-Agent': 'PTYcoin Tweeter' },
                timeout: 15000
              };

request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body); // Print the google web page.
    //var twitter = new twit(config);
    //twitter.post('statuses/update', { status: 'hello world!' });
  } else {
    console.log(error);
  }
});
