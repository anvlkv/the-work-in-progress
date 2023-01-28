#!/bin/bash

# directory path passed as an argument
dir=$1

# dest path passed as an argument
dest=$2

# loop through all .* files in the directory
for file in $dir/*.*; do
    # get the file name without the extension
    filename=$(basename "$file" .mov)
    # use ffmpeg to convert and compress the file
    ffmpeg -i "$file" -r 24  "$dest/$filename.mp4"
done
