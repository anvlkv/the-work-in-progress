import {Folder, Composition, staticFile} from 'remotion';
import {ClipPreview} from '../ClipPreview';
import {VIDEO_CONFIG} from '../constants';
import {EP_DURATION_FRAMES} from '../Episodes/constants';

export const Previews = () => {
	return (
		<Folder name="Previews">
			<Composition
				id="Preview0101"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/01.webm'),
				}}
			/>
			<Composition
				id="Preview0102"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/02.webm'),
				}}
			/>
			<Composition
				id="Preview0103"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/03.webm'),
				}}
			/>
			<Composition
				id="Preview0104"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/04.webm'),
				}}
			/>
			<Composition
				id="Preview0105"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/05.webm'),
				}}
			/>
			<Composition
				id="Preview0106"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/06.webm'),
				}}
			/>
			<Composition
				id="Preview0107"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES*2}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/07.webm'),
				}}
			/>
			<Composition
				id="Preview0108"
				component={ClipPreview}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/08.webm'),
				}}
			/>
		</Folder>
	);
};
