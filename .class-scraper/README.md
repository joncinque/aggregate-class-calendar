# class-scraper The class scraper is made up of two main components,
getcourse.js and parsecourse.js, linked together with a toplevel, toplevel.js

## toplevel.js Connects getcourse.js and parsecourse.js using studios.json.
Iterates through all of the entries in the studios.json file, hits the page
using getcourse.js, then sends it to the parser in parsecourse.js.  Finally,
everything is dumped in JSON format to the console. This can be run with
'runtop.sh'.

## getcourse.js First, use getcourse.js to pull a certain HTML element from a
page given a certain pattern of potential redirects.  It can be run separately
using 'runget.sh'.

In the "PROVIDERINFO" at the top of the file, you can specify a few variables
for hitting the page and getting the HTML element you want.

'urlPattern':  For now this only concatenates the input to the end of the
pattern.  For example, 'http://google.com' + some additional text.

'forcePage': Some websites don't give you the right page immediately, so you may
need to force a redirect to another page if the particular HTML element is not
found. Since PhantomJS handles web sessions, you can mimic pressing an
additional button through this entry.  For example, after 'http://google.com'
you want to go to navigate somewhere else, you can do that here.

'tableResourcePattern': Sometimes, the final HTML page is made up of many
different resources pulled in from many different places, and unfortunately
PhantomJS has a hard time resolving these. This allows you to specify an
additional resource to load from.

'tableCssClass': The CSS selector in order to get the HTML element that you're
looking for.  Note that this only works for singular elements.

## parsecourse.js After getting the pages, the next step is to parse out the
info needed.  parsecourse.js handles this work, and can be run separately using
'runparse.sh' and giving an html file to try on.  For now, this only handles MBO
pages.
