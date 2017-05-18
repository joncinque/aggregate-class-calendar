import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { EventEmitter } from 'events';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage, makeParsePageEventEmitter } from './parsecourse.js';
import { Courses } from './courses.js';

function logCourse(course)
{
  logger.info("{ name: '" + course.name + "'");
  logger.info("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  logger.info("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  logger.info("  , room: '" + course.room + "'");
  logger.info("  , studio: '" + course.studio + "'");
  logger.info("  , teacher: '" + course.teacher + "'");
  logger.info("  , url: '" + course.url + "'");
  logger.info("  , locale: '" + course.locale + "'");
  logger.info("  , style: '" + course.style + "'");
  logger.info("  , postcode: '" + course.postcode + "'");
  logger.info("}");
}

function addJSONCourseToDB(course)
{
  course.start = new Date(course.start);
  course.end = new Date(course.end);
  Meteor.call('courses.insert', course);
}

function addCoursesToDB(courses)
{
  courses.forEach(course => {
    course.start = course.start.toDate();
    course.end = course.end.toDate();
  });
  courses.forEach(course => {
    Meteor.call('courses.insert', course);
  });
}

function makeDBCallback(studio)
{
  return (courses) =>
  {
    logger.info('Finished for studio: ' + studio.name);
    return addCoursesToDB(courses);
  }
}

function makeArrayCallback(studio)
{
  return (courses) =>
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

function getCoursesAsync(studio, callback)
{
  if (studio.provider === 'MBO')
  {
    const htmlFile = Math.abs(studio.studioid) + '.html';
    return new Promise((resolve, reject)=>{
      return phantomjs.run(Assets.absoluteFilePath('getcourse.js'),
          studio.provider,
          studio.studioid,
          studio.redirectPage)
      .then(program => {
        return parsePage(htmlFile, studio, callback);
      })
      .then(data => {
        resolve(data);
      });
    });
  }
  else
  {
    logger.error('Cannot process studio without provider: ' + studio);
  }
}

function getCoursesChrome(studio, callback)
{
  const htmlFile = Math.abs(studio.studioid) + '.html';
  return chromegetcourse.dumpCourseTable(
      studio.provider,
      studio.studioid,
      studio.redirectPage
      ).once('finish-dumping',
        parsecourse.makeParsePageEventEmitter(studio, callback));
}


Meteor.methods({
  'coursescraper.getAllCoursesPhantom'()
  {
    if (Meteor.isServer)
    {
      let studioScrapePromises = [];
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        studioScrapePromises.push(
            getCoursesAsync(
              studio, 
              Meteor.bindEnvironment(makeDBCallback(studio))));
      }
      return Promise.all(studioScrapePromises).then(()=>{
        logger.info("Scraping all done");
      });
    }
    else
    {
      return Promise.resolve([]);
    }
  },
  async 'coursescraper.getAllCoursesSyncPhantom' ()
  {
    if (Meteor.isServer)
    {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      let boundAddCourses = Meteor.bindEnvironment(addCoursesToDB);
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        let courses = await getCoursesAsync(studio);
        boundAddCourses(courses);
        logger.info('Finished for studio: ' + studio.name);
      }
      logger.info('Scraping all done');
    }
    return Promise.resolve([]);
  },
  async 'coursescraper.getAllCoursesChrome' ()
  {
    if (Meteor.isServer)
    {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      let boundAddCourses = Meteor.bindEnvironment(addCoursesToDB);
      /*
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        let courses = await getCoursesAsync(studio);
        boundAddCourses(courses);
        logger.info('Finished for studio: ' + studio.name);
      }
      logger.info('Scraping all done');
      */
    }
    return Promise.resolve([]);
  },
  async 'coursescraper.addCoursesFromFile' (jsonFile)
  {
    if (Meteor.isServer)
    {
      let courses = JSON.parse(Assets.getText(jsonFile));
      courses.forEach(addJSONCourseToDB);
    }
    return Promise.resolve([]);
  },
  'coursescraper.getCoursesPhantom'(studioid)
  {
    check(studioid, Number);
    if (Meteor.isServer) {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo) {
        let studio = studioInfo[index];
        if (studio.studioid === studioid) {
          return getCoursesAsync(
              studio,
              Meteor.bindEnvironment(makeDBCallback(studio)));
        }
      }
    } else {
      return Promise.resolve([]);
    }
  },
  'coursescraper.getCoursesChrome'(studioid)
  {
    check(studioid, Number);
    let ee = new EventEmitter();
    if (Meteor.isServer) {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo) {
        let studio = studioInfo[index];
        if (studio.studioid === studioid) {
          getCoursesChrome(
              studio,
              Meteor.bindEnvironment(makeDBCallback(studio))
            ).once('finish-scraping', (data)=>{
              ee.emit('finish-all-scraping');
          });
        }
      }
    }
    return ee;
  },
  'coursescraper.getAllCoursesChrome'(studioid)
  {
    let ee = new EventEmitter();
    if (Meteor.isServer) {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      ee.on('finish-studio', (index)=>{
        if (index < studioInfo.length) {
          let studio = studioInfo[index];
          getCoursesChrome(
              studio,
              Meteor.bindEnvironment(makeDBCallback(studio))
              ).once('finish-scraping', (data)=>{
                ee.emit('finish-studio', ++index);
              }).once('error', (data)=>{
                ee.emit('finish-studio', ++index);
              });
        } else {
          ee.emit('finish-all-scraping');
          logger.info('Scraping complete');
        }
      });
    }
    return ee;
  },
});
