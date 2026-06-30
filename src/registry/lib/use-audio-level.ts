'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export const useAudioLevel = (active: boolean, smoothing = 0.15): RefObject<number> => {
  const levelRef = useRef<number>(-1);

  useEffect(() => {
    if (!active) {
      levelRef.current = -1;
      return;
    }

    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        let smoothed = 0;

        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) sum += data[i];
          const avg = sum / data.length / 255;
          const norm = Math.min(1, Math.max(0, (avg - 0.06) / 0.4));
          smoothed += (norm - smoothed) * smoothing;
          levelRef.current = smoothed;
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      } catch {
        levelRef.current = -1;
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      ctx?.close();
      levelRef.current = -1;
    };
  }, [active, smoothing]);

  return levelRef;
};
