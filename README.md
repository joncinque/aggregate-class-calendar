# aggregate-class-calendar
Aggregate schedules from various classes (e.g. yoga studios) into one place, 
given search parameters.

# Installing

1. Meteor -- https://www.meteor.com/install for info
2. NPM modules for project, from top dir
    $ meteor npm install 
3. mongodb 3.4 -- https://docs.mongodb.com/manual/administration/install-on-linux/
4. google-chrome on Ubuntu
    $ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    $ sudo dpkg -i google-chrome-stable_current_amd64.deb
5. Other dependencies
    $ sudo apt install -y nginx supervisor

# Chrome dependency
Run headless Chrome using:
    $ google-chrome --headless --disable-gpu --remote-debugging-port=9222
If there's an issue getting to the webpages, it can be debugged using an X
session
    $ ssh -X ...

# Deploying
0. Create the user to run the project
    $ adduser aggregate
1. Build the application, tar the deploy directory
    $ meteor build ../app --architecture os.linux.x86_64
    $ tar -czvf ../app/aggregate-deploy.tar.gz deploy/
2. Copy the resulting tar files
    $ scp ../app/aggregate-class-calendar.tar.gz <ip>:/home/aggregate
    $ scp ../app/aggregate-deploy.tar.gz <ip>:/home/aggregate
3. Log into the machine
4. Unbundle the tars
    $ tar -xvzf aggregate-class-calendar.tar.gz
    $ tar -xvzf aggregate-deploy.tar.gz
5. Update or install dependencies
    $ cd bundle/programs/server && meteor npm install
6. Setup nginx
    $ cp deploy/nginx-prof.conf /etc/nginx/sites-available/aggregate-class-calendar.conf
    $ ln -s /etc/nginx/sites-available/aggregate-class-calendar.conf /etc/nginx/sites-enabled/aggregate-class-calendar.conf
    $ rm /etc/nginx/sites-enabled/default # if present
    $ service nginx reload
7. Setup database
    $ systemctl enable mongod
    $ service mongod start
8. Setup supervisor to run the app
    $ cp deploy/supervisor-proj.conf /etc/supervisor/conf.d/aggregate-class-calendar.conf
    $ supervisorctl update aggregate-class-calendar
9. If needed, running the whole thing without supervisor
    $ MONGO_URL=mongodb://localhost:27017/aggregate ROOT_URL=http://localhost:8080 node main.js

## Set up SSL certificates
To be done later when logged in areas become important.

## Set up cron job for mongdb backup

## Upload courses from file
1. Run the subtree's toplevel.js to dump courses.json file
2. Copy the file
    $ scp courses.json <ip>:/home/aggregate/bundle/programs/server/assets/app
3. Use the admin panel to upload from file

# admin panel, lib/adminconfig.js
To work with the admin dashboard, which uses yogiben:meteor-admin, an admin user
must be created through console and added to the "admin" role.  Currently, this
only works with one user within 'adminEmails'.
To add a user during initial setup, use the following command from meteor shell,
through the shell-server package:
    $ var id = Accounts.createUser({email: "..", password: "..", profile: { name: ".." }});
    $ Roles.addUsersToRoles(id, ['admin'], 'default-group');

# logger setup, server/logging.js
This app uses winston through votercircle:winston and a papertrail config. See
https://papertrailapp.com/systems/setup for setup instructions on a machine to 
send logs to their severs.  See the logs at https://papertrailapp.com/dashboard
The file logging.js adds the transport as necessary to Papertrail.

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
