#!/bin/sh

appname=stackstyletabs

cp buildscript/makexpi.sh ./
./makexpi.sh $appname version=0
rm ./makexpi.sh

