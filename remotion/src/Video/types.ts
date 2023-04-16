import { BlurProps } from "./Blur"

export interface VideoClipProps {
  src: string
  endAt: number
  startFrom: number
  offthread: boolean
  blur?: (f: number) => BlurProps[]
  volume?: (f: number) => number
  accelerate: number
}