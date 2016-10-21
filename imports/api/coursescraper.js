import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage } from './parsecourse.js';

function logCourse(course)
{
  console.log("{ name: '" + course.name + "'");
  console.log("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  console.log("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  console.log("  , room: '" + course.room + "'");
  console.log("  , studio: '" + course.studio + "'");
  console.log("  , teacher: '" + course.teacher + "'");
  console.log("  , url: '" + course.url + "'");
  console.log("  , locale: '" + course.locale + "'");
  console.log("  , area: '" + course.area + "'");
  console.log("}");
}

function makeDBCallback(studio)
{
  return (courses) =>
  {
    console.log('Finished for studio: ' + studio.name);
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
    console.log('Finished for studio: ' + studio.name);
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
          console.log('Cannot process studio without provider: ' + studio);
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
