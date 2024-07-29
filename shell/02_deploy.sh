#!/usr/bin/env bash

PARTNER=$1
STAGE=$2
SERVICE_TYPE=$3
SERVICE_NAME=$4
TARGET_MODE=$5




# ##################### GIT Recreation of branch ############################

# if [[ $TARGET_MODE = "standard" ]]
# then
#     MODE=""
# else
#     MODE=$TARGET_MODE
# fi

# # if we do not have the branch in remote create it
# existed_in_remote=$(git ls-remote --heads origin "${PARTNER}""${MODE}"-"${STAGE}" 2>/dev/null)
# if [[ -z ${existed_in_remote} ]]
# then
#     git fetch -p
#     echo "Recreating branch ${PARTNER}${MODE}-${STAGE} from current branch"
#     git checkout -b "${PARTNER}""${MODE}"-"${STAGE}"
#     git push -u origin "${PARTNER}""${MODE}"-"${STAGE}"
# #end if we do not have the branch in remote create it
# fi

# ##########################################################################

