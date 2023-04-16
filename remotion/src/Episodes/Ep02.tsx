import {Episode} from './Standard/Episode';
import {EpProps} from './Standard/types';

export const Ep02 = ({
	editorMode,
	...epProps
}: {editorMode?: boolean} & Partial<EpProps>) => {
	
	return (
		<Episode
			path="02/Ep02.yaml"
			id="Ep02"
			editorMode={editorMode}
			{...epProps}
		/>
	);
};
