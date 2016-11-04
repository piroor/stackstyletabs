#!/bin/sh

appname=stackstyletabs

cp makexpi/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

