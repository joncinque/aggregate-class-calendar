import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Courses } from './courses.js';

if (Meteor.isServer)
{
  describe('Courses', () => {
    describe('methods', () => {
      const userId = Random.id();
      let courseId;

      const now = new Date();
      beforeEach(() => {
        Courses.remove({});
        courseId = Courses.insert({
          name: 'Vinyasa Flow',
          start: new Date(),
          end  : new Date().setHour(now.getHour() + 1),
          studio: 'Chiswell Street',
          teacher: 'Issy',
          url  : 'http://www.flexlondon.com/',
        });
      });

      it('can delete owned course', () => {
        // use the actual implementation of the course method from the server
        const deleteCourse = Meteor.server.method_handlers['courses.remove'];

        // Make the input look similar on "this" in the function call
        const invocation = { userId };

        // run method with "this" set to fake invocation
        deleteCourse.apply(invocation, [courseId]);

        // verify that it worked
        assert.equal(Courses.find().count(), 0);
      });
    });
  });
}
