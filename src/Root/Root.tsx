import {Composition, getInputProps} from 'remotion';
import {Ep01} from '../Episodes/Ep01';
import {Trailer} from '../Episodes/Trailer';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import {SPLASH_DURATION_S, VIDEO_CONFIG} from '../constants';
import {Components} from './Components';
import {Previews} from './Previews';
import {Ep02} from '../Episodes/Ep02';
import {Editors} from './Editors';

const {durationInFrames, ...defaultProps} = getInputProps();

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* <Composition
				id="TrailerEp"
				component={Trailer}
				durationInFrames={2867 + SPLASH_DURATION_S * VIDEO_CONFIG.fps}
				{...VIDEO_CONFIG}
			/> */}
			<Composition
				id="Ep02"
				component={Ep02}
				durationInFrames={durationInFrames || EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={defaultProps}
			/>
			<Editors />
			<Previews />
			<Components />
		</>
	);
};
