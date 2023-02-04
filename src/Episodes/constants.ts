import { VIDEO_CONFIG } from "../constants"

export const makeEnding = (ep: string) => ({
  title:'Thank you!',
  text: 'Sincerely yours twopack.gallery',
  textToSpeech: [
    2,
    'A-a-and cut!',
    .25,
    `Thank you for watching the ${ep} episode of the work in progress by two pack dot gallery`,
    .25,
    'I hope you enjoyed it',
    .25,
    'Please consider supporting us at Patreon dot com slash two pack underscore gallery',
    .25,
    'See you in our next episode!'
  ]
})

export const INTRO = {
  text: `
    - creative process
    - no adds
    - not a record of best practices
    - CC-BY-NC-SA 4.0
  `,
  textToSpeech: [
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

export const makePomodoro = (sessions: number, speakSessions: string) => ({
  title: 'Pomodoro',
  text: `
    work session: 45 minutes
    break: 5-15 minutes
    sessions: x${sessions}
  `,
  textToSpeech: [
    '',
    .25,
    'In this episode I am using pomodoro technique',
    .25,
    'One work session is forty five minutes',
    .25,
    'Each break is five to fifteen minutes',
    .25,
    `Recording of this episodes took ${speakSessions} sessions`,
  ]
})

export const EP_DURATION_FRAMES = VIDEO_CONFIG.fps * 42 * 60 