#!/usr/bin/env bash
meteor build ../app --architecture os.linux.x86_64
sshpass -p $PASSWORD scp ../app/aggregate-class-calendar.tar.gz aggregate@$IP:/home/aggregate
sshpass -p $PASSWORD ssh aggregate@$IP tar -xvzf aggregate-class-calendar.tar.gz
echo $PASSWORD | sshpass -p $PASSWORD ssh aggregate@$IP sudo -S supervisorctl update aggregate-class-calendar
