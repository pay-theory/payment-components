#!/usr/bin/env bash

PARTNER=$1
MESSAGE=$2

git add .
git commit -m "$2"
git push
git push origin main:$PARTNER-paytheory
git push origin main:$PARTNER-paytheorylab
git push origin main:$PARTNER-paytheorystudy