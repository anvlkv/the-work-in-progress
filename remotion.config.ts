import {Config} from 'remotion';
import os from 'os'

Config.setImageFormat('jpeg');
Config.setConcurrency(os.cpus().length)
Config.setDelayRenderTimeoutInMilliseconds(100000);
Config.setOverwriteOutput(true);
Config.setMaxTimelineTracks(30);
// Config.setLevel("verbose");
