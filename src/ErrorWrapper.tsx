import { ErrorBoundary } from "react-error-boundary"
import { AbsoluteFill } from "remotion"
import { COLOR_2, COLOR_3 } from "./constants"


const ErrorMessage = () => {
  return <AbsoluteFill style={{color: COLOR_3, fontSize: '2em', backgroundColor: COLOR_2}}>error</AbsoluteFill>
}

export const ErrorWrapper: React.FC<React.PropsWithChildren> = ({children}) => {
  return <ErrorBoundary fallbackRender={ErrorMessage}>
    {children}
  </ErrorBoundary>
}