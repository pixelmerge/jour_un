'use client';
import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Lottie from 'lottie-react';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Box = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

/**
 * LottieOverlay
 * Props:
 * - show: boolean (controls visibility)
 * - path: string (public path to lottie JSON, e.g., '/animations/food.json')
 * - initialSegment?: [number, number] (frame range to play)
 * - durationMs?: number (auto-hide after this duration; if omitted, hides on animation complete)
 * - loop?: boolean (default false)
 * - speed?: number (1 = normal)
 * - onHide?: () => void (called when overlay is hidden)
 */
export default function LottieOverlay({ show, path, animationData: animationDataProp, initialSegment, durationMs, loop = false, speed = 0.6, onHide }) {
  const lottieRef = useRef(null);
  const [animationData, setAnimationData] = useState(animationDataProp || null);

  // Load animation JSON if path provided
  useEffect(() => {
    let aborted = false;
    if (path && show) {
      fetch(path)
        .then(r => r.json())
        .then(json => { if (!aborted) setAnimationData(json); })
        .catch(() => {});
    } else if (animationDataProp) {
      setAnimationData(animationDataProp);
    }
    return () => { aborted = true; };
  }, [path, animationDataProp, show]);

  useEffect(() => {
    if (!show) return;

    let t;
    const inst = lottieRef.current;

    if (inst && typeof inst.setSpeed === 'function') {
      inst.setSpeed(speed);
    }

    if (durationMs && durationMs > 0) {
      t = setTimeout(() => {
        onHide && onHide();
      }, durationMs);
    } else if (inst && typeof inst.addEventListener === 'function') {
      const handleComplete = () => {
        onHide && onHide();
      };
      inst.addEventListener('complete', handleComplete);
      return () => {
        inst.removeEventListener && inst.removeEventListener('complete', handleComplete);
        if (t) clearTimeout(t);
      };
    }

    return () => {
      if (t) clearTimeout(t);
    };
  }, [show, durationMs, onHide, speed]);

  if (!show) return null;

  return (
    <Overlay>
      <Box>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop}
          autoplay
          initialSegment={initialSegment}
          style={{ width: 200, height: 200 }}
        />
      </Box>
    </Overlay>
  );
}
