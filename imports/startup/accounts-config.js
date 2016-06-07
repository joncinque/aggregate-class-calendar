import { Accounts } from 'meteor/accounts-base';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY', 
    // can be customized for different kinds of fields, including FB integration
});
