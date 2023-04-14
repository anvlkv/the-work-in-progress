import { VIDEO_CONFIG } from "../constants"
import { SingleSlideProps } from "./Standard/types"

export const makeEnding = (ep: string): SingleSlideProps => ({
  id: 'ending',
  title:'Thank you!',
  text: 'Sincerely yours twopack.gallery',
  commentary: [
    `Thank you for watching the ${ep} episode of the work in progress by two pack dot gallery`,
    .25,
    'I hope you enjoyed it',
    .25,
    'Please consider supporting us at Patreon dot com slash two pack underscore gallery',
    .25,
    'See you in our next episode!'
  ]
})

export const INTRO: SingleSlideProps = {
  id: 'intro',
  text: `
    - creative process
    - no adds
    - no best practices
    - CC-BY-NC-SA 4.0
  `,
  commentary: [
    '',
    .5,
    'The following podcast demonstrates a creative process using the tools and information at hand',
    .25,
    'Products, information, and resources appearing in the podcast are only shown for completeness of the recording and not with advertising purposes',
    .25,
    'This recording is not intended as source of best practices',
    .25,
    'This podcast is distributed under Creative Commons Requires attribution Non-commercial Share alike license CC-BY-NC-SA four point zero, and is produced by two pack dot gallery'
  ]
}

export const makePomodoro = (sessions: number, speakSessions: string): SingleSlideProps => ({
  id: 'pomodoro',
  title: 'Pomodoro',
  text: `
    work session: 45 minutes
    break: 5-15 minutes
    sessions: x${sessions}
  `,
  commentary: [
    '',
    .25,
    'In this episode I am using pomodoro technique',
    .25,
    'One work session is forty five minutes',
    .25,
    'Each break is five to fifteen minutes',
    .25,
    `Recording of this episodes took approximately ${speakSessions} sessions`,
  ]
})

export const WARNING: SingleSlideProps = {
  id: 'warning',
  title: 'WARNING:',
  text: `This video may potentially trigger seizures for people with photosensitive epilepsy.
  Viewer discretion is advised.`,
  commentary:[.5,'Safety first!', 'Viewer discretion is advised',.5]
}

export const EP_DURATION_FRAMES = VIDEO_CONFIG.fps * 42 * 60 