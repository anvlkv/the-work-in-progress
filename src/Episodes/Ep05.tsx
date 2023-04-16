import {Episode} from './Standard/Episode';
import {EpProps} from './Standard/types';

export const Ep05 = ({
	editorMode,
	...epProps
}: {editorMode?: boolean} & Partial<EpProps>) => {
	
	return (
		<Episode
			path="05/Ep05.yaml"
			id="Ep05"
			editorMode={editorMode}
			{...epProps}
		/>
	);
};
