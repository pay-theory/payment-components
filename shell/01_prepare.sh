#!/usr/bin/env bash

PARTNER=$1
STAGE=$2

# if there is a .git directory we are in partner-factory
if [ -d ".git" ]
then

# if we do not have the branch in remote create it
existed_in_remote=$(git ls-remote --heads origin ${PARTNER}-${STAGE} 2>/dev/null)
if [[ -z ${existed_in_remote} ]]
then
    echo "Branch ${PARTNER}-${STAGE} not existed in remote, Creating now..."
    git checkout -b ${PARTNER}-${STAGE}
    git push -u origin ${PARTNER}-${STAGE}

#end if we do not have the branch in remote create it
fi

#end if there is a .git directory we are in partner-factory
fi
