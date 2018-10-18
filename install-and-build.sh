#!/bin/bash

set -e

CURRENT_DIR=$(pwd)

# Run npm istall and build
for FILE in `find DistributionPackages/* -maxdepth 1 -name package.json`
do
	DIR=$(dirname $FILE)
	cd $DIR
	echo ""
	echo "Entering $DIR"
	echo ""
	echo "Installing npm packages"
	echo ""
	yarn install
	echo ""
	echo "Building assets"
	echo ""
	yarn run build

	cd $CURRENT_DIR
done
