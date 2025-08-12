'use client';

import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Lottie from 'lottie-react';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(2px);
`;

export default function LottieOverlay({
  open,
  animationPath,
  fallbackAnimationPath,
  animationData: animationDataProp,
  initialSegment,        // [startFrame, endFrame]
  durationMs,            // if provided, auto-close after this time
  speed = 0.5,
  loop = false,
  stripWhite = false,
  onClose
}) {
  const lottieRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState(animationDataProp || null);
  // bump a key when opening to force a fresh mount when re-used
  const [mountKey, setMountKey] = useState(0);

  // Load animation JSON if path provided (with optional fallback)
  useEffect(() => {
    let aborted = false;
    const load = async () => {
      const tryLoad = async (path) => {
        const res = await fetch(encodeURI(path));
        if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
        const json = await res.json();
        if (!json) throw new Error('Empty animation json');
        return json;
      };

      if (open) {
        try {
          if (animationPath) {
            const json = await tryLoad(animationPath);
            if (!aborted) setData(json);
          } else if (animationDataProp) {
            setData(animationDataProp);
          }
        } catch (e) {
          if (fallbackAnimationPath) {
            try {
              const json = await tryLoad(fallbackAnimationPath);
              if (!aborted) setData(json);
            } catch {}
          }
        }
      } else if (animationDataProp) {
        setData(animationDataProp);
      }
    };

    load();
    return () => { aborted = true; };
  }, [open, animationPath, fallbackAnimationPath, animationDataProp]);

  // Control playback, segments, speed
  useEffect(() => {
    if (!open || !data) return;

    // force re-mount of Lottie when reopened with same data to restart autoplay
    setMountKey(k => k + 1);

    // after the Lottie component mounts and ref is attached, set speed and play
    const start = () => {
      if (!lottieRef.current) return;
      try {
        lottieRef.current.setSpeed(speed);
        if (initialSegment && Array.isArray(initialSegment)) {
          lottieRef.current.playSegments(initialSegment, true);
        } else {
          lottieRef.current.goToAndPlay(0, true);
        }
      } catch {
        // ignore
      }
    };

    // use RAF to ensure child mounted
    const raf = requestAnimationFrame(() => start());

    let timer;
    if (durationMs) {
      timer = setTimeout(() => onClose?.(), durationMs);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [open, data, speed, Array.isArray(initialSegment) ? initialSegment.join(',') : '']);

  // Strip white backgrounds from SVG if requested
  useEffect(() => {
    if (!open || !stripWhite) return;
    const el = containerRef.current;
    if (!el) return;
    // Run after Lottie renders
    const id = requestAnimationFrame(() => {
      try {
        const svgs = el.querySelectorAll('svg');
        svgs.forEach(svg => {
          // Make svg background transparent
          svg.style.background = 'transparent';
          // Remove white fills
          const whiteNodes = svg.querySelectorAll('[fill="#ffffff"], [fill="#FFFFFF"], [fill="white"], [style*="fill:#ffffff"], [style*="fill:#FFFFFF"], [style*="fill: white"], [style*="fill: rgb(255, 255, 255)"]');
          whiteNodes.forEach(node => {
            if (node.hasAttribute('fill')) node.setAttribute('fill', 'none');
            node.style.fill = 'none';
            node.style.fillOpacity = '0';
            node.setAttribute('fill-opacity', '0');
          });
        });
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, [open, mountKey, stripWhite]);

  if (!open) return null;

  return (
    <Backdrop onClick={() => onClose?.()} ref={containerRef}>
      {data && (
        <Lottie
          key={mountKey}
          lottieRef={lottieRef}
          animationData={data}
          initialSegment={initialSegment}
          loop={loop}
          autoplay={true}
          style={{ width: 260, height: 260, background: 'transparent' }}
          onComplete={() => {
            // If no fixed duration provided, close on segment completion
            if (!durationMs) onClose?.();
          }}
        />
      )}
    </Backdrop>
  );
}
