'use strict';

const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const EventEmitter = require('events');

//const getcourse = require('./getcourse'); // used by phantom file
const parsecourse = require('./parsecourse');
const chromegetcourse = require('./chromegetcourse');
const logger = require('./logger');

const WEB_IMPORT = false;
const MONGO_IMPORT = true;

let sep = '';
function makeFileLogger(fileStream)
{
  return (course) =>
  {
    fileStream.write(sep);
    if (sep === '') {
      if (WEB_IMPORT) {
        sep = ',\n';
      } else {
        sep = '\n';
      }
    }
    fileStream.write('{ "name": "' + course.name + '"');
    fileStream.write(', "teacher": "' + course.teacher + '"');
    fileStream.write(', "room": "' + course.room + '"');
    fileStream.write(', "style": "' + course.style + '"');
    if (MONGO_IMPORT) {
      fileStream.write(', "start": ISODate("' + course.start.toDate().toJSON() + '")');
      fileStream.write(', "end": ISODate("' + course.end.toDate().toJSON() + '")');
    } else {
      fileStream.write(', "start": "' + course.start.toDate().toJSON() + '"');
      fileStream.write(', "end": "' + course.end.toDate().toJSON() + '"');
    }
    fileStream.write(', "locale": "' + course.locale + '"');
    fileStream.write(', "studio": "' + course.studio + '"');
    fileStream.write(', "url": "' + course.url + '"');
    fileStream.write(', "booking": "' + course.booking + '"');
    fileStream.write(', "postcode": "' + course.postcode + '"');
    fileStream.write(', "timezone": "' + course.timezone + '"');
    fileStream.write('}');
  }
}

function logClasses(courses, outputFileStream)
{
  outputFileStream.cork();
  let loggerFunc = makeFileLogger(outputFileStream);
  courses.forEach(loggerFunc);
  outputFileStream.uncork();
}

function makeFileCallback(studio, outputFileStream)
{
  return function(courses)
  {
    logger.info('Finished for studio: ' + studio.name);
    courses.forEach(makeFileLogger(outputFileStream));
  }
}

function getCoursesPhantom(studio, callback)
{
  const htmlFile = Math.abs(studio.studioid) + '.html';
  return phantomjs.run('getcourse.js', 
      studio.provider,
      studio.studioid,
      studio.redirectPage)
    .then(program => {
      return parsecourse.parsePage(htmlFile, studio, callback);
    })
    .then(data => {
      return data;
    });
}

let getCoursesChrome = (studio, callback)=>
{
  const htmlFile = Math.abs(studio.studioid) + '.html';
  return chromegetcourse.dumpCourseTable(
      studio.provider,
      studio.studioid,
      studio.redirectPage
      ).once('finish-dumping', 
        parsecourse.makeParsePageEventEmitter(studio, callback));
}

function getAllCourses(studioFile, outputFile, resumeFromId)
{
  let data = fs.readFileSync(studioFile, 'utf8');
  let outputFileStream = fs.createWriteStream(outputFile, {
      flags: 'a' // 'a' means appending (old data will be preserved)
  });

  if (WEB_IMPORT) {
    if (resumeFromId) {
      sep = ',\n';
    } else {
      outputFileStream.write('[');
    }
  }

  const studioInfo = JSON.parse(data);
  let index = 0;
  if (resumeFromId) {
    logger.info('Looking for id: ' + resumeFromId);
    for (let i in studioInfo) {
      if (studioInfo[i].studioid == resumeFromId) {
        logger.info('Starting from index: ' + i);
        index = i;
        break;
      }
    }
  }
  let ee = new EventEmitter();
  ee.on('finish-studio', (index)=>{
    if (index < studioInfo.length) {
      let studio = studioInfo[index];
      try {
        getCoursesChrome(studio
            ).once('finish-scraping', (data)=>{
              logClasses(data, outputFileStream);
              logger.info('Finished for studio: ' + studio.name);
              ee.emit('finish-studio', ++index);
            }).once('error', (data)=>{
              ee.emit('finish-studio', ++index);
            });
      } catch (err) {
        logger.error('Scraping failed, trying once more');
        getCoursesChrome(studio
            ).once('finish-scraping', (data)=>{
              logClasses(data, outputFileStream);
              logger.info('Finished for studio: ' + studio.name);
              ee.emit('finish-studio', ++index);
            }).once('error', (data)=>{
              ee.emit('finish-studio', ++index);
            });
      }
    } else {
      if (WEB_IMPORT) {
        outputFileStream.cork();
        outputFileStream.write(']');
        outputFileStream.uncork();
      }
      logger.info('Finished all scraping');
      outputFileStream.end();
      ee.emit('finish-all-scraping');
    }
  });
  ee.emit('finish-studio', index);
  return ee;
}

if (require.main === module)
{
  getAllCourses(process.argv[2], process.argv[3], process.argv[4]);
}
