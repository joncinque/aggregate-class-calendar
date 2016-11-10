import { getLaterDatetime, getNowDatetime } from './dateutil.js';

import { Courses } from '../../api/courses.js';

const EMPTY = '';
const COURSE_LIMIT = 1000;

const makeRegex = (searchString)=>
{
  return new RegExp(searchString, 'i');
}

export const maxCoursesReached = (instance)=>
{
  let count = instance.state.get('availableCount');
  return count >= COURSE_LIMIT;
}

const getOptionArgs = (doSort)=>
{
  if (doSort === undefined)
  {
    doSort = true;
  }
  let optionArgs = { limit: COURSE_LIMIT };
  if (doSort)
  {
    optionArgs.sort = { start: 1, studio: 1, name: 1, teacher: 1 };
  }
  return optionArgs;
}

const getSearchArgs = (instance)=>
{
  let argList = [];

  // apply date/time filter
  argList.push({ start: { $gte: instance.state.get('startFilter') } });
  argList.push({ start: { $lte: instance.state.get('endFilter') } });

  // apply class filter
  let classFilter = instance.state.get('classFilter');
  if (classFilter !== EMPTY)
  {
    console.log('Class filter: ' + classFilter);
    argList.push({ name: makeRegex(classFilter) });
  }

  // apply teacher filter
  let teacherFilter = instance.state.get('teacherFilter');
  if (teacherFilter !== EMPTY)
  {
    console.log('Teacher filter: ' + teacherFilter);
    argList.push({ teacher: makeRegex(teacherFilter) });
  }

  // apply studio filter
  let studioFilter = instance.state.get('studioFilter');
  if (studioFilter !== EMPTY)
  {
    console.log('Studio filter: ' + studioFilter);
    argList.push({ studio: makeRegex(studioFilter) });
  }

  // apply style filter
  let styleFilter = instance.state.get('styleFilter');
  if (styleFilter.length > 0)
  {
    console.log('Style filter: ' + styleFilter);
    argList.push({ style: { $in: styleFilter } });
  }

  // apply postcode filter
  let postcodeFilter = instance.state.get('postcodeFilter');
  if (postcodeFilter.length > 0)
  {
    console.log('Postcode filter: ' + postcodeFilter);
    argList.push({ postcode: { $in: postcodeFilter } });
  }

  // make the search with an 'and' clause
  return { $and: argList };
}

export const initFilters = (reactiveDict)=>
{
  reactiveDict.set('styleFilter', []);
  reactiveDict.set('postcodeFilter', []);

  reactiveDict.set('classFilter', EMPTY);
  reactiveDict.set('teacherFilter', EMPTY);
  reactiveDict.set('studioFilter', EMPTY);

  reactiveDict.set('startFilter', getNowDatetime());
  reactiveDict.set('endFilter', getLaterDatetime());

  reactiveDict.set('availableCount', 0);
}

export const getCourseResults = (instance) =>
{
  return Courses.find(getSearchArgs(instance), getOptionArgs());
}

export const initCourseDict = (reactiveDict)=>
{
  // get whatever is in the 'courses' channel from the server
  Meteor.subscribe('courses');
  Meteor.call('courses.names', (err,data) => {
    reactiveDict.set('names', data);
  });
  Meteor.call('courses.teachers', (err,data) => {
    reactiveDict.set('teachers', data);
  });
  Meteor.call('studios.info', (err,data) => {
    reactiveDict.set('postcodes', data.postcodes);
    reactiveDict.set('studios', data.names);
    reactiveDict.set('styles', data.styles);
  });

  initFilters(reactiveDict);
}
