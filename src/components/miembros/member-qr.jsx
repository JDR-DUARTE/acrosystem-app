"use client";

import { QRCodeSVG } from "qrcode.react";

export default function MemberQr({ value, size = 120 }) {
  if (!value) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white/5 text-xs text-acro-muted"
        style={{ width: size, height: size }}
      >
        Sin QR
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-2">
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  );
}
