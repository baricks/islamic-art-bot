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
var twitterRestClient = new Twitter.RestClient(
  conf.consumer_key,
  conf.consumer_secret,
  conf.access_token,
  conf.access_token_secret
);

var baseUrl = 'http://www.metmuseum.org/api/collection/collectionlisting?department=14&offset=500&pageSize=0&sortBy=Relevance&sortOrder=asc&perPage=500&page=';

wordfilter.addWords(['Coin','Fragment','Cover']);

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function generate() {
  var dfd = new _.Deferred();

console.log('Going to request');
  var url = baseUrl + Math.floor((Math.random() * 54) + 1);
  console.log(url)
  request(url, function (error, response, body) {
    console.log('reqed',error, response.statusCode);
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body).results.pick();
      console.log(data);
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
          console.log('done');
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

function tweet() {
  // TODO Change this so that it alternates between tweeting different things

  // 30 min - tweet quote

  // 30 min - tweet architecture
  // TODO Find an API for architecture

  // 30 min - tweet quote

  // 30 min - tweet image

  generate().then(function(myTweet, bigImageUrl) {
    if (!wordfilter.blacklisted(myTweet)) {
      console.log(myTweet);
      twitterRestClient.statusesUpdateWithMedia({
        'status': myTweet,
        'media[]': 'image.jpg'
      },

      function(error, result) {
        if (error) {
          console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        }
        if (result) {
          console.log("It worked");
        }
      });
    }
  });
}

// Tweet once on initialization
tweet();
