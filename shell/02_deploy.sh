#!/usr/bin/env bash

PARTNER=$1
STAGE=$2
SERVICE_TYPE=$3
SERVICE_NAME=$4
TARGET_MODE=$5




# ##################### GIT Recreation of branch ############################

if [[ $TARGET_MODE = "standard" ]]
then
    MODE=""
else
    MODE=$TARGET_MODE
fi

if [ -d ".git" ]
then

TIMESTAMP=$(date "+%Y%m%d-%H%M%S")

if [[ -z ${TARGET_BRANCH} ]]
then
    export BASE_BRANCH="${PARTNER}""${MODE}"-"${STAGE}"
else
    export BASE_BRANCH=${TARGET_BRANCH}
fi

# if we do not have the branch in remote create it
existed_in_remote=$(git ls-remote --heads origin "${PARTNER}""${MODE}"-"${STAGE}" 2>/dev/null)
if [[ -z ${existed_in_remote} ]]
then
    git fetch -p
    echo "Recreating branch ${PARTNER}${MODE}-${STAGE} from current branch"
    git checkout -b "${PARTNER}""${MODE}"-"${STAGE}"
    git push -u origin "${PARTNER}""${MODE}"-"${STAGE}"
#end if we do not have the branch in remote create it
else
    echo "Branch ${PARTNER}${MODE}-${STAGE} existed in remote, Taking backup now..."
    echo "Creating backup branch with name" "${PARTNER}""${MODE}"-"${STAGE}"-"${TIMESTAMP}"
    git checkout -b "${PARTNER}""${MODE}"-"${STAGE}"-"${TIMESTAMP}"
    git push -u origin "${PARTNER}""${MODE}"-"${STAGE}"-"${TIMESTAMP}"
    echo "Deleting branch ${PARTNER}${MODE}-${STAGE}"
    git branch -D "${PARTNER}""${MODE}"-"${STAGE}" &>/dev/null
    git push origin --delete "${PARTNER}""${MODE}"-"${STAGE}" &>/dev/null
    git fetch -p
    echo "Recreating branch ${PARTNER}${MODE}-${STAGE} from base branch ${BASE_BRANCH}"
    git checkout -b "${PARTNER}""${MODE}"-"${STAGE}" "${BASE_BRANCH}"
    git push -u origin "${PARTNER}""${MODE}"-"${STAGE}"
#end if we do not have the branch in remote create it
fi

#end if there is a .git directory we are in partner-factory
fi

# ##########################################################################


