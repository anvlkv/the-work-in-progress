import {Config} from 'remotion';
import os from 'os'

Config.setImageFormat('jpeg');
Config.setConcurrency(os.cpus().length)
// Config.setDelayRenderTimeoutInMilliseconds(5000);
Config.setOverwriteOutput(true);
Config.setMaxTimelineTracks(30);
Config.overrideWebpackConfig(config => {
  config.module?.rules?.push({test: /\.yaml$/, use: 'raw-loader' })
  return config
})
// Config.setLevel("verbose");

Config.setChromiumOpenGlRenderer("angle")

// Config.setChromiumHeadlessMode(false)
