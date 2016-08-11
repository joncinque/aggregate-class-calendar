var fs = require('fs');
var system = require('system');
var webpage = require('webpage');

function scrapePage(studioId)
{
  const URL = 'https://clients.mindbodyonline.com/classic/home?studioid='+studioId;
  const CLASS_PAGE = 'https://clients.mindbodyonline.com/classic/mainclass?fl=true&tabID=7';

  var studiopage = webpage.create();
  var tablepage = webpage.create();

  var tableresource = null;
  var redirected = false;

  tablepage.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log(msg);
  }

  tablepage.onLoadFinished = function(status) {
    path = studioId + '.html';
    if (status === 'success')
    {
      console.trace('Successful load of table resource, getting table from page');
      var tableElement = tablepage.evaluate(function() {
        return document.querySelector('.classSchedule-mainTable-loaded');
      });
      fs.write(path, tableElement.outerHTML, function(error) {
        if (error) {
          console.error("Error writing:  " + error.message);
        } else {
          console.log("Success writing to " + path);
        }
      });
      /*
      tablepage.includeJs(
        "https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js",
        function() {
          tablepage.evaluate(function() {
            return $('.floatingHeaderRow').get();
          }, function(data) {
            for (var propName in data)
            {
              console.log('prop: ' + propName + ' elem: ' + data[propName]);
              if (propName === 'childNodes' || propName === 'rows')
              {
                console.log(JSON.stringify(data[propName]));
              }
            }
          });
        }
      );
      */
      tablepage.close();
    }
    else
    {
      console.trace('Error loading table resource');
    }
    phantom.exit();
  }

  studiopage.onResourceRequested = function (request) {
    //console.log('= onResourceRequested()');
    //console.log('  request: ' + JSON.stringify(request, undefined, 4));
  };

  studiopage.onResourceReceived = function(response) {
    if (response.stage === "end" &&
        response.url.match(/^https:\/\/clients.mindbodyonline.com\/classic\/mainclass/))
    {
      console.trace('= onResourceReceived()' );
      console.trace('  id: ' + response.id + ', stage: "' + response.stage + '", url: ' + response.url);
      console.trace('including resource: ' + response.url);
      tableresource = response.url;
    }
  };

  studiopage.onLoadStarted = function() {
    console.trace('= onLoadStarted()');
    var currentUrl = studiopage.evaluate(function() {
      return window.location.href;
    });
    console.trace('  leaving url: ' + currentUrl);
  };

  studiopage.onLoadFinished = function(status) {
    console.trace('= onLoadFinished()');
    console.trace('  status: ' + status);
    var currentUrl = studiopage.evaluate(function() {
      return window.location.href;
    });
    console.trace('  url: ' + currentUrl);
    if (status === 'success' && redirected === false)
    {
      if (tableresource === null)
      {
        console.trace('Table resource not found, redirect to correct tab');
        studiopage.open(CLASS_PAGE);
      }
      else
      {
        console.trace('Successful load, now redirecting to: ' + tableresource);
        redirected = true;
        tablepage.open(tableresource);
        studiopage.close();
      }
    }
  };

  studiopage.onNavigationRequested = function(url, type, willNavigate, main) {
    console.trace('= onNavigationRequested');
    console.trace('  destination_url: ' + url);
    console.trace('  type (cause): ' + type);
    console.trace('  will navigate: ' + willNavigate);
    console.trace('  from webpage\'s main frame: ' + main);
  };

  studiopage.onResourceError = function(resourceError) {
    console.trace('= onResourceError()');
    console.trace('  - unable to load url: "' + resourceError.url + '"');
    console.trace('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
  };

  studiopage.onError = function(msg, trace) {
    console.error('= onError()');
    var msgStack = ['  ERROR: ' + msg];
    if (trace) {
      msgStack.push('  TRACE:');
      trace.forEach(function(t) {
        msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
      });
    }
    console.error(msgStack.join('\n'));
  };

  studiopage.open(URL);
}

if (system.args.length > 1)
{
  scrapePage(Number(system.args[1]));
}
else
{
  console.log('Not enough args provided: ' + system.args);
}
//scrapePage(217848);
