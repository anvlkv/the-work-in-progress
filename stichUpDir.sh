#!/bin/bash

# directory path passed as an argument
dir=$1

# dest path passed as an argument
dest=$2

# # loop through all .* files in the directory
# for file in $dir/*.*; do
#     echo "file '$file'" >> .mediaImports;
# done

ffmpeg -f concat -safe 0 -i .mediaImports -c copy -map 0 "$dest"

# rm .mediaImports