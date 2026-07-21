"use client";

import { useEffect, useRef } from "react";

const REGION_ID = "qr-reader-region";

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let instance = null;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        instance = new Html5Qrcode(REGION_ID, { verbose: false });
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(decodedText);
          },
          () => {},
        );
      } catch (err) {
        if (!cancelled) onError?.(err?.message || "No se pudo abrir la cámara.");
      }
    }

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [onScan, onError]);

  return <div id={REGION_ID} className="w-full overflow-hidden rounded-xl" />;
}
