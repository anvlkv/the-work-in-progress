
#!/bin/bash

id=$1

wrap () { 
  remotion render $id out/$id.mp4 --bundle-cache=false | cat;
}; 
wrap