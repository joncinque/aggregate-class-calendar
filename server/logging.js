let fileInfoOptions = {
  name: 'file.info',
  filename: 'out.log',
  colorize: true,
  level : 'info',
  levels : {debug: 0, info : 1, warn: 2, error: 3},
  colors : {debug: 'blue', info : 'green', warn: 'orange', error: 'red'},
  json: true,
  handleExeptions: true,
  humanReadableUnhandledException: true,
};

let fileErrorOptions = {
  name: 'file.error',
  filename: 'err.log',
  colorize: true,
  level : 'error',
  levels : {debug: 0, info : 1, warn: 2, error: 3},
  colors : {debug: 'blue', info : 'green', warn: 'orange', error: 'red'},
  json: true,
  handleExeptions: true,   
  humanReadableUnhandledException: true,
};

// Share the same transport(=File) between 2 different files...
// one for debug & the other file for errors only.
logger.addTransport('file', fileInfoOptions);
logger.addTransport('file', fileErrorOptions);

let consoleOptions = {
  colorize: true,
  level : 'info',
};
logger.addTransport('console', consoleOptions);

let papertrailOptions = {
  host: 'logs5.papertrailapp.com', // Replace with your papertrail app URL
  port: 44279, // Replace with your papertrail app's port number
  logFormat: function(level, message) {
    return '[' + level + '] ' + message;
  },
  inlineMeta: true,
  json: true,
  colorize: true,
  handleExeptions: true
};

// Simply add the papertrail transport
logger.addTransport('papertrail', papertrailOptions);
