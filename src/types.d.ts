declare module '*.mov'
declare module '*.mp4'

declare type VideoProps = Omit<React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>, "nonce" | "onEnded" | "autoPlay" | "controls"> & {
  volume?: any;
  playbackRate?: number | undefined;
  acceptableTimeShiftInSeconds?: number | undefined;
  allowAmplificationDuringRender?: boolean | undefined;
} & RemotionMainVideoProps & React.RefAttributes<HTMLVideoElement | null>