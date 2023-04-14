import {useCurrentFrame} from 'remotion';
import { FrameMapping } from '../Episodes/Standard/types';
import {PresentationClip, Props as ClipProps} from './PresentationClip';

export type Props = {script: FrameMapping<ClipProps>[]};

export const Slides: React.FC<Props> = ({script = []}) => {
	const frame = useCurrentFrame();

	const [, , props] =
		script.find(([from, to]) => frame >= from && to >= frame) || [];

	return <>{props && <PresentationClip {...props} />}</>;
};
