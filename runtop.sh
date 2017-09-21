#!/usr/bin/env bash
echo 'Starting Chrome'
cmd='google-chrome --disable-gpu --headless --remote-debugging-port=9222 &'
echo $cmd
eval $cmd

pid=`echo $!`
echo $pid

echo 'Gathering and scraping classes'
cmd='nodejs toplevel.js studios.json courses.json'
echo $cmd
eval $cmd

echo 'Checking result'
cmd='python -m json.tool courses.json'
echo $cmd
eval $cmd
rc=$?

if [[ rc  != 0 ]]
then
  echo 'Error with courses.json file, double check manually'
  exit $rc
fi

#echo 'Replacing dates for mongoimport'
#cp courses.json courses.json.bak
#sed -i 's/"start": \("[^"]*"\)/"start": ISODate(\1)/g' courses.json.bak
#sed -i 's/"end": \("[^"]*"\)/"end": ISODate(\1)/g' courses.json.bak
#sed -i 's/,$//' courses.json.bak

echo 'Killing Chrome'
kill -9 $pid

echo 'Uploading mongo import file'
sshpass -p $PASSWORD scp courses.json aggregate@$IP:/home/aggregate/courses.json

#echo 'Uploading web import file'
#echo $PASSWORD | sshpass -p $PASSWORD ssh aggregate@$IP sudo -S chmod 666 /home/aggregate/bundle/programs/server/assets/app/courses.json

#sshpass -p $PASSWORD scp courses.json aggregate@$IP:/home/aggregate/bundle/programs/server/assets/app/courses.json

echo 'All done, import into the database'
sshpass -p $PASSWORD ssh aggregate@$IP mongoimport -c courses -d aggregate --file /home/aggregate/courses.json --upsertFields name,start,studio,style,postcode,timezone
