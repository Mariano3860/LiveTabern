import { useEffect, useRef } from 'react';
import type { PublicWorld } from '../../packages/shared/world';

export function useAmbience(enabled: boolean, world: PublicWorld | null) {
  const context = useRef<AudioContext | null>(null);
  const latest = useRef(world);
  latest.current = world;
  useEffect(() => {
    if (!enabled) return;
    const audio = new AudioContext();
    context.current = audio;
    const volume = audio.createGain();
    volume.gain.value = 0.025;
    volume.connect(audio.destination);
    const hum = audio.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 65;
    hum.connect(volume);
    hum.start();
    const notes = [196, 246.94, 293.66, 329.63, 293.66, 246.94, 220, 196];
    let step = 0;
    function play() {
      const w = latest.current;
      if (!w?.inhabitants.some((n) => n.action === 'play_music' && n.phase === 'performing')) return;
      const tone = audio.createOscillator(),
        gain = audio.createGain();
      tone.type = 'triangle';
      // Derive the phrase from world time, so late viewers enter the same phrase.
      step = Math.floor(w.time / 550) % notes.length;
      tone.frequency.value = notes[step];
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, audio.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);
      tone.connect(gain);
      gain.connect(audio.destination);
      tone.start();
      tone.stop(audio.currentTime + 0.5);
    }
    void audio.resume();
    const timer = setInterval(play, 550);
    return () => {
      clearInterval(timer);
      hum.stop();
      void audio.close();
      context.current = null;
    };
  }, [enabled]);
}
