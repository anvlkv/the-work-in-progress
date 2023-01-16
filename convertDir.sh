#!/bin/bash

# directory path passed as an argument
dir=$1

# dest path passed as an argument
dest=$2

# loop through all .mov files in the directory
for file in $dir/*.mov; do
    # get the file name without the extension
    filename=$(basename "$file" .mov)
    # use ffmpeg to convert and compress the file
    ffmpeg -i "$file" -c:v libvpx-vp9 -b:v 7.5M -r 24 -threads 0 -c:a libopus -b:a 8k "$dest/$filename.webm"
done
