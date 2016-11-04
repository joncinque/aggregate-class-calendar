#!/usr/bin/env bash
#cmd="phantomjs --ssl-protocol=any --debug=false getcourse.js MBO 1991 ''"
cmd="phantomjs --ssl-protocol=any --debug=false getcourse.js MBO -765 ''"
echo $cmd
eval $cmd
