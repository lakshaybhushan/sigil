"use client"

import { motion } from "framer-motion"

interface KeyboardProps {
  activeKeys: Set<string>
  typedKeys: Set<string>
}

const VercelLogo = () => (
  <svg
    aria-hidden="true"
    height="10"
    viewBox="0 0 74 64"
    className="fill-current"
  >
    <path d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z" />
  </svg>
)

export function Keyboard({ activeKeys, typedKeys }: KeyboardProps) {
  const getKeyClass = (key: string) => {
    const normalizedKey = key.toUpperCase()
    const isActive = activeKeys.has(normalizedKey) || activeKeys.has(key)
    const isTyped = typedKeys.has(normalizedKey) || typedKeys.has(key)

    if (isActive) {
      return "bg-neutral-700 border-neutral-600 text-neutral-100"
    }
    if (isTyped) {
      return "bg-neutral-900 border-neutral-600 text-neutral-300"
    }
    return "bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-400"
  }

  const rows = [
    { keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], offsetLeft: 0, offsetRight: 0 },
    { keys: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], offsetLeft: 0.5, offsetRight: 0.5 },
    { keys: ["A", "S", "D", "F", "G", "H", "J", "K", "L"], offsetLeft: 1, offsetRight: 1 },
    { keys: ["Z", "X", "C", "V", "B", "N", "M"], offsetLeft: 1.75, offsetRight: 1.75 },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
      },
    },
  }

  return (
    <motion.div
      className="w-full flex flex-col gap-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {rows.map((row, rowIndex) => (
        <motion.div key={rowIndex} className="flex gap-1" variants={rowVariants}>
          {/* Left offset spacer */}
          {row.offsetLeft > 0 && (
            <div style={{ flex: row.offsetLeft }} />
          )}

          {/* Keys */}
          {row.keys.map((key) => (
            <div
              key={key}
              style={{ flex: 1 }}
              className={`
                h-10 sm:h-12 flex items-center justify-center
                text-[10px] sm:text-xs font-light tracking-wide
                border transition-[background-color,border-color,color] duration-100
                ${getKeyClass(key)}
              `}
            >
              {key}
            </div>
          ))}

          {/* Right offset spacer */}
          {row.offsetRight > 0 && (
            <div style={{ flex: row.offsetRight }} />
          )}
        </motion.div>
      ))}

      {/* Space bar row */}
      <motion.div className="flex gap-1" variants={rowVariants}>
        <div style={{ flex: 3 }} />
        <div
          style={{ flex: 4 }}
          className={`
            h-10 sm:h-12 flex items-center justify-center
            border transition-[background-color,border-color,color] duration-100
            ${getKeyClass(" ")}
          `}
        >
          <VercelLogo />
        </div>
        <div style={{ flex: 3 }} />
      </motion.div>
    </motion.div>
  )
}
