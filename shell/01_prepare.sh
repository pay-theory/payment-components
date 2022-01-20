#!/usr/bin/env bash

PARTNER=$1
STAGE=$2

existed_in_remote=$(git ls-remote --heads origin ${PARTNER}-prototype-${STAGE})
if [[ -z ${existed_in_remote} ]]
then
    echo "Branch ${PARTNER}-prototype-${STAGE} not existed in remote, Creating now..."
    git checkout -b ${PARTNER}-prototype-${STAGE}
    git push -u origin ${PARTNER}-prototype-${STAGE}
fi
