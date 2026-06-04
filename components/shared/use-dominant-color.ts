"use client";

import { useState, useEffect } from "react";

export function useDominantColor(imgSrc: string) {
  const [colors, setColors] = useState({ light: "#2a2a2a", dark: "#0a0a0a" });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const SIZE = 40;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;

      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      if (count === 0) return;

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness < 50) {
        const factor = 50 / (brightness || 1);
        r = Math.min(255, r * factor);
        g = Math.min(255, g * factor);
        b = Math.min(255, b * factor);
      }

      const tR = Math.min(255, Math.round(r + (255 - r) * 0.15));
      const tG = Math.min(255, Math.round(g + (255 - g) * 0.15));
      const tB = Math.min(255, Math.round(b + (255 - b) * 0.15));

      const bR = Math.round(r * 0.12);
      const bG = Math.round(g * 0.12);
      const bB = Math.round(b * 0.12);

      setColors({
        light: `rgb(${tR}, ${tG}, ${tB})`,
        dark: `rgb(${bR}, ${bG}, ${bB})`,
      });
    };
    img.src = imgSrc;
  }, [imgSrc]);

  return colors;
}
