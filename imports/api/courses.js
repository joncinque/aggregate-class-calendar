// Business logic objects go here
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import moment from 'moment';

export const Courses = new Mongo.Collection('courses');

let Schemas = {};

Schemas.Courses = new SimpleSchema({
  name: {
    type: String,
    label: 'Class name',
    max: 1000
  },
  start: {
    type: Date,
    label: 'Start datetime',
  },
  end: {
    type: Date,
    label: 'End datetime',
  },
  studio: {
    type: String,
    label: 'Studio',
    max: 100
  },
  style: {
    type: String,
    label: 'Style',
    max: 50
  },
  postcode: {
    type: String,
    label: 'Postcode',
    max: 20
  },
  teacher: {
    type: String,
    label: 'Teacher',
    optional: true,
    max: 100
  },
  room: {
    type: String,
    label: 'Room',
    optional: true,
    max: 100
  },
  url: {
    type: String,
    label: 'Studio URL',
    max: 200
  },
  booking: {
    type: String,
    label: 'Booking URL',
    max: 200
  }
});

Courses.attachSchema(Schemas.Courses);

function getFilterStartDate()
{
  return moment().subtract(2, 'weeks').toDate();
}

// Separate what information is sent from the server from what's on the client
if (Meteor.isServer)
{
  Meteor.publish('courses', () => {
    let weekStart = moment().set({'weekday': 0,
      'hour': 0,
      'minute': 0,
      'second': 0,
      'millisecond': 0}).toDate();
    return Courses.find({ start: { $gte: weekStart } });
  });
}

Meteor.methods({
  'courses.insert'(courseObj)
  {
    // Make sure user is logged in
    /*
    if (! this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */
    check(courseObj, {
      name: String,
      start: Date,
      studio: String,
      style: String,
      postcode: String,
      end: Date,
      teacher: String,
      room: String,
      url: String,
      booking: String,
    });

    Courses.upsert({
      // Selector
      name: courseObj.name,
      start: courseObj.start,
      studio: courseObj.studio,
      style: courseObj.style,
      postcode: courseObj.postcode,
    },
    {
      // Modifier
      $set: {
        end: courseObj.end,
        teacher: courseObj.teacher,
        room: courseObj.room,
        url: courseObj.url,
        booking: courseObj.booking,
      }
    });
  },
  // Ported from course.js in imports/ui
  'courses.remove'(courseId)
  {
    check(courseId, Number);
    const course = Courses.findOne(courseId);
    /*
    if (task.private && task.owner !== this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */
    Courses.remove(courseId);
  },
  'courses.names'()
  {
    this.unblock();
    let data = Courses.find({ start: { $gte: getFilterStartDate() } },
                            { sort: { name: 1 }}).fetch();
    let distinctData = _.uniq(data, true, 
        (d)=>{ return (d.name === undefined) ? "" : d.name.toLowerCase().trim(); });
    return _.pluck(distinctData, "name");
  },
  'courses.teachers'()
  {
    this.unblock();
    let data = Courses.find({ start: { $gte: getFilterStartDate() } },
                            { sort: { teacher: 1 }}).fetch();
    let distinctData = _.uniq(data, true,
        (d)=>{ return (d.teacher === undefined) ? "" : d.teacher.toLowerCase().trim(); });
    return _.pluck(distinctData, "teacher");
  },
});
