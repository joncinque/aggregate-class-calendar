import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage } from './parsecourse.js';
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
  async 'coursescraper.getAllCoursesSync' ()
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
          return getCoursesAsync(
              studio,
              Meteor.bindEnvironment(makeDBCallback(studio)));
        }
      }
    }
    else
    {
      return Promise.resolve([]);
    }
  },
});
