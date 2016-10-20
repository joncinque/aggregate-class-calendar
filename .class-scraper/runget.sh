#!/usr/bin/env bash
#cmd="phantomjs --ssl-protocol=any --debug=false getcourse.js MBO 1991 Chelsea"
cmd="phantomjs --ssl-protocol=any --debug=false getcourse.js MBO 1991 ''"
echo $cmd
eval $cmd
