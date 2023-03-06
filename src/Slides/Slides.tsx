import {useCurrentFrame} from 'remotion';
import {PresentationClip, Props as ClipProps} from './PresentationClip';
import {FrameMapping} from '../Video/VideoClip';

export type Props = {script: FrameMapping<ClipProps>[]};

export const Slides: React.FC<Props> = ({script = []}) => {
	const frame = useCurrentFrame();

	const [, , props] =
		script.find(([from, to]) => frame >= from && to >= frame) || [];

	return <>{props && <PresentationClip {...props} />}</>;
};
