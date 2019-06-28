#!/bin/sh

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

commit_package_files() {
  git remote remove origin
  git remote add origin https://${GITHUB_TOKEN}@github.com/networkteam/nwt-frontend-scripts git
  git add package.json
  git commit --message "NPM RELEASE: $NPM_VERSION"
}

upload_files() {
  git push origin master
}

setup_git
commit_package_files
upload_files