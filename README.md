# aggregate-class-calendar
Aggregate schedules from various classes (e.g. yoga studios) into one place, 
given a few search parameters.

# dependency on class-scraper
This repo depends directly on class-scraper through git subtree (repo found at 
https://github.com/joncinque/class-scraper), so to update this repo on any
changes, run the command: 
$ git subtree pull --prefix .class-scraper https://github.com/joncinque/class-scraper.git master --squash
Or, using aliases:
$ git sbu https://github.com/joncinque/class-scraper.git .class-scraper
