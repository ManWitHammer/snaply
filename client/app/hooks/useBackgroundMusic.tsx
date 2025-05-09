import { useEffect } from 'react'
import { useAudioPlayer } from 'expo-audio'
import useAppearanceStore from '../state/appStore'

const audioSource = require('../../assets/elevator.mp3')

export default function BackgroundMusicPlayer() {
  const musicEnabled = useAppearanceStore(state => state.musicEnabled)
  const player = useAudioPlayer(audioSource)

  useEffect(() => {
    player.loop = true

    if (musicEnabled) {
      player.play()
    } else {
      player.pause()
    }
  }, [musicEnabled])

  return null
}