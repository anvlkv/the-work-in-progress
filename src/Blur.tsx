import React from "react"
import { AbsoluteFill } from "remotion"
import { COLOR_2 } from "./constants"

export const Blur: React.FC<{style?: Partial<React.CSSProperties>}> = ({style={}}) => {
  return <AbsoluteFill style={{...style}}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <filter id="blur">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <rect fill={COLOR_2} x={5} y={5} width={90} height={90} rx={13} filter="url(#blur)" />
    </svg>
  </AbsoluteFill>
}