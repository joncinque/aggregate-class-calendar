'use strict';

const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const EventEmitter = require('events');

//var getcourse = require('./getcourse'); // used by phantom file
const parsecourse = require('./parsecourse');
const chromegetcourse = require('./chromegetcourse');
const logger = require('./logger');

function logCourse(course)
{
  logger.log("{ name: '" + course.name + "'");
  logger.log("  , style: '" + course.style + "'");
  logger.log("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  logger.log("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  logger.log("  , room: '" + course.room + "'");
  logger.log("  , studio: '" + course.studio + "'");
  logger.log("  , teacher: '" + course.teacher + "'");
  logger.log("  , url: '" + course.url + "'");
  logger.log("  , locale: '" + course.locale + "'");
  logger.log("  , postcode: '" + course.postcode + "'");
  logger.log("}");
}

function makeDBCallback(studio)
{
  return function(courses)
  {
    logger.log('Finished for studio: ' + studio.name);
    courses.forEach(logCourse);
  }
}

function makeArrayCallback(studio)
{
  return function(courses)
  {
    logger.log('Finished for studio: ' + studio.name);
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

function getAllCourses(studioFile)
{
  let data = fs.readFileSync(studioFile, 'utf8');
  const studioInfo = JSON.parse(data);
  //getCoursesChrome(studioInfo[1], makeDBCallback(studioInfo[1]));
  let ee = new EventEmitter();
  ee.on('finish-studio', (index)=>{
    if (index < studioInfo.length) {
      var studio = studioInfo[index];
      getCoursesChrome(studio, makeDBCallback(studio)
          ).once('finish-scraping', (data)=>{
        ee.emit('finish-studio', ++index);
      });
    } else {
      ee.emit('finish-all-scraping');
      logger.log('Scraping complete');
    }
  });
  ee.emit('finish-studio', 0);
  return ee;
}

if (require.main === module)
{
  getAllCourses(process.argv[2]);
}
