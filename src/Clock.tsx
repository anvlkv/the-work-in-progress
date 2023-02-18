import {AbsoluteFill, useVideoConfig, Internals} from 'remotion';
import {useRemappedFrame} from './Video/AcceleratedVideo';
import {COLOR_1, COLOR_2} from './constants';

const isPreview = ['player-development', 'preview'].includes(
	Internals.getRemotionEnvironment()
);

export const Clock: React.FC<{elapsedFrames: number, file?: string}> = ({
	elapsedFrames = 0, file
}) => {
	const {fps} = useVideoConfig();
	const remappedFrame = useRemappedFrame() + elapsedFrames;

	const remappedTime = new Date(Math.round((remappedFrame / fps) * 1000));
	remappedTime.setHours(remappedTime.getHours() - 1);
	return (
		<AbsoluteFill
			style={{
				fontFamily: 'monospace',
				color: COLOR_2,
				top: 'unset',
				bottom: 0,
				margin: '1em',
				fontSize: '5em',
				height: 'min-content',
				textShadow: `-2px -2px 0 ${COLOR_1}, 2px -2px 0 ${COLOR_1} , -2px 2px 0 ${COLOR_1} , 2px 2px 0 ${COLOR_1} `,
			}}
		>
			<span>
				~ {remappedTime.toTimeString().match(/.*(\d\d:\d\d:\d\d)/)![1]}.
				{remappedTime.getMilliseconds()}
			</span>
			{isPreview && (
				<div style={{color: COLOR_1}}>
					file: {file}
					<br/>
					frame: {remappedFrame - elapsedFrames}
				</div>

			)}
		</AbsoluteFill>
	);
};
