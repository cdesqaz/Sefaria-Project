// Initially copypasta'd from https://github.com/mhart/react-server-example
// https://github.com/mhart/react-server-example/blob/master/server.js

var http           = require('http'),
    express        = require('express'),
    bodyParser     = require('body-parser'),
    cookieParser   = require('cookie-parser'),
    request        = require('request'),
    settings       = require('./local_settings.json'),
    React          = require('react'),
    ReactDOMServer = require('react-dom/server'),
    SefariaReact   = require('../static/js/s2'),
    ReaderApp      = React.createFactory(SefariaReact.ReaderApp);


var server = express();

server.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
server.use(bodyParser.json({limit: '50mb'}));

var renderReaderApp = function(props, data, timer) {
  // Returns HTML of ReaderApp component given `props` and `data`
  if ("recentlyViewed" in props) {
    data.recentlyViewed = props.recentlyViewed;
  }
  data.path     = props.path;
  data.loggedIn = props.loggedIn;
  SefariaReact.setData(data);
  SefariaReact.unpackDataFromProps(props);
  console.log("Time to set data: %dms", timer.elapsed());

  var html  = ReactDOMServer.renderToString(ReaderApp(props));
  console.log("Time to render: %dms", timer.elapsed());
  
  return html;
};

server.post('/ReaderApp/:cachekey', function(req, res) {
  var timer = {
    start: new Date(), 
    elapsed: function() { return (new Date() - this.start); }
  };
  var props = JSON.parse(req.body.propsJSON);
  // var cacheKey = req.params.cachekey 
  console.log(props.initialRefs || props.initialMenu);
  console.log("Time to props: %dms", timer.elapsed());

  request(settings.DJANGO_HOST + "/data.js", function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Time to get data.js: %dms", timer.elapsed());
      eval(body);
      console.log("Time to eval data.js: %dms", timer.elapsed());
      var html = renderReaderApp(props, data, timer);
      res.end(html);
      console.log("Time to complete: %dms", timer.elapsed());  
    } else {
      console.log(error);
      res.end("There was an error accessing /data.js.");
    }
  });
});

server.listen(settings.PORT, function() {
  console.log('Listening on ' + settings.PORT);
});
