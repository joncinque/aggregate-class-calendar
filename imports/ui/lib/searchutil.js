import { getLaterDatetime,
  getNowDatetime,
  getDaysOfWeek,
  initDayFilter,
  makeDatetime } from './dateutil.js';

import { Courses } from '../../api/courses.js';

const EMPTY = '';
const COURSE_LIMIT = 500;

const makeRegex = (searchString)=>
{
  return new RegExp(searchString, 'i');
}

export const maxCoursesReached = (reactiveDict)=>
{
  let count = reactiveDict.get('availableCount');
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

const getSearchArgs = (reactiveDict)=>
{
  let argList = [];

  // get time filters
  const startFilter = reactiveDict.get('startFilter');
  const endFilter = reactiveDict.get('endFilter');
  console.log('Start: ' + startFilter + ' End: ' + endFilter);

  // apply day filter
  let dayList = [];
  const dayFilter = reactiveDict.get('dayFilter'); 
  for (let key in dayFilter) {
    if (dayFilter[key] === true) {
      dayList.push({ $and: [ 
        { start: { $gte: makeDatetime(key, startFilter).toDate() } },
        { start: { $lte: makeDatetime(key, endFilter).toDate() } }
      ]});
      console.log('Key: ' + key + 
          ' Start: ' + makeDatetime(key, startFilter).toDate() +
          ' End: ' + makeDatetime(key, endFilter).toDate());
    }
  }
  if (dayList.length === 0) {
    argList.push({ _id: -1 });
  } else {
    argList.push({ $or: dayList });
  }

  // apply class filter
  const classFilter = reactiveDict.get('classFilter');
  if (classFilter !== EMPTY)
  {
    console.log('Class filter: ' + classFilter);
    argList.push({ name: makeRegex(classFilter) });
  }

  // apply teacher filter
  const teacherFilter = reactiveDict.get('teacherFilter');
  if (teacherFilter !== EMPTY)
  {
    console.log('Teacher filter: ' + teacherFilter);
    argList.push({ teacher: makeRegex(teacherFilter) });
  }

  // apply studio filter
  let studioFilter = reactiveDict.get('studioFilter');
  if (studioFilter !== EMPTY)
  {
    console.log('Studio filter: ' + studioFilter);
    argList.push({ studio: makeRegex(studioFilter) });
  }

  // apply style filter
  let styleFilter = reactiveDict.get('styleFilter');
  if (styleFilter.length > 0)
  {
    console.log('Style filter: ' + styleFilter);
    argList.push({ style: { $in: styleFilter } });
  }

  // apply postcode filter
  let postcodeFilter = reactiveDict.get('postcodeFilter');
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
  reactiveDict.set('dayFilter', initDayFilter());

  reactiveDict.set('classFilter', EMPTY);
  reactiveDict.set('teacherFilter', EMPTY);
  reactiveDict.set('studioFilter', EMPTY);

  reactiveDict.set('startFilter', getNowDatetime());
  reactiveDict.set('endFilter', getLaterDatetime());

  reactiveDict.set('availableCount', 0);
}

export const getCourseResults = (reactiveDict) =>
{
  let results = Courses.find(getSearchArgs(reactiveDict), getOptionArgs());
  reactiveDict.set('availableCount', results.count());
  return results;
}

export const initCourseDict = (reactiveDict)=>
{
  // get whatever is in the 'courses' channel from the server
  Meteor.subscribe('courses',{
    onReady: ()=>{
      Meteor.call('courses.names', (err,data) => {
        reactiveDict.set('names', data);
      });
      Meteor.call('courses.teachers', (err,data) => {
        reactiveDict.set('teachers', data);
      });
    },
    onError: ()=>{ console.log('Could not subscribe to courses'); },
  });
  Meteor.call('studios.info', (err,data) => {
    reactiveDict.set('postcodes', data.postcodes);
    reactiveDict.set('studios', data.names);
    reactiveDict.set('styles', data.styles);
  });
}
