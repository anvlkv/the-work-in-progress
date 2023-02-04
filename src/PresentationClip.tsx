import {AbsoluteFill, Img, Sequence, useVideoConfig} from 'remotion';
import packsPng from '../public/twopacks.png';
import {COLOR_1, COLOR_2, COLOR_3, VIDEO_CONFIG} from './constants';
import {SpeakingHead} from './Head/SpeakingHead';
import {TiltingHead} from './Head/TiltingHead';
import {phrasesToSpeech} from './phrasesToSpeech';

export const PresentationClip: React.FC<{
	textToSpeech: (string | number)[];
	title?: string;
	text?: string;
	img?: string;
}> = ({title = 'the WIP by twopack.gallery', text, textToSpeech, img}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				alignItems: 'center',
				flexDirection: img ? 'column' : 'row',
				fontFamily: 'monospace',
				fontSize: `${VIDEO_CONFIG.height * 0.05}px`,
				height: '100%',
				width: '100%',
				backgroundColor: COLOR_3,
				padding: '1em',
				color: COLOR_1
			}}
		>
			{img ? (
				<>
					<div style={{flexShrink: 1, overflow: 'hidden', textAlign: 'center'}}>
					<Img
						src={img}
						alt="twopacks"
						style={{height: '100%', width: 'auto'}}
					/>
					</div>
					{text && <p style={{whiteSpace: 'pre-line', margin: '.25em'}}>{text}</p>}
				</>
			) : (
				<>
					<Img
						src={packsPng}
						alt="twopacks"
						style={{width: 'fit-content', marginLeft: '-3em', height: '80%'}}
					/>
					<div
						style={{
							flexGrow: 1,
							display: 'flex',
							flexDirection: 'column',
							justifyItems: 'center',
							alignItems: 'stretch',
						}}
					>
						<h1 style={{margin: '0'}}>{title}</h1>
						{text && <p style={{whiteSpace: 'pre-line'}}>{text}</p>}
					</div>
				</>
			)}
			<AbsoluteFill
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
				{typeof textToSpeech[0] === 'number' ? (
					<>
						<Sequence durationInFrames={textToSpeech[0] * fps}>
							<TiltingHead />
						</Sequence>
						<Sequence from={textToSpeech[0] * fps}>
							<SpeakingHead
								ssml
								text={phrasesToSpeech(textToSpeech.slice(1))}
							/>
						</Sequence>
					</>
				) : (
					<SpeakingHead ssml text={phrasesToSpeech(textToSpeech)} />
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
