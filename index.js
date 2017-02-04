// Big thanks to Darius Kazemi's work on @MuseumBot for this code and inspiration. Find the github here: https://github.com/dariusk/museumbot
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var wordfilter = require('wordfilter');
var conf = require('./config.js');
var Twitter = require('node-twitter');
var myTweetQuote;
var twitterRestClient = new Twitter.RestClient(
  conf.consumer_key,
  conf.consumer_secret,
  conf.access_token,
  conf.access_token_secret
);

// Base URL

var baseUrl = 'http://www.metmuseum.org/api/collection/collectionlisting?department=14&perPage=100&showOnly=withImage&sortBy=Relevance&offset=';

wordfilter.addWords(['Coin','Fragment','Cover', "Bottle", "Allah"]);

// Pick random item from the page

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function generate() {
  var dfd = new _.Deferred();

// Make the request

console.log('Going to request');
  var offset_number = Math.floor((Math.random() * 119) + 1)
  var url = baseUrl + offset_number + '00'; // Pick a random page
  console.log(url)
  request(url, function (error, response, body) {
    //console.log('reqed',error, response.statusCode);
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body).results.pick();
      //console.log(data);
      var name = data.title;
      var date = data.date;
      var medium = data.medium;
      var fields = data.url.split('?');
      var thingUrl = 'http://www.metmuseum.org' + fields[0];
      var bigImageUrl = 'http://images.metmuseum.org/CRDImages/' + data.largeImage;
      // go to page for thing
      if (data.largeImage) {
        var stream = fs.createWriteStream('image.jpg');
        stream.on('close', function() {
          //console.log('done');
          dfd.resolve(name + ', ' + date + '. ' + thingUrl, bigImageUrl, '<a href="' + thingUrl + '">' + name + '</a><br><br>The Metropolitan Museum of Art');
        });
        var r = request(bigImageUrl).pipe(stream);
      }
      else {
        dfd.reject();
        tweet();
      }
    }
    else {
      dfd.reject();
      tweet();
    }
  });

  return dfd.promise();
}

function strip() {

  var authors = [];

  var rumi_quote = fs.readFileSync('./quotes/rumi.txt').toString('utf-8').split("\n");
  var hafiz_quote = fs.readFileSync('./quotes/hafiz.txt').toString('utf-8').split("\n");
  var darwish_quote = fs.readFileSync('./quotes/darwish.txt').toString('utf-8').split("\n");
  var ghazali_quote = fs.readFileSync('./quotes/al_ghazali.txt').toString('utf-8').split("\n");
  var pamuk_quote = fs.readFileSync('./quotes/pamuk.txt').toString('utf-8').split("\n");
  var gibran_quote = fs.readFileSync('./quotes/gibran.txt').toString('utf-8').split("\n");

  authors.push(rumi_quote, hafiz_quote, darwish_quote, ghazali_quote, pamuk_quote, gibran_quote);
  var n = Math.floor((Math.random() * authors.length));
  var pick_author = authors[n];

  var m = Math.floor((Math.random() * pick_author.length));
  var pick_quote = pick_author[m];

  myTweetQuote = pick_quote;

}

function tweet() {
  // TODO Change this so that it alternates between tweeting different things

  // create the tweet for quotes
  strip();

  // Tweet the quote
  if (!wordfilter.blacklisted(myTweetQuote)) {
    twitterRestClient.statusesUpdate({
      'status': myTweetQuote
    },

    function(error, result) {
      if (error) {
        console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        process.exit()
      }
      if (result) {
        console.log("Uploaded quote tweet");
      }
    });
  }

  // Tweet the image

  generate().then(function(myTweet, bigImageUrl) {
    if (!wordfilter.blacklisted(myTweet)) {
      //console.log(myTweet);

      twitterRestClient.statusesUpdateWithMedia({
        'status': myTweet,
        'media[]': 'image.jpg'
      },

      function(error, result) {
        if (error) {
          console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
          process.exit();
        }
        if (result) {
          console.log("Uploaded MET image tweet");
        }
      });
    }
  });
}

// Tweet once on initialization
tweet();
