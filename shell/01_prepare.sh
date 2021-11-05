#!/usr/bin/env bash

PARTNER=$1
STAGE=$2

if ! [ -z ${CODEBUILD_SOURCE_REPO_URL+x} ]
then 
    git push origin --delete ${PARTNER}-${STAGE} &>/dev/null
    git branch -D ${PARTNER}-${STAGE} &>/dev/null
    git checkout -b ${PARTNER}-${STAGE}
    git push -u origin ${PARTNER}-${STAGE}
fi
