"use client";

import { useEffect, useRef } from "react";

interface AdBlockProps {
  adClient: string;   // ca-pub-xxxxxxxxxxxxxxxx
  adSlot: string;     // numeric slot ID
  adFormat?: string;  // "auto", "rectangle", "leaderboard", etc
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Google AdSense / AdMob block
 * Renders an ins element and pushes to adsbygoogle
 *
 * For test ads use:
 *   adClient="ca-pub-3940256099942544"
 *   adSlot="6300978111"  (leaderboard test)
 *   adSlot="1033173712"  (rectangle test)
 */
export function AdBlock({
  adClient,
  adSlot,
  adFormat = "auto",
  className,
  style,
}: AdBlockProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, []);

  return (
    <div className={className} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Async loader: fetches active ad slots from DB then renders
 */
import { useState, useEffect as useEff } from "react";

interface AdSlotData {
  id: string;
  adClient: string;
  adSlot: string;
  adFormat: string;
  position: string;
}

export function AdBlockLoader({ position, className }: { position: string; className?: string }) {
  const [slot, setSlot] = useState<AdSlotData | null>(null);

  useEff(() => {
    fetch(`/api/adslots?position=${position}`)
      .then((r) => r.json())
      .then((d) => {
        const active = (d.data ?? []).find((s: AdSlotData) => s.position === position);
        if (active) setSlot(active);
      })
      .catch(() => {});
  }, [position]);

  if (!slot) return null;

  return (
    <AdBlock
      adClient={slot.adClient}
      adSlot={slot.adSlot}
      adFormat={slot.adFormat}
      className={className}
    />
  );
}
