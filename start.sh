#!/bin/sh
playit --secret $PLAYIT_SECRET > /dev/null 2>&1 &
node bot.js
