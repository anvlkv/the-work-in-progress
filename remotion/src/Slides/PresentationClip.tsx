import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLOR_1, COLOR_3, VIDEO_CONFIG} from '../constants';
import { SingleSlideProps } from '../Episodes/Standard/types';

export type Props = Omit<SingleSlideProps, 'commentary'>

export const PresentationClip: React.FC<Props> = ({title = 'the WIP by twopack.gallery', text, img}) => {
	const packsPng = staticFile('twopacks.png')
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
				color: COLOR_1,
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
					{text && (
						<p style={{whiteSpace: 'pre-line', margin: '.25em'}}>{text}</p>
					)}
				</>
			) : (
				<>
					<Img
						src={packsPng}
						alt="twopacks"
						style={{maxWidth: 'fit-content', marginLeft: '-3em', height: '80%'}}
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
		</AbsoluteFill>
	);
};
