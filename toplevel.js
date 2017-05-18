'use strict';

const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const EventEmitter = require('events');

//var getcourse = require('./getcourse'); // used by phantom file
const parsecourse = require('./parsecourse');
const chromegetcourse = require('./chromegetcourse');
const logger = require('./logger');

let sep = '';
function makeFileLogger(fileStream)
{
  return (course) =>
  {
    fileStream.write(sep);
    if (sep === '') {
      sep = ',\n';
    }
    fileStream.write('{ "name": "' + course.name + '"');
    fileStream.write(', "teacher": "' + course.teacher + '"');
    fileStream.write(', "room": "' + course.room + '"');
    fileStream.write(', "style": "' + course.style + '"');
    fileStream.write(', "start": "' + course.start.toDate().toJSON() + '"');
    fileStream.write(', "end": "' + course.end.toDate().toJSON() + '"');
    fileStream.write(', "locale": "' + course.locale + '"');
    fileStream.write(', "studio": "' + course.studio + '"');
    fileStream.write(', "url": "' + course.url + '"');
    fileStream.write(', "booking": "' + course.booking + '"');
    fileStream.write(', "postcode": "' + course.postcode + '"');
    fileStream.write('}');
  }
}

function makeFileCallback(studio, outputFileStream)
{
  return function(courses)
  {
    logger.info('Finished for studio: ' + studio.name);
    courses.forEach(makeFileLogger(outputFileStream));
  }
}

function makeArrayCallback(studio)
{
  return function(courses)
  {
    logger.info('Finished for studio: ' + studio.name);
    courses.forEach(course => {
      course.start = course.start.toDate();
      course.end = course.end.toDate();
    });
    return courses;
  }
}

function transformToJS(courseArray)
{
  courseArray.forEach(course => {
    course.start = course.start.toDate();
    course.end = course.end.toDate();
  });
  return courseArray;
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

function getAllCourses(studioFile, outputFile)
{
  let data = fs.readFileSync(studioFile, 'utf8');
  let outputFileStream = fs.createWriteStream(outputFile, {
      flags: 'a' // 'a' means appending (old data will be preserved)
  })
  outputFileStream.write('[');
  const studioInfo = JSON.parse(data);
  //getCoursesChrome(studioInfo[1], makeFileCallback(studioInfo[1]));
  let ee = new EventEmitter();
  ee.on('finish-studio', (index)=>{
    if (index < studioInfo.length) {
      var studio = studioInfo[index];
      getCoursesChrome(studio, makeFileCallback(studio, outputFileStream)
          ).once('finish-scraping', (data)=>{
            ee.emit('finish-studio', ++index);
          }).once('error', (data)=>{
            ee.emit('finish-studio', ++index);
          });
    } else {
      ee.emit('finish-all-scraping');
      logger.info('Scraping complete');
      outputFileStream.write(']');
      outputFileStream.close();
    }
  });
  ee.emit('finish-studio', 0);
  return ee;
}

if (require.main === module)
{
  getAllCourses(process.argv[2], process.argv[3]);
}
