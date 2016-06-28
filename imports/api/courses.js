// Business logic objects go here
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

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
  'courses.insert'(name, start, end, studio, teacher, url)
  {
    check(name, String);
    check(start, Date);
    check(end, Date);
    check(studio, String);
    check(teacher, String);
    check(url, String);

    // Make sure user is logged in
    /*
    if (! this.userId)
    {
      throw new Meteor.Error('not-authorized');
    }
    */

    Courses.insert({
      name: name,
      start: start,
      end: end,
      studio: studio,
      teacher: teacher,
      url: url,
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
  }
});
