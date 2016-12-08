# aggregate-class-calendar
Aggregate schedules from various classes (e.g. yoga studios) into one place, 
given a few search parameters.

# admin panel, lib/adminconfig.js
To work with the admin dashboard, which uses yogiben:meteor-admin, an admin user
must be created through console and added to the "admin" role.  Currently, this
only works with one user within 'adminEmails'.
To add a user during initial setup, use the following command from meteor shell,
through the shell-server package:
$ let id = Accouts.createUser({email: "..", password: "..", profile: { name: ".." }});
$ Roles.addUsersToRoles(id, ['admin'], 'default-group');

# logger setup, server/logging.js
This app uses winston through votercircle:winston and a papertrail config. See
https://papertrailapp.com/systems/setup for setup instructions on a machine to 
send logs to their severs.  See the logs at https://papertrailapp.com/dashboard

# kadira setup, server/kadira.js
Kadira is used for monitoring speed and usage of different meteor methods and
database queries. Check https://ui.kadira.io/ for the dashboard.

# cron job
Uses percolate:synced-cron to fetch yoga classes on a fixed schedule of once 
every 6 hours.  The admin panel, found at /admin allows for customization of 
this task.

# dependency on class-scraper
This repo depends directly on class-scraper through git subtree (repo found at 
https://github.com/joncinque/class-scraper), so to update this repo on any
changes, run the command: 
$ git subtree pull --prefix .class-scraper https://github.com/joncinque/class-scraper.git master --squash
Or, using aliases:
$ git sbu https://github.com/joncinque/class-scraper.git .class-scraper
In order to push back up, run the command:
$ git subtree push --prefix .class-scraper class-scraper master
Or, using aliases:
$ git sbp .class-scraper class-scraper master
Quick explanation: the prefix of ".class-scraper" is looking in that folder for
the push information, "class-scraper" is the name of the remote we're pushing
to, and "master" is the branch we're pushing from.
