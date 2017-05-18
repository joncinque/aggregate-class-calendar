#!/usr/bin/env bash
cmd='google-chrome --disable-gpu --headless --remote-debugging-port=9222 &'
echo $cmd
eval $cmd
cmd='nodejs toplevel.js studios.json courses.json'
echo $cmd
eval $cmd
