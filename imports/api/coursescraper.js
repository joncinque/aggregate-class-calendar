import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage } from './parsecourse.js';

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

function makeDBCallback(studio)
{
  return (courses) =>
  {
    logger.info('Finished for studio: ' + studio.name);
    courses.forEach(course => {
      course.start = course.start.toDate();
      course.end = course.end.toDate();
    });
    courses.forEach(course => {
      Meteor.call('courses.insert', course);
    });
    return "Done adding to db";
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
  const htmlFile = Math.abs(studio.studioid) + '.html';
  return phantomjs.run(Assets.absoluteFilePath('getcourse.js'),
      studio.provider,
      studio.studioid,
      studio.redirectPage)
    .then(program => {
      return parsePage(htmlFile, studio, callback);
    })
    .then(data => {
      return data;
    });
}

Meteor.methods({
  'coursescraper.getAllCourses'()
  {
    if (Meteor.isServer)
    {
      let studioScrapePromises = [];
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.provider === 'MBO')
        {
          studioScrapePromises.push(
              getCoursesAsync(studio, 
                              Meteor.bindEnvironment(makeDBCallback(studio))));
        }
        else
        {
          logger.error('Cannot process studio without provider: ' + studio);
        }
      }
      return Promise.all(studioScrapePromises);
    }
    else
    {
      return Promise.resolve([]);
    }
  },
  'coursescraper.getCourses'(studioid)
  {
    check(studioid, Number);
    if (Meteor.isServer)
    {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.studioid === studioid)
        {
          return getCoursesAsync(studio, Meteor.bindEnvironment(makeDBCallback(studio)));
        }
      }
    }
    else
    {
      return Promise.resolve([]);
    }
  },
});
