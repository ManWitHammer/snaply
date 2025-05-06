import { useEffect, useRef } from "react";
import { Audio } from "expo-av";
import { useAppearanceStore } from "../state/appStore";

export default function BackgroundMusicPlayer() {
  const musicEnabled = useAppearanceStore(state => state.musicEnabled);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const playMusic = async () => {
      if (musicEnabled) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/elevator.mp3"),
          { isLooping: true, volume: 0.5 }
        );

        if (!isCancelled) {
          soundRef.current = sound;
          await soundRef.current.playAsync();
        }
      } else {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    };

    playMusic();

    return () => {
      isCancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [musicEnabled]);

  return null;
}