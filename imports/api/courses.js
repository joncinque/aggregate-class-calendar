// Business logic objects go here
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';

import moment from 'moment';

export const Courses = new Mongo.Collection('courses');

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
  // Ported from body.js
  'courses.insert'(courseObj)
  {
    let ValidMoment = Match.Where((m)=>{
      return m.isValid();
    });
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
      start: moment(courseObj.start),
      end: moment(courseObj.end),
      studio: courseObj.studio,
      room: courseObj.room,
      url: courseObj.url,
    },
    {
      // Modifier
      $set: {
        teacher: courseObj.teacher,
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
    let data = Courses.find().fetch();
    let distinctData = _.uniq(data, false, function(d) {return d.name});
    return _.pluck(distinctData, "name");
  },
  'courses.teachers'()
  {
    let data = Courses.find().fetch();
    let distinctData = _.uniq(data, false, function(d) {return d.teacher});
    return _.pluck(distinctData, "teacher");
  },
  'courses.studios'()
  {
    let data = Courses.find().fetch();
    let distinctData = _.uniq(data, false, function(d) {return d.studio});
    return _.pluck(distinctData, "studio");
  },
});
