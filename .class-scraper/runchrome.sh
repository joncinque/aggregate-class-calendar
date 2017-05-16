#!/usr/bin/env bash
cmd="google-chrome --disable-gpu --headless --remote-debugging-port=9222 &"
echo $cmd
eval $cmd
cmd="node chromegetcourse.js"
echo $cmd
eval $cmd
