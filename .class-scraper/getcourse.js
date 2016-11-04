var fs = require('fs');
var system = require('system');
var webpage = require('webpage');

// This will eventually get filled out with additional providers as needed,
// and let's hope they aren't more complicated than MBO.
var PROVIDER_INFO = 
{
  "MBO": 
  {
    urlPattern: 'https://clients.mindbodyonline.com/classic/home?studioid=',
    forcePage: 'https://clients.mindbodyonline.com/classic/mainclass?fl=true&tabID=7',
    tableResourcePattern: /^https:\/\/clients.mindbodyonline.com\/classic\/mainclass/,
    tableCssClass: '.classSchedule-mainTable-loaded',
    locationCssId: '#optLocation',
    viewModeCssId: '#week-tog-c',
    selectedViewModeCssId: '#week-tog-c.date-tog-sel-c',
  }
};

function dumpClassTable(providerInfo, // all info about the HTML page
    studioId, // studio number with the provider
    redirectPage, // optional extra redirect to use if page is weird
    numRetries, // how many more times to try scraping
    timeout, // how long to wait to reload, incremented with each retry
    verbose) // extra printing
{
  const URL = providerInfo.urlPattern + studioId;

  var studiopage = webpage.create();
  var tablepage = webpage.create();

  var needsTableResource = (providerInfo.tableResourcePattern !== null);
  var tableresource = null;
  var redirectedToTable = false;
  var redirected = false;

  /* For really verbose debugging
  tablepage.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.trace(msg);
  }

  studiopage.onLoadStarted = function() {
    console.trace('= onLoadStarted()');
    var currentUrl = studiopage.evaluate(function() {
      return window.location.href;
    });
    console.trace('  leaving url: ' + currentUrl);
  };

  studiopage.onNavigationRequested = function(url, type, willNavigate, main) {
    console.trace('= onNavigationRequested');
    console.trace('  destination_url: ' + url);
    console.trace('  type (cause): ' + type);
    console.trace('  will navigate: ' + willNavigate);
    console.trace('  from webpage\'s main frame: ' + main);
  };

  studiopage.onResourceRequested = function (request) {
    console.trace('= onResourceRequested()');
    console.trace('  request: ' + JSON.stringify(request, undefined, 4));
  };
  */

  var ALL_LOCATIONS_INDEX = 0;

  dumpPageTimeout = null;
  tablepage.onLoadFinished = function(status) {
    if (status === 'success')
    {
      // Use a timeout here because iframes all trigger "onLoadFinished" again
      if (verbose) {
        console.log('Finished loading table resource');
      }

      if (dumpPageTimeout === null)
      {
        dumpPageTimeout = setTimeout(function(){
          var locationChanged = tablepage.evaluate(function(locationCssId, ALL_LOCATIONS_INDEX){
            var locationDropdown = document.querySelector(locationCssId);
            var changed = false;
            if (locationDropdown !== null &&
                locationDropdown.selectedIndex !== ALL_LOCATIONS_INDEX)
            {
              locationDropdown.selectedIndex = ALL_LOCATIONS_INDEX;
              locationDropdown.onchange();
              changed = true;
            }
            return changed;
          }, providerInfo.locationCssId, ALL_LOCATIONS_INDEX);
          if (verbose) {
            console.trace('Changed location: [' + locationChanged + ']');
          }

          setTimeout(function() {
            var viewChanged = tablepage.evaluate(function(viewModeCssId, selectedViewModeCssId){
              var correctView = document.querySelector(selectedViewModeCssId);
              console.log(correctView);
              if (correctView !== null && correctView !== undefined)
              {
                return false;
              }
              else
              {
                var viewMode = document.querySelector(viewModeCssId);
                console.log(viewMode);
                viewMode.click();
                return true;
              }
            }, providerInfo.viewModeCssId, providerInfo.selectedViewModeCssId);

            if (verbose) {
              console.trace('Changed view mode: [' + viewChanged + ']');
            }

            setTimeout(function(){
              // The execution of "evaluate" is sandboxed, so pass in extra 
              // parameters from the outside.
              var tableElement = tablepage.evaluate(function(tableCssClass) {
                return document.querySelector(tableCssClass);
              }, providerInfo.tableCssClass);
              var path = Math.abs(studioId) + '.html';
              if (tableElement.outerHTML === '')
              {
                if (numRetries > 0)
                {
                  if (verbose) {
                    console.error('No html found, retrying [' + path + ']');
                  }
                  studiopage.close();
                  tablepage.close();
                  dumpClassTable(providerInfo,
                      studioId,
                      redirectPage,
                      timeout + DEFAULT_TIMEOUT_INCREMENT,
                      numRetries - 1,
                      verbose);
                }
                else
                {
                  if (verbose) {
                    console.error('No html found, done trying [' + path + ']');
                  }
                  studiopage.close();
                  tablepage.close();
                  phantom.exit();
                }
              }
              else
              {
                fs.write(path, tableElement.outerHTML, function(error) {
                  if (error) {
                    console.error('Error writing: ' + error.message);
                  } else {
                    console.error('Success writing: ' + error.message);
                  }
                });
                tablepage.close();
                phantom.exit();
              }
            }, viewChanged ? timeout : 0);
          }, locationChanged ? timeout : 0);
        }, timeout);
      }
    }
  }

  studiopage.onResourceReceived = function(response) {
    if (needsTableResource &&
        response.stage === "end" &&
        response.url.match(providerInfo.tableResourcePattern))
    {
      if (verbose) {
        console.trace('= onResourceReceived()' );
        console.trace('  id: ' + response.id + ', stage: "' + response.stage + '", url: ' + response.url);
        console.trace('Will get table resource: ' + response.url);
      }
      tableresource = response.url;
    }
  };

  studiopage.onLoadFinished = function(status) {
    if (verbose) {
      console.trace('= onLoadFinished()');
      console.trace('  status: ' + status);
      var currentUrl = studiopage.evaluate(function() {
        return window.location.href;
      });
      console.trace('  url: ' + currentUrl);
    }
    if (status === 'success')
    {
      if (redirectPage !== '' && redirected === false)
      {
        tableresource = null;
        redirected = true;
        studiopage.open(redirectPage);
      }

      if (needsTableResource)
      {
        if (redirectedToTable === false)
        {
          if (tableresource === null)
          {
            if (verbose) {
              console.trace('Table resource not found, forcing redirect');
            }
            studiopage.open(providerInfo.forcePage);
          }
          else
          {
            if (verbose) {
              console.trace('Successful load, now requesting table resource');
            }
            redirectedToTable = true;
            tablepage.open(tableresource);
            studiopage.close();
          }
        }
      }
      else
      {
        if (verbose) {
          console.trace('Successful load of page, getting table');
        }
        var tableElement = studiopage.evaluate(function(tableCssClass) {
          return document.querySelector(tableCssClass);
        }, providerInfo.tableCssClass);
        var path = Math.abs(studioId) + '.html';
        fs.write(path, tableElement.outerHTML, function(error) {
          if (error) {
            if (verbose) {
              console.error("Error writing:  " + error.message);
            }
          } else {
            if (verbose) {
              console.log("Success writing to " + path);
            }
          }
        });
        studiopage.close();
        phantom.exit();
      }
    }
    else
    {
      if (verbose) {
        console.error('Error loading studio page');
      }
    }
  };

  studiopage.onResourceError = function(resourceError) {
    //console.trace('= onResourceError()');
    //console.trace('  - unable to load url: "' + resourceError.url + '"');
    //console.trace('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
  };

  studiopage.onError = function(msg, trace) {
    //console.error('= onError()');
    var msgStack = ['  ERROR: ' + msg];
    if (trace) {
      msgStack.push('  TRACE:');
      trace.forEach(function(t) {
        msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
      });
    }
    //console.error(msgStack.join('\n'));
  };

  studiopage.open(URL);
}

var DEFAULT_RETRIES = 0;
var DEFAULT_TIMEOUT = 5000;
var DEFAULT_TIMEOUT_INCREMENT = 2000;
var VERBOSE = false;
if (system.args.length === 4)
{
  dumpClassTable(PROVIDER_INFO[system.args[1]],
      system.args[2],
      system.args[3],
      DEFAULT_RETRIES,
      DEFAULT_TIMEOUT,
      VERBOSE);
}
else
{
  //console.log('Not enough args provided: ' + system.args);
  phantom.exit();
}
