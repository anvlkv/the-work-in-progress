import {AbsoluteFill, Img} from 'remotion';
import packsPng from '../public/twopacks.png';
import { COLOR_1, COLOR_2 } from './constants';
import { SpeakingHead } from './Head/SpeakingHead';

export const PresentationClip: React.FC<{textToSpeech: string, ssml?: boolean, title?: string; text?: string}> = ({
	title = 'the WIP by twopack.gallery',
	text,
  textToSpeech,
  ssml
}) => {
	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				alignItems: 'center',
				flexDirection: 'row',
				fontFamily: 'monospace',
				fontSize: '2.5em',
				height: '100%',
				width: '100%',
			}}
		>
			<Img
				src={packsPng}
				alt="twopacks"
				style={{width: 'fit-content', marginLeft: '-6%', height: '80%'}}
			/>
			<div
				style={{
					color: COLOR_1,
					flexGrow: 1,
					display: 'flex',
					flexDirection: 'column',
					justifyItems: 'center',
          alignItems: 'stretch'
				}}
			>
				<h1 style={{margin: '0'}}>{title}</h1>
				{text && <p style={{whiteSpace: 'pre-line'}}>{text}</p>}
			</div>
      <AbsoluteFill style={{backgroundColor: COLOR_2, width: "20%", height: '25%', position: 'absolute', bottom: '3%',  right: 0, top: 'unset', left: 'unset'}}>
				<SpeakingHead text={textToSpeech} ssml={ssml}/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
