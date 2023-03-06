import React, { useCallback, useContext } from 'react';
import { useCurrentFrame } from 'remotion';

export const RemappedFrameContext = React.createContext(null as null | ((from?: number) => number));

export const RemappedFrameContextProvider:React.FC<React.PropsWithChildren<{speedFn: (frame: number, from: number) => number}>> =  ({speedFn, children}) => {
	const frame = useCurrentFrame()

	const consumerFrame = useCallback((from=0) => {
		const value = speedFn(frame, from)
		return Math.round(value)
	}, [speedFn, frame])

	return <RemappedFrameContext.Provider value={consumerFrame}>
		{children}
	</RemappedFrameContext.Provider>
}

export function useRemappedFrame() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return useContext(RemappedFrameContext)!
}
