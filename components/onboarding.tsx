"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

const ONBOARDING_KEY = "sigil-onboarding-seen"

export function Onboarding() {
  const [isVisible, setIsVisible] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [showContent, setShowContent] = useState(false)
  const fullText = "SIGIL"

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY)
    if (!seen) {
      const timer = setTimeout(() => setIsVisible(true), 200)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    // Start typing after a brief delay
    const startDelay = setTimeout(() => {
      let index = 0
      const interval = setInterval(() => {
        if (index <= fullText.length) {
          setTypedText(fullText.slice(0, index))
          index++
        } else {
          clearInterval(interval)
          // Show rest of content after typing completes
          setTimeout(() => setShowContent(true), 300)
        }
      }, 100)

      return () => clearInterval(interval)
    }, 400)

    return () => clearTimeout(startDelay)
  }, [isVisible])

  const dismiss = () => {
    setIsVisible(false)
    localStorage.setItem(ONBOARDING_KEY, "true")
  }

  // Grid intersection points for constellation effect
  const constellationNodes = useMemo(
    () => [
      { x: 20, y: 15, delay: 0.1 },
      { x: 80, y: 20, delay: 0.2 },
      { x: 15, y: 45, delay: 0.15 },
      { x: 85, y: 50, delay: 0.25 },
      { x: 25, y: 75, delay: 0.3 },
      { x: 75, y: 80, delay: 0.2 },
      { x: 50, y: 10, delay: 0.1 },
      { x: 50, y: 90, delay: 0.35 },
      { x: 10, y: 60, delay: 0.4 },
      { x: 90, y: 35, delay: 0.15 },
    ],
    []
  )

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={dismiss}
        >
          {/* Animated grid that draws in */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="gridFade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.02" />
                <stop offset="50%" stopColor="white" stopOpacity="0.04" />
                <stop offset="100%" stopColor="white" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Vertical lines */}
            {[...Array(21)].map((_, i) => (
              <motion.line
                key={`v-${i}`}
                x1={`${i * 5}%`}
                y1="0%"
                x2={`${i * 5}%`}
                y2="100%"
                stroke="url(#gridFade)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.03,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Horizontal lines */}
            {[...Array(21)].map((_, i) => (
              <motion.line
                key={`h-${i}`}
                x1="0%"
                y1={`${i * 5}%`}
                x2="100%"
                y2={`${i * 5}%`}
                stroke="url(#gridFade)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.03,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Constellation nodes at intersections */}
            {constellationNodes.map((node, i) => (
              <motion.circle
                key={i}
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r="2"
                fill="white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.6, 0.3], scale: 1 }}
                transition={{
                  duration: 2,
                  delay: 0.8 + node.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </svg>

          {/* Center glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)",
            }}
          />

          <motion.div
            className="relative z-10 text-center px-6"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Main title */}
            <div className="mb-10 sm:mb-16">
              <div className="relative inline-block">
                <h1 className="text-[40px] sm:text-[72px] font-extralight tracking-[0.3em] sm:tracking-[0.4em] text-white/90 pl-[0.3em] sm:pl-[0.4em]">
                  {typedText}
                </h1>
                <motion.span
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[36px] sm:h-[60px] bg-white/60"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </div>
              <motion.p
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/30 mt-6 sm:mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              >
                Your name as constellation
              </motion.p>
            </div>

            {/* Instructions */}
            <motion.div
              className="mb-10 sm:mb-16"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-[11px] sm:text-[12px] uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-white/50">Type</span>
                  <span className="text-white/20">→</span>
                  <span className="text-white/30">Generate</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-white/10" />
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-white/50">Click</span>
                  <span className="text-white/20">→</span>
                  <span className="text-white/30">Stamp</span>
                </div>
              </div>
            </motion.div>

            {/* Begin button */}
            <motion.button
              onClick={dismiss}
              className="group relative px-10 py-4 text-[11px] uppercase tracking-[0.4em] text-white/40 transition-colors duration-300 hover:text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="relative z-10">Begin</span>
              {/* Corner accents */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 group-hover:border-white/40 transition-colors" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 group-hover:border-white/40 transition-colors" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
            </motion.button>

            {/* Footer */}
            <motion.div
              className="mt-8 sm:mt-12 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <p className="text-white/15 mb-3">Tap anywhere to dismiss</p>
              <a
                href="https://laks.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/25 hover:text-white/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Made by laks.sh
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
