# aggregate-class-calendar
Aggregate schedules from various classes (e.g. yoga studios) into one place, 
given a few search parameters.

# initial setup
To work with the admin dashboard, which uses yogiben:meteor-admin, an admin user
must be created through console and added to the "admin" role.  Currently, this
only works with one user.

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
