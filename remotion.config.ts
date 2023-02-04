import {Config} from 'remotion';
import os from 'os'

Config.Rendering.setImageFormat('jpeg');
Config.Rendering.setConcurrency(os.cpus().length)
Config.Output.setOverwriteOutput(true);
Config.Preview.setMaxTimelineTracks(1000);