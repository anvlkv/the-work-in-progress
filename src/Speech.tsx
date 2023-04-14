import {Audio} from 'remotion'
import { phrasesToTTsUrl, TTSEntry } from './phrasesToSpeech'

export const Speech: React.FC<{speech: TTSEntry, }> = ({speech}) => {
  const url = phrasesToTTsUrl(speech)
  return <Audio src={url} volume={100} muted={false}/>
}