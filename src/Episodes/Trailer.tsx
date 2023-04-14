import { Episode } from './Standard/Episode';
import { EpProps, SingleSlideProps } from './Standard/types';



export const Trailer = ({
	editorMode,
	...epProps
}: {editorMode?: boolean} & Partial<EpProps>) => {
	return (
		<Episode
			id="TrailerEp"
			path="trailer.yaml"
			editorMode={editorMode}
			{...epProps}
		/>
	);
};
