"use client";

import { motion } from "framer-motion";

const RAINBOW = [
  "hsla(0, 85%, 60%, 0.5)",
  "hsla(35, 90%, 55%, 0.5)",
  "hsla(60, 80%, 50%, 0.45)",
  "hsla(120, 65%, 45%, 0.5)",
  "hsla(200, 85%, 55%, 0.5)",
  "hsla(260, 75%, 55%, 0.5)",
  "hsla(310, 75%, 55%, 0.5)",
  "hsla(0, 85%, 60%, 0.5)",
];

const cornerDefs = [
  { pos: "top-0 left-0", borders: "border-l-2 border-t-2", radius: "rounded-tl-2xl" },
  { pos: "top-0 right-0", borders: "border-r-2 border-t-2", radius: "rounded-tr-2xl" },
  { pos: "bottom-0 left-0", borders: "border-l-2 border-b-2", radius: "rounded-bl-2xl" },
  { pos: "bottom-0 right-0", borders: "border-r-2 border-b-2", radius: "rounded-br-2xl" },
];

export default function RainbowCorners({ size = "w-16 h-16" }: { size?: string }) {
  return (
    <>
      {cornerDefs.map((c, i) => (
        <motion.div
          key={i}
          className={`absolute ${c.pos} ${size} ${c.borders} ${c.radius} border-transparent`}
          animate={{ borderColor: RAINBOW }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </>
  );
}
