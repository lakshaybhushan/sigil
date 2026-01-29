"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { SignatureCanvas, type SignatureCanvasRef, type Theme, type FrameStyle, type PatternStyle } from "@/components/signature-canvas"
import { Keyboard } from "@/components/keyboard"
import { Toast } from "@/components/toast"
import { Onboarding } from "@/components/onboarding"
import { Download, RotateCcw, Copy, Volume2, VolumeX, FileCode, Square, Columns2, Check, Settings2, Info, X } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SoundPack = "mechanical" | "membrane" | "typewriter"

const SOUND_PACKS: Record<SoundPack, { label: string; create: (ctx: AudioContext) => void }> = {
  mechanical: {
    label: "MKB",
    create: (ctx: AudioContext) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "square"
      osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03)
      
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(3000, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05)
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.06)
    }
  },
  membrane: {
    label: "MEM",
    create: (ctx: AudioContext) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(400 + Math.random() * 100, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04)
      
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(1000, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    }
  },
  typewriter: {
    label: "TYP",
    create: (ctx: AudioContext) => {
      const click = ctx.createOscillator()
      const clickGain = ctx.createGain()
      click.connect(clickGain)
      clickGain.connect(ctx.destination)
      
      click.type = "square"
      click.frequency.setValueAtTime(3000 + Math.random() * 800, ctx.currentTime)
      click.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.01)
      
      clickGain.gain.setValueAtTime(0.06, ctx.currentTime)
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015)
      
      click.start(ctx.currentTime)
      click.stop(ctx.currentTime + 0.015)
      
      const thud = ctx.createOscillator()
      const thudGain = ctx.createGain()
      thud.connect(thudGain)
      thudGain.connect(ctx.destination)
      
      thud.type = "sine"
      thud.frequency.setValueAtTime(100 + Math.random() * 30, ctx.currentTime + 0.005)
      
      thudGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.005)
      thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      
      thud.start(ctx.currentTime + 0.005)
      thud.stop(ctx.currentTime + 0.05)
    }
  }
}

const THEME_COLORS: Record<Theme, string> = {
  mono: "bg-neutral-400",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
}

// Custom corner icon component
const CornersIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 4V1h3M10 1h3v3M13 10v3h-3M4 13H1v-3" />
  </svg>
)

// No frame icon
const NoFrameIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2">
    <rect x="1" y="1" width="12" height="12" />
  </svg>
)

// Pattern style icons
const ClassicIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="3" r="1.5" fill="currentColor" />
    <circle cx="3" cy="10" r="1.5" fill="currentColor" />
    <circle cx="11" cy="10" r="1.5" fill="currentColor" />
    <path d="M7 3L3 10M7 3L11 10M3 10L11 10" />
  </svg>
)

const OrbitalIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
    <ellipse cx="7" cy="7" rx="5.5" ry="3" />
    <ellipse cx="7" cy="7" rx="5.5" ry="3" transform="rotate(60 7 7)" />
    <ellipse cx="7" cy="7" rx="5.5" ry="3" transform="rotate(120 7 7)" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
)

const SpiralIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7 7C7 5.5 8.5 4 10 4C12 4 13 6 13 7C13 9.5 10.5 12 7 12C3 12 1 9 1 6C1 2.5 4 0.5 7 0.5" strokeLinecap="round" />
  </svg>
)

const GeometricIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="7,1 13,5 11,12 3,12 1,5" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <path d="M7 1L7 7M13 5L7 7M11 12L7 7M3 12L7 7M1 5L7 7" strokeWidth="1" opacity="0.5" />
  </svg>
)

const WaveIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 7C2 4 3 4 4 7C5 10 6 10 7 7C8 4 9 4 10 7C11 10 12 10 13 7" strokeLinecap="round" />
  </svg>
)

const ScatterIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <circle cx="3" cy="4" r="1.5" />
    <circle cx="10" cy="3" r="1.5" />
    <circle cx="7" cy="7" r="1.5" />
    <circle cx="4" cy="11" r="1.5" />
    <circle cx="11" cy="9" r="1.5" />
  </svg>
)

const PATTERN_OPTIONS: { style: PatternStyle; icon: React.ReactNode; label: string }[] = [
  { style: "classic", icon: <ClassicIcon />, label: "Classic" },
  { style: "orbital", icon: <OrbitalIcon />, label: "Orbital" },
  { style: "spiral", icon: <SpiralIcon />, label: "Spiral" },
  { style: "geometric", icon: <GeometricIcon />, label: "Geometric" },
  { style: "wave", icon: <WaveIcon />, label: "Wave" },
  { style: "scatter", icon: <ScatterIcon />, label: "Scatter" },
]

export default function SignatureApp() {
  const [name, setName] = useState("")
  const [theme, setTheme] = useState<Theme>("mono")
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("none")
  const [patternStyle, setPatternStyle] = useState<PatternStyle>("classic")
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const [typedKeys, setTypedKeys] = useState<Set<string>>(new Set())
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundPack, setSoundPack] = useState<SoundPack>("mechanical")
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false })
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<SignatureCanvasRef>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playKeySound = useCallback(() => {
    if (!soundEnabled) return
    const ctx = initAudio()
    if (ctx.state === "suspended") {
      ctx.resume()
    }
    SOUND_PACKS[soundPack].create(ctx)
  }, [initAudio, soundEnabled, soundPack])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    if (value.length > name.length) {
      playKeySound()
    }
    setName(value)
    const letters = value.replace(/[^A-Z]/g, "").split("")
    setTypedKeys(new Set(letters))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()
    if (/^[A-Z0-9]$/.test(key) || key === " ") {
      setActiveKeys(prev => new Set(prev).add(key))
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()
    if (/^[A-Z0-9]$/.test(key) || key === " ") {
      setActiveKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleCanvasClick = () => {
    if (canvasRef.current && name.trim()) {
      canvasRef.current.addStamp()
    }
  }

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast({ message: "", visible: false }), 2000)
  }, [])

  const downloadJPG = useCallback(async () => {
    if (!canvasRef.current || !name.trim()) return
    const dataUrl = await canvasRef.current.exportPNG(false, true)
    if (!dataUrl) return
    const link = document.createElement("a")
    link.download = `sigil-${name.toLowerCase().replace(/\s+/g, "-")}.jpg`
    link.href = dataUrl
    link.click()
    showToast("Saved as JPG")
  }, [name, showToast])

  const downloadSVG = useCallback(() => {
    if (!canvasRef.current || !name.trim()) return
    const svg = canvasRef.current.exportSVG()
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = `sigil-${name.toLowerCase().replace(/\s+/g, "-")}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    showToast("Saved as SVG")
  }, [name, showToast])

  const copyToClipboard = useCallback(async () => {
    if (!canvasRef.current || !name.trim()) return
    const success = await canvasRef.current.copyToClipboard(true)
    if (success) {
      setCopyFeedback(true)
      showToast("Copied to clipboard")
      setTimeout(() => setCopyFeedback(false), 1500)
    }
  }, [name, showToast])

  const clearSignature = useCallback(() => {
    setName("")
    setTypedKeys(new Set())
    setActiveKeys(new Set())
    showToast("Cleared")
  }, [showToast])

  const cycleTheme = useCallback(() => {
    const themes: Theme[] = ["mono", "amber", "blue", "emerald", "violet", "rose", "cyan"]
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    showToast(`${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} theme`)
  }, [theme, showToast])

  const cycleSoundPack = () => {
    const packs: SoundPack[] = ["mechanical", "membrane", "typewriter"]
    const currentIndex = packs.indexOf(soundPack)
    setSoundPack(packs[(currentIndex + 1) % packs.length])
  }

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false)
      }
    }

    if (showExportMenu || showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showExportMenu, showSettingsMenu])

  // Close info modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showInfoModal) {
        setShowInfoModal(false)
      }
    }

    if (showInfoModal) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showInfoModal])

  const frameOptions: { style: FrameStyle; icon: React.ReactNode; label: string }[] = [
    { style: "none", icon: <NoFrameIcon />, label: "No Frame" },
    { style: "thin", icon: <Square className="w-3.5 h-3.5" strokeWidth={1.5} />, label: "Thin Border" },
    { style: "double", icon: <Columns2 className="w-3.5 h-3.5" strokeWidth={1.5} />, label: "Double Border" },
    { style: "corners", icon: <CornersIcon />, label: "Corner Brackets" },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <main className="min-h-screen bg-black flex flex-col overflow-hidden">
        <motion.div
          className="flex-1 flex flex-col items-center justify-center p-4 pb-0"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
              },
            },
          }}
        >
          <div className="w-full max-w-3xl space-y-3">
            {/* Header */}
            <motion.div
              className="flex items-center justify-center"
              variants={{
                hidden: { opacity: 0, y: -10, filter: "blur(10px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { type: "spring", stiffness: 100, damping: 20 },
                },
              }}
            >
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-xs font-light uppercase tracking-[0.3em]">SIGIL</span>
                <span className="text-neutral-500">/</span>
                <span className="text-[10px] font-light uppercase tracking-wider text-neutral-500">001</span>
              </div>
            </motion.div>

            {/* Signature Canvas */}
            <motion.div
              className="border border-neutral-800 cursor-crosshair"
              onClick={handleCanvasClick}
              variants={{
                hidden: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
                visible: {
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { type: "spring", stiffness: 80, damping: 20 },
                },
              }}
            >
              <div
                ref={canvasContainerRef}
                className="w-full aspect-[16/9] bg-black relative"
              >
                {name.trim() ? (
                  <SignatureCanvas
                    ref={canvasRef}
                    name={name}
                    theme={theme}
                    frameStyle={frameStyle}
                    patternStyle={patternStyle}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      className="text-xs uppercase tracking-[0.4em] text-neutral-500"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Start typing
                    </motion.span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Input */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { type: "spring", stiffness: 100, damping: 20 },
                },
              }}
            >
              <Input
                ref={inputRef}
                type="text"
                aria-label="Enter your name"
                placeholder="START TYPING…"
                value={name}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
                autoFocus
                className="w-full h-10 text-xs font-light uppercase tracking-[0.15em] px-3 bg-black border-neutral-800 text-neutral-300 placeholder:text-neutral-500 focus:border-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-600 rounded-none"
                maxLength={255}
              />
            </motion.div>

            {/* Keyboard - Hidden on mobile */}
            <motion.div
              className="hidden sm:block"
              variants={{
                hidden: { opacity: 0, y: 15, filter: "blur(10px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { type: "spring", stiffness: 80, damping: 20 },
                },
              }}
            >
              <Keyboard activeKeys={activeKeys} typedKeys={typedKeys} />
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Dock - Fixed at bottom */}
        <motion.div
          className="sticky bottom-0 w-full bg-black border-t border-neutral-800 py-2 sm:py-3 px-2 sm:px-4"
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-px">
              {/* Mobile Settings Menu */}
              <div className="relative sm:hidden" ref={settingsMenuRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      aria-label="Settings"
                      aria-expanded={showSettingsMenu}
                      aria-haspopup="menu"
                      className="h-8 w-8 flex items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                    >
                      <Settings2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                    SETTINGS
                  </TooltipContent>
                </Tooltip>

                {showSettingsMenu && (
                  <div role="menu" className="absolute bottom-full left-0 mb-1 bg-neutral-950 border border-neutral-700 p-2 min-w-[200px]">
                    {/* Sound Section */}
                    <div className="mb-3">
                      <div className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5 px-1">Sound</div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                          className="h-8 w-8 flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer"
                        >
                          {soundEnabled ? <Volume2 className="w-4 h-4" strokeWidth={1.5} /> : <VolumeX className="w-4 h-4" strokeWidth={1.5} />}
                        </button>
                        <button
                          onClick={cycleSoundPack}
                          disabled={!soundEnabled}
                          className={`h-8 px-2 flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-[background-color,color] text-[9px] uppercase tracking-wider ${soundEnabled ? "text-neutral-400 hover:text-neutral-300 cursor-pointer" : "text-neutral-600 cursor-not-allowed"}`}
                        >
                          {SOUND_PACKS[soundPack].label}
                        </button>
                      </div>
                    </div>

                    {/* Pattern Section */}
                    <div className="mb-3">
                      <div className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5 px-1">Pattern</div>
                      <div className="flex flex-wrap gap-1">
                        {PATTERN_OPTIONS.map((option) => (
                          <button
                            key={option.style}
                            onClick={() => setPatternStyle(option.style)}
                            aria-label={option.label}
                            aria-pressed={patternStyle === option.style}
                            className={`h-8 w-8 flex items-center justify-center transition-[background-color,color,border-color] cursor-pointer ${
                              patternStyle === option.style
                                ? "text-white bg-neutral-600 border border-neutral-400"
                                : "text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                            }`}
                          >
                            {option.icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame Section */}
                    <div className="mb-3">
                      <div className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5 px-1">Frame</div>
                      <div className="flex flex-wrap gap-1">
                        {frameOptions.map((option) => (
                          <button
                            key={option.style}
                            onClick={() => setFrameStyle(option.style)}
                            aria-label={option.label}
                            aria-pressed={frameStyle === option.style}
                            className={`h-8 w-8 flex items-center justify-center transition-[background-color,color,border-color] cursor-pointer ${
                              frameStyle === option.style
                                ? "text-white bg-neutral-600 border border-neutral-400"
                                : "text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300"
                            }`}
                          >
                            {option.icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Section */}
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5 px-1">Theme</div>
                      <div className="flex flex-wrap gap-1">
                        {(Object.keys(THEME_COLORS) as Theme[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => { setTheme(t); showToast(`${t.charAt(0).toUpperCase() + t.slice(1)} theme`) }}
                            aria-label={`${t} theme`}
                            aria-pressed={theme === t}
                            className={`h-8 w-8 flex items-center justify-center transition-[background-color,border-color] cursor-pointer ${
                              theme === t
                                ? "bg-neutral-600 border border-neutral-400"
                                : "bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
                            }`}
                          >
                            <div className={`w-3 h-3 ${THEME_COLORS[t]}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop: Sound Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                    className="hidden sm:flex h-9 w-9 items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <VolumeX className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                  {soundEnabled ? "MUTE" : "UNMUTE"}
                </TooltipContent>
              </Tooltip>

              {/* Desktop: Sound Pack */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={cycleSoundPack}
                    disabled={!soundEnabled}
                    aria-label="Change sound pack"
                    className={`hidden sm:flex h-9 px-3 items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-[10px] uppercase tracking-wider font-light focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 ${soundEnabled ? "text-neutral-400 hover:text-neutral-300 cursor-pointer" : "text-neutral-600 cursor-not-allowed"}`}
                  >
                    {SOUND_PACKS[soundPack].label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                  SOUND PACK
                </TooltipContent>
              </Tooltip>

              <div className="hidden sm:block w-3" />

              {/* Desktop: Pattern Style Options */}
              {PATTERN_OPTIONS.map((option) => (
                <Tooltip key={option.style}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setPatternStyle(option.style)}
                      aria-label={option.label}
                      aria-pressed={patternStyle === option.style}
                      className={`hidden sm:flex h-9 w-9 items-center justify-center transition-[background-color,color,border-color] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 ${
                        patternStyle === option.style
                          ? "text-white bg-neutral-700 border border-neutral-500"
                          : "text-neutral-400 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 hover:text-neutral-300"
                      }`}
                    >
                      {option.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                    {option.label.toUpperCase()}
                  </TooltipContent>
                </Tooltip>
              ))}

              <div className="hidden sm:block w-3" />

              {/* Desktop: Frame Style Options */}
              {frameOptions.map((option) => (
                <Tooltip key={option.style}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFrameStyle(option.style)}
                      aria-label={option.label}
                      aria-pressed={frameStyle === option.style}
                      className={`hidden sm:flex h-9 w-9 items-center justify-center transition-[background-color,color,border-color] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 ${
                        frameStyle === option.style
                          ? "text-white bg-neutral-700 border border-neutral-500"
                          : "text-neutral-400 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 hover:text-neutral-300"
                      }`}
                    >
                      {option.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                    {option.label.toUpperCase()}
                  </TooltipContent>
                </Tooltip>
              ))}

              <div className="hidden sm:block w-3" />

              {/* Desktop: Theme Selector */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={cycleTheme}
                    aria-label={`Change theme, current: ${theme}`}
                    className="hidden sm:flex h-9 w-9 items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                  >
                    <div aria-hidden="true" className={`w-3 h-3 ${THEME_COLORS[theme]} transition-[background-color]`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                  {theme.toUpperCase()}
                </TooltipContent>
              </Tooltip>

              <div className="hidden sm:block w-3" />

              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={!name.trim()}
                      aria-label="Export signature"
                      aria-expanded={showExportMenu}
                      aria-haspopup="menu"
                      className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer disabled:opacity-40 disabled:hover:bg-neutral-950 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                    EXPORT
                  </TooltipContent>
                </Tooltip>

                {showExportMenu && (
                  <div role="menu" className="absolute bottom-full left-0 mb-1 bg-neutral-950 border border-neutral-700">
                    <button
                      role="menuitem"
                      onClick={() => { downloadJPG(); setShowExportMenu(false) }}
                      className="w-full h-8 px-3 flex items-center gap-2 text-[10px] uppercase tracking-wider font-light text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-[background-color,color] cursor-pointer focus-visible:outline-none focus-visible:bg-neutral-900 focus-visible:text-neutral-200"
                    >
                      <Download aria-hidden="true" className="w-3 h-3" strokeWidth={1.5} />
                      JPG
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => { downloadSVG(); setShowExportMenu(false) }}
                      className="w-full h-8 px-3 flex items-center gap-2 text-[10px] uppercase tracking-wider font-light text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-[background-color,color] cursor-pointer focus-visible:outline-none focus-visible:bg-neutral-900 focus-visible:text-neutral-200"
                    >
                      <FileCode aria-hidden="true" className="w-3 h-3" strokeWidth={1.5} />
                      SVG
                    </button>
                  </div>
                )}
              </div>

              {/* Copy */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyToClipboard}
                    disabled={!name.trim()}
                    aria-label={copyFeedback ? "Copied to clipboard" : "Copy to clipboard"}
                    className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer disabled:opacity-40 disabled:hover:bg-neutral-950 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                  >
                    <span className="relative w-4 h-4">
                      <Copy
                        aria-hidden="true"
                        className={`w-4 h-4 absolute inset-0 transition-[opacity,transform] duration-200 ${copyFeedback ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}
                        strokeWidth={1.5}
                      />
                      <Check
                        aria-hidden="true"
                        className={`w-4 h-4 absolute inset-0 text-neutral-300 transition-[opacity,transform] duration-200 ${copyFeedback ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                        strokeWidth={1.5}
                      />
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                  {copyFeedback ? "COPIED" : "COPY"}
                </TooltipContent>
              </Tooltip>

              {/* Reset */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={clearSignature}
                    disabled={!name}
                    aria-label="Reset signature"
                    className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 transition-[background-color,color] text-neutral-400 hover:text-neutral-300 cursor-pointer disabled:opacity-40 disabled:hover:bg-neutral-950 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                  >
                    <RotateCcw aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-neutral-900 border-neutral-800 text-neutral-400 text-[10px] rounded-none px-2 py-1">
                  RESET
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.div>

        <Toast message={toast.message} isVisible={toast.visible} />
        <Onboarding />

        {/* Credit */}
        <a
          href="https://x.com/blakssh"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-3 right-4 text-[9px] uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-300 transition-[color] focus-visible:outline-none focus-visible:text-neutral-300 focus-visible:ring-1 focus-visible:ring-neutral-500"
        >
          blakssh
        </a>

        {/* Info Button */}
        <button
          onClick={() => setShowInfoModal(true)}
          aria-label="How it works"
          className="fixed top-3 left-4 p-1.5 text-neutral-500 hover:text-neutral-300 transition-[color] cursor-pointer focus-visible:outline-none focus-visible:text-neutral-300 focus-visible:ring-1 focus-visible:ring-neutral-500"
        >
          <Info className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
            >
              <motion.div
                className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-neutral-950 border border-neutral-800 p-6"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowInfoModal(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-neutral-300 transition-[color] cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-200 mb-6">How It Works</h2>

                {/* Pattern Algorithms */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-800 pb-2">Pattern Algorithms</h3>

                  <div className="space-y-3 text-[11px] text-neutral-400 leading-relaxed">
                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><ClassicIcon /></span>
                        Classic
                      </div>
                      <p className="mt-1">Places letters in a circular arrangement based on their position in the alphabet. Vowels orbit closer to the center. Letters are connected sequentially with cross-connections for visual depth.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><OrbitalIcon /></span>
                        Orbital
                      </div>
                      <p className="mt-1">Distributes letters across three elliptical orbits. Vowels occupy the innermost ring, consonants alternate between middle and outer rings. Uses Delaunay triangulation for natural-looking connections.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><SpiralIcon /></span>
                        Spiral
                      </div>
                      <p className="mt-1">Arranges letters along a golden ratio spiral (φ ≈ 1.618). Each letter is placed at the golden angle (≈137.5°) from the previous, creating an aesthetically pleasing distribution found in nature.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><GeometricIcon /></span>
                        Geometric
                      </div>
                      <p className="mt-1">Creates sacred geometry patterns. Letters form regular polygons (pentagon, hexagon, etc.) with inner structures. Includes star connections when there are 5+ outer points.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><WaveIcon /></span>
                        Wave
                      </div>
                      <p className="mt-1">Positions letters along sinusoidal waves. Multiple frequencies are combined based on character codes, creating unique wave patterns for each name.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <span className="text-neutral-300"><ScatterIcon /></span>
                        Scatter
                      </div>
                      <p className="mt-1">Uses force-directed placement with physics simulation. Points repel each other while being attracted to the center, then connects using Delaunay triangulation for organic results.</p>
                    </div>
                  </div>
                </div>

                {/* Special Effects */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-800 pb-2">Special Effects</h3>

                  <div className="space-y-3 text-[11px] text-neutral-400 leading-relaxed">
                    <div>
                      <span className="text-neutral-200 font-medium">Letter Frequency</span>
                      <p className="mt-1">Repeated letters create brighter, thicker connections. Type &quot;ANNA&quot; or &quot;MISSISSIPPI&quot; to see letters like A, S, I glow more intensely as their frequency increases.</p>
                    </div>

                    <div>
                      <span className="text-neutral-200 font-medium">Vowel Highlighting</span>
                      <p className="mt-1">Vowels (A, E, I, O, U) are rendered slightly larger and positioned differently, creating visual hierarchy within the constellation.</p>
                    </div>

                    <div>
                      <span className="text-neutral-200 font-medium">Interactive Hover</span>
                      <p className="mt-1">Hover over any point to reveal its letter and highlight connected lines. On mobile, tap and hold to see the same effect.</p>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-800 pb-2">Tips</h3>

                  <div className="space-y-2 text-[11px] text-neutral-400 leading-relaxed">
                    <p>• Click anywhere on the canvas to add a date stamp</p>
                    <p>• Each name generates a unique, deterministic pattern</p>
                    <p>• Export as SVG for infinite scalability</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </TooltipProvider>
  )
}
