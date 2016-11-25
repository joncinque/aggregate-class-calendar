// Business logic objects go here
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';

import moment from 'moment';

export const Courses = new Mongo.Collection('courses');

function getFilterStartDate()
{
  return moment().subtract(2, 'weeks').toDate();
}

// Separate what information is sent from the server from what's on the client
if (Meteor.isServer)
{
  Meteor.publish('courses', function () {
    return Courses.find();
    /*
    {
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
    */
  });
}

Meteor.methods({
  'courses.insert'(courseObj)
  {
    check(courseObj.name, String);
    check(courseObj.start, Date);
    check(courseObj.end, Date);
    check(courseObj.studio, String);
    check(courseObj.teacher, String);
    check(courseObj.url, String);
    check(courseObj.room, Match.Maybe(String));

    // Make sure user is logged in
    /*
    if (! this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */

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
    check(courseId, String);

    const course = Courses.findOne(courseId);
    /*
    if (task.private && task.owner !== this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */
    Courses.remove(courseId);
  },
  'courses.update'(courseId, setChecked)
  {
    check(courseId, String);
    check(setChecked, Boolean);

    const course = Courses.findOne(courseId);
    /*
    if (task.private && task.owner !== this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */

    Courses.update(courseId, { $set: { checked: setChecked } });
  },
  'courses.names'()
  {
    let data = Courses.find({ start: { $gte: getFilterStartDate() } },
                            { sort: { name: 1 }}).fetch();
    let distinctData = _.uniq(data, false, function(d) {return d.name.toLowerCase().trim();});
    return _.pluck(distinctData, "name");
  },
  'courses.teachers'()
  {
    let data = Courses.find({ start: { $gte: getFilterStartDate() } },
                            { sort: { teacher: 1 }}).fetch();
    let distinctData = _.uniq(data, false, function(d) {return d.teacher.toLowerCase().trim();});
    return _.pluck(distinctData, "teacher");
  },
});
