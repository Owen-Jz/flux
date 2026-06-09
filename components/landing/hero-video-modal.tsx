"use client";

/**
 * Full-screen lightbox that plays the Flux hero ad live in the browser via
 * @remotion/player. The composition is the real Remotion <FluxAd> — so the video
 * is fully interactive (scrub, play/pause, fullscreen) rather than a baked MP4.
 *
 * This module is loaded lazily (next/dynamic, ssr:false) by the hero, so neither
 * @remotion/player nor the composition ship in the initial bundle, and none of
 * the browser-only Remotion code runs during SSR.
 */

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Player, type PlayerRef } from "@remotion/player";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FluxAd } from "@/remotion/flux-ad/FluxAd";
import { VIDEO } from "@/remotion/flux-ad/theme";

type Props = {
  open: boolean;
  onClose: () => void;
};

function BrandedLoader() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        gap: 14,
        color: "#a1a1aa",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "3px solid #27272a",
          borderTopColor: "#a78bfa",
          animation: "flux-spin 0.8s linear infinite",
        }}
      />
      Loading the film…
      <style>{`@keyframes flux-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function HeroVideoModal({ open, onClose }: Props) {
  const playerRef = useRef<PlayerRef>(null);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Autoplay from the start each time the modal opens (the open click satisfies
  // the browser's gesture requirement, so audio plays).
  useEffect(() => {
    if (!open) return;
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    const id = window.setTimeout(() => {
      try {
        player.play();
      } catch {
        /* a denied autoplay just leaves it paused with controls — acceptable */
      }
    }, 120);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Watch how Flux works"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseDown={handleBackdrop}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(12px, 4vw, 48px)",
            background: "rgba(9, 9, 11, 0.86)",
            backdropFilter: "blur(10px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", width: "100%", maxWidth: 1180 }}
          >
            <button
              onClick={onClose}
              aria-label="Close video"
              style={{
                position: "absolute",
                top: -52,
                right: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fafafa",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <XMarkIcon style={{ width: 18, height: 18 }} />
              Close
            </button>

            <div
              style={{
                position: "relative",
                aspectRatio: `${VIDEO.width} / ${VIDEO.height}`,
                width: "100%",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid #27272a",
                boxShadow: "0 40px 120px -30px rgba(124, 58, 237, 0.45), 0 30px 80px -40px rgba(0,0,0,0.9)",
              }}
            >
              <Player
                ref={playerRef}
                component={FluxAd}
                durationInFrames={VIDEO.durationInFrames}
                fps={VIDEO.fps}
                compositionWidth={VIDEO.width}
                compositionHeight={VIDEO.height}
                style={{ width: "100%", height: "100%" }}
                controls
                clickToPlay
                doubleClickToFullscreen
                spaceKeyToPlayOrPause
                renderLoading={() => <BrandedLoader />}
                acknowledgeRemotionLicense
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
