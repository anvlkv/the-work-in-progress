import {Loop} from 'remotion'
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion"
import { COLOR_2 } from "./constants"
import { SpeakingHead } from "./Head/SpeakingHead"
import { TiltingHead } from "./Head/TiltingHead"
import { phrasesToSpeech, TTSEntry } from "./phrasesToSpeech"
import { FrameMapping } from "./Video/VideoClip"

export interface Props {ttsMapping: FrameMapping<TTSEntry>[]}

export const SpeechBooth: React.FC<Props> = ({ttsMapping}) => {
  const  = useRema

  const 

  return <AbsoluteFill
				style={{
					backgroundColor: COLOR_2,
					width: '20%',
					height: '25%',
					position: 'absolute',
					bottom: 0,
					right: 0,
					top: 'unset',
					left: 'unset',
				}}
			>
				<Loop durationInFrames={60 * fps}>
					<TiltingHead />
				</Loop>
			</AbsoluteFill>
}