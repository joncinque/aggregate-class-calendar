import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Tasks } from './tasks.js';

if (Meteor.isServer)
{
  describe('Tasks', () => {
    describe('methods', () => {
      const userId = Random.id();
      let taskId;

      beforeEach(() => {
        Tasks.remove({});
        taskId = Tasks.insert({
          text: 'test',
          createdAt: new Date(),
          owner: userId,
          username: 'testman',
        });
      });

      it('can delete owned task', () => {
        // use the actual implementation of the task method from the server
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];

        // Make the input look similar on "this" in the function call
        const invocation = { userId };

        // run method with "this" set to fake invocation
        deleteTask.apply(invocation, [taskId]);

        // verify that it worked
        assert.equal(Tasks.find().count(), 0);
      });
    });
  });
}
