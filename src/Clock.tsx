import {
	AbsoluteFill,
	useVideoConfig,
	useCurrentFrame,
} from 'remotion';
import {COLOR_1, COLOR_2} from './constants';

export const Clock: React.FC<{
	elapsedFrames: number;
	startFrom: number
	acceleration: number;
	file?: string;
	editorMode?: boolean;
}> = ({elapsedFrames = 0, acceleration, file, editorMode, startFrom}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const remappedFrame = Math.round(frame * acceleration) + startFrom
	const remappedTime = new Date(
		Math.round(((elapsedFrames + remappedFrame) / fps) * 1000)
	);
	remappedTime.setHours(remappedTime.getHours() - 1);
	
	return (
		<AbsoluteFill
			style={{
				fontFamily: 'monospace',
				color: COLOR_2,
				top: 'unset',
				bottom: 0,
				margin: '.5em',
				fontSize: '5em',
				height: 'min-content',
				textShadow: `-2px -2px 0 ${COLOR_1}, 2px -2px 0 ${COLOR_1} , -2px 2px 0 ${COLOR_1} , 2px 2px 0 ${COLOR_1} `,
			}}
		>
			<span>
				{/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
				~ {remappedTime.toTimeString().match(/.*(\d\d:\d\d):\d\d/)![1]}
			</span>
			{editorMode && (
				<div style={{color: COLOR_1}}>
					file: {file}
					<br />
					frame: {remappedFrame}
				</div>
			)}
		</AbsoluteFill>
	);
};
