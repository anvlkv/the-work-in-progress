import {Composition} from 'remotion';
import {Ep01} from '../Episodes/Ep01';
import {Trailer} from '../Episodes/Trailer';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import {VIDEO_CONFIG} from '../constants';
import { Components } from './Components';
import { Previews } from './Previews';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TrailerEp"
				component={Trailer}
				durationInFrames={2140}
				{...VIDEO_CONFIG}
			/>
			<Composition
				id="Ep01"
				component={Ep01}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
			/>
			<Previews/>
			<Components/>
		</>
	);
};
