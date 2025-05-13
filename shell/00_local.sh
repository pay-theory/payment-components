PARTNER="validate"
# export STAGE="paytheorylab"
npm install

# create branch specific readme
mkdir -p dist

# cp README.md dist/README.md
# sed -i "s/https:\/\/sdk\.paytheory\.com/https:\/\/${PARTNER}.sdk.paytheory.com/g" dist/README.md
# sed -i "s/https:\/\/stage\.sdk\.paytheorystudy\.com/https:\/\/${PARTNER}.sdk.paytheorystudy.com/g" dist/README.md
# sed -i "s/https:\/\/test\.sdk\.paytheorystudy\.com/https:\/\/${PARTNER}.sdk.paytheorylab.com/g" dist/README.md

# publish to branch
npm run publish-env-cdn