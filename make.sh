#!/bin/sh

appname=stackstyletabs

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

