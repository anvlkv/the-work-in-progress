import {Folder, Composition, staticFile} from 'remotion';
import {ClipPreview} from '../ClipPreview';
import {VIDEO_CONFIG} from '../constants';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import { Ep02 } from '../Episodes/Ep02';
import { Editor } from '../Episodes/Standard/Editor';

export const Editors = () => {
	return (
		<Folder name="Editors">
			<Editor component={Ep02} id="Ep02"/>
		</Folder>
	);
};
