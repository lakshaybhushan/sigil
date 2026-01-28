"use client"

import React from "react"

import { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from "react"

export type Theme = "mono" | "amber" | "blue" | "emerald" | "violet" | "rose" | "cyan"
export type FrameStyle = "none" | "thin" | "double" | "corners"

export interface SignatureCanvasRef {
  exportSVG: () => string
  exportPNG: (transparent: boolean, highRes?: boolean) => Promise<string>
  copyToClipboard: (highRes?: boolean) => Promise<boolean>
  addStamp: () => void
}

interface SignatureCanvasProps {
  name: string
  onKeyPress?: () => void
  theme?: Theme
  frameStyle?: FrameStyle
}

const THEMES = {
  mono: {
    grid: "rgba(40, 40, 40, 0.4)",
    gridAccent: "rgba(60, 60, 60, 0.6)",
    line: [85, 85, 85] as const,
    dot: [160, 160, 160] as const,
    dotGlow: [100, 100, 100] as const,
    coords: "rgba(50, 50, 50, 0.8)",
    svgLine: "#555555",
    svgDot: "#a0a0a0",
    label: "rgba(160, 160, 160, 0.9)",
  },
  amber: {
    grid: "rgba(60, 40, 20, 0.4)",
    gridAccent: "rgba(80, 50, 20, 0.6)",
    line: [180, 120, 60] as const,
    dot: [255, 180, 80] as const,
    dotGlow: [180, 100, 40] as const,
    coords: "rgba(100, 60, 30, 0.8)",
    svgLine: "#b4783c",
    svgDot: "#ffb450",
    label: "rgba(255, 180, 80, 0.9)",
  },
  blue: {
    grid: "rgba(20, 30, 50, 0.4)",
    gridAccent: "rgba(30, 50, 80, 0.6)",
    line: [60, 120, 180] as const,
    dot: [100, 180, 255] as const,
    dotGlow: [40, 100, 180] as const,
    coords: "rgba(40, 60, 100, 0.8)",
    svgLine: "#3c78b4",
    svgDot: "#64b4ff",
    label: "rgba(100, 180, 255, 0.9)",
  },
  emerald: {
    grid: "rgba(20, 50, 40, 0.4)",
    gridAccent: "rgba(30, 70, 50, 0.6)",
    line: [52, 140, 100] as const,
    dot: [80, 220, 150] as const,
    dotGlow: [40, 160, 100] as const,
    coords: "rgba(40, 80, 60, 0.8)",
    svgLine: "#348c64",
    svgDot: "#50dc96",
    label: "rgba(80, 220, 150, 0.9)",
  },
  violet: {
    grid: "rgba(40, 20, 60, 0.4)",
    gridAccent: "rgba(60, 30, 90, 0.6)",
    line: [140, 80, 200] as const,
    dot: [180, 130, 255] as const,
    dotGlow: [120, 60, 180] as const,
    coords: "rgba(80, 40, 120, 0.8)",
    svgLine: "#8c50c8",
    svgDot: "#b482ff",
    label: "rgba(180, 130, 255, 0.9)",
  },
  rose: {
    grid: "rgba(60, 20, 35, 0.4)",
    gridAccent: "rgba(90, 30, 50, 0.6)",
    line: [200, 80, 120] as const,
    dot: [255, 130, 170] as const,
    dotGlow: [180, 60, 100] as const,
    coords: "rgba(120, 40, 60, 0.8)",
    svgLine: "#c85078",
    svgDot: "#ff82aa",
    label: "rgba(255, 130, 170, 0.9)",
  },
  cyan: {
    grid: "rgba(20, 50, 55, 0.4)",
    gridAccent: "rgba(30, 70, 80, 0.6)",
    line: [50, 160, 180] as const,
    dot: [80, 220, 240] as const,
    dotGlow: [40, 140, 160] as const,
    coords: "rgba(40, 80, 90, 0.8)",
    svgLine: "#32a0b4",
    svgDot: "#50dcf0",
    label: "rgba(80, 220, 240, 0.9)",
  },
}

const VOWELS = new Set(["A", "E", "I", "O", "U"])

function getLetterPosition(char: string, index: number, total: number, seed: number) {
  const code = char.toUpperCase().charCodeAt(0)
  const isVowel = VOWELS.has(char.toUpperCase())
  const alphabetPos = code - 65
  
  const baseAngle = (alphabetPos / 26) * Math.PI * 2
  const positionOffset = (index / Math.max(total, 1)) * 0.4 - 0.2
  const seedOffset = Math.sin(seed + alphabetPos * 137.5) * 0.3
  const angle = baseAngle + positionOffset + seedOffset
  
  const baseRadius = isVowel ? 0.55 : 0.75
  const radiusVariation = 0.85 + Math.abs(Math.sin(seed + code * 0.7)) * 0.3
  const radius = baseRadius * radiusVariation
  
  return { angle, radius, isVowel, alphabetPos }
}

interface Point {
  x: number
  y: number
  char: string
  birthTime: number
  isVowel: boolean
  index: number
  twinkleOffset: number
  twinkleSpeed: number
  normalizedX: number
  normalizedY: number
}

interface Line {
  from: number
  to: number
  birthTime: number
  opacity: number
}

function createGridImage(width: number, height: number, colors: typeof THEMES.mono, visualWidth: number, visualHeight: number): HTMLCanvasElement {
  const gridCanvas = document.createElement("canvas")
  gridCanvas.width = width
  gridCanvas.height = height
  const ctx = gridCanvas.getContext("2d")
  if (!ctx) return gridCanvas

  const dpr = width / visualWidth
  const gridSize = 20 * dpr
  const centerX = width / 2
  const centerY = height / 2

  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 0.5 * dpr
  ctx.beginPath()
  for (let x = centerX % gridSize; x < width; x += gridSize) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let y = centerY % gridSize; y < height; y += gridSize) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()

  ctx.strokeStyle = colors.gridAccent
  ctx.lineWidth = 1 * dpr
  ctx.beginPath()
  ctx.moveTo(centerX, 0)
  ctx.lineTo(centerX, height)
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.stroke()

  const fontSize = Math.round(12 * dpr)
  ctx.font = `${fontSize}px monospace`
  ctx.fillStyle = colors.coords
  
  const w = Math.round(visualWidth)
  const h = Math.round(visualHeight)
  const pad = 8 * dpr
  
  ctx.fillText("0,0", pad, pad + fontSize)
  
  const topRightText = `${w},0`
  const topRightWidth = ctx.measureText(topRightText).width
  ctx.fillText(topRightText, width - pad - topRightWidth, pad + fontSize)
  
  ctx.fillText(`0,${h}`, pad, height - pad)
  
  const bottomRightText = `${w},${h}`
  const bottomRightWidth = ctx.measureText(bottomRightText).width
  ctx.fillText(bottomRightText, width - pad - bottomRightWidth, height - pad)

  return gridCanvas
}

// Haptic feedback for mobile
function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10)
  }
}

// Helper to interpolate between two color tuples
function lerpColor(from: readonly [number, number, number], to: readonly [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ]
}

function lerpRgba(from: string, to: string, t: number): string {
  const parseRgba = (str: string) => {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
    if (match) return { r: +match[1], g: +match[2], b: +match[3], a: match[4] ? +match[4] : 1 }
    return { r: 0, g: 0, b: 0, a: 1 }
  }
  const f = parseRgba(from)
  const toC = parseRgba(to)
  return `rgba(${Math.round(f.r + (toC.r - f.r) * t)}, ${Math.round(f.g + (toC.g - f.g) * t)}, ${Math.round(f.b + (toC.b - f.b) * t)}, ${(f.a + (toC.a - f.a) * t).toFixed(2)})`
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  function SignatureCanvas({ name, onKeyPress, theme = "mono", frameStyle = "none" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pointsRef = useRef<Point[]>([])
    const linesRef = useRef<Line[]>([])
    const animationRef = useRef<number>(0)
    const prevNameRef = useRef("")
    const gridCacheRef = useRef<{ canvas: HTMLCanvasElement; width: number; height: number; theme: Theme } | null>(null)
    const lastTypingTimeRef = useRef<number>(0)
    const revealTriggeredRef = useRef<boolean>(false)
    const revealStartTimeRef = useRef<number>(0)
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 })
    const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null)
    const mousePos = useRef<{ x: number; y: number } | null>(null)
    const [stamp, setStamp] = useState<{ date: string; name: string } | null>(null)
    
    // Theme transition state
    const prevThemeRef = useRef<Theme>(theme)
    const themeTransitionStartRef = useRef<number>(0)
    const [transitionProgress, setTransitionProgress] = useState(1)
    
    // Detect theme change and start transition
    useEffect(() => {
      if (prevThemeRef.current !== theme) {
        themeTransitionStartRef.current = performance.now()
        setTransitionProgress(0)
        prevThemeRef.current = theme
      }
    }, [theme])

    // Get interpolated colors based on transition
    const getInterpolatedColors = useCallback((progress: number) => {
      if (progress >= 1) return THEMES[theme]
      
      const prevTheme = prevThemeRef.current
      const from = THEMES[prevTheme]
      const to = THEMES[theme]
      const t = progress
      
      return {
        grid: lerpRgba(from.grid, to.grid, t),
        gridAccent: lerpRgba(from.gridAccent, to.gridAccent, t),
        line: lerpColor(from.line, to.line, t),
        dot: lerpColor(from.dot, to.dot, t),
        dotGlow: lerpColor(from.dotGlow, to.dotGlow, t),
        coords: lerpRgba(from.coords, to.coords, t),
        svgLine: to.svgLine,
        svgDot: to.svgDot,
        label: lerpRgba(from.label, to.label, t),
      }
    }, [theme])

    const colors = THEMES[theme]

    // Find point under cursor
    const findPointAtPosition = useCallback((clientX: number, clientY: number): Point | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      
      const hitRadius = 15
      for (const point of pointsRef.current) {
        const dx = point.x - x
        const dy = point.y - y
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          return point
        }
      }
      return null
    }, [])

    // Mouse handlers
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      const point = findPointAtPosition(e.clientX, e.clientY)
      setHoveredPoint(point)
    }, [findPointAtPosition])

    const handleMouseLeave = useCallback(() => {
      mousePos.current = null
      setHoveredPoint(null)
    }, [])

    // Touch handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = e.touches[0]
      const point = findPointAtPosition(touch.clientX, touch.clientY)
      if (point) {
        triggerHaptic()
        setHoveredPoint(point)
      }
    }, [findPointAtPosition])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = e.touches[0]
      const point = findPointAtPosition(touch.clientX, touch.clientY)
      if (point !== hoveredPoint) {
        if (point) triggerHaptic()
        setHoveredPoint(point)
      }
    }, [findPointAtPosition, hoveredPoint])

    const handleTouchEnd = useCallback(() => {
      setHoveredPoint(null)
    }, [])

    // Export functions
    useImperativeHandle(ref, () => ({
      exportSVG: () => {
        const { width, height } = dimensions
        const points = pointsRef.current
        const lines = linesRef.current

        // If no frame, calculate tight bounding box around constellation
        if (frameStyle === "none" && points.length > 0) {
          const padding = 30
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

          for (const p of points) {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
          }

          const svgWidth = maxX - minX + padding * 2
          const svgHeight = maxY - minY + padding * 2
          const offsetX = minX - padding
          const offsetY = minY - padding

          let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`

          for (const line of lines) {
            const from = points[line.from]
            const to = points[line.to]
            if (!from || !to) continue
            svgContent += `<line x1="${from.x - offsetX}" y1="${from.y - offsetY}" x2="${to.x - offsetX}" y2="${to.y - offsetY}" stroke="${colors.svgLine}" stroke-width="1" stroke-linecap="round" opacity="${line.opacity}"/>`
          }

          for (const p of points) {
            const radius = p.isVowel ? 2.5 : 2
            svgContent += `<circle cx="${p.x - offsetX}" cy="${p.y - offsetY}" r="${radius}" fill="${colors.svgDot}"/>`
          }

          svgContent += `</svg>`
          return svgContent
        }

        // With frame, use full 16:9 canvas
        const padding = 20
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`

        if (frameStyle === "thin") {
          svgContent += `<rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="none" stroke="${colors.svgLine}" stroke-width="1" opacity="0.5"/>`
        } else if (frameStyle === "double") {
          svgContent += `<rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="none" stroke="${colors.svgLine}" stroke-width="1" opacity="0.5"/>`
          svgContent += `<rect x="${padding + 4}" y="${padding + 4}" width="${width - padding * 2 - 8}" height="${height - padding * 2 - 8}" fill="none" stroke="${colors.svgLine}" stroke-width="1" opacity="0.3"/>`
        } else if (frameStyle === "corners") {
          const cornerLen = 30
          const corners = [
            `M ${padding} ${padding + cornerLen} L ${padding} ${padding} L ${padding + cornerLen} ${padding}`,
            `M ${width - padding - cornerLen} ${padding} L ${width - padding} ${padding} L ${width - padding} ${padding + cornerLen}`,
            `M ${width - padding} ${height - padding - cornerLen} L ${width - padding} ${height - padding} L ${width - padding - cornerLen} ${height - padding}`,
            `M ${padding + cornerLen} ${height - padding} L ${padding} ${height - padding} L ${padding} ${height - padding - cornerLen}`,
          ]
          corners.forEach(d => {
            svgContent += `<path d="${d}" fill="none" stroke="${colors.svgLine}" stroke-width="1" opacity="0.5"/>`
          })
        }

        for (const line of lines) {
          const from = points[line.from]
          const to = points[line.to]
          if (!from || !to) continue
          svgContent += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${colors.svgLine}" stroke-width="1" stroke-linecap="round" opacity="${line.opacity}"/>`
        }

        for (const p of points) {
          const radius = p.isVowel ? 2.5 : 2
          svgContent += `<circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${colors.svgDot}"/>`
        }

        svgContent += `</svg>`
        return svgContent
      },
      
      exportPNG: async (_transparent: boolean, highRes = false) => {
        const canvas = canvasRef.current
        if (!canvas) return ""
        
        // High res export at 3x resolution
        const scale = highRes ? 3 : 1
        const { width, height } = dimensions
        
        const tempCanvas = document.createElement("canvas")
        const ctx = tempCanvas.getContext("2d", { alpha: false })
        if (!ctx) return ""
        
        tempCanvas.width = width * scale
        tempCanvas.height = height * scale
        
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        ctx.scale(scale, scale)
        
        // Draw grid
        const gridCanvas = createGridImage(width, height, colors, width, height)
        ctx.drawImage(gridCanvas, 0, 0, width, height)
        
        const points = pointsRef.current
        const lines = linesRef.current
        const [lr, lg, lb] = colors.line
        const [dr, dg, db] = colors.dot
        const [gr, gg, gb] = colors.dotGlow
        
        // Draw lines
        ctx.lineCap = "round"
        ctx.lineWidth = 1
        for (const line of lines) {
          const from = points[line.from]
          const to = points[line.to]
          if (!from || !to) continue
          ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${line.opacity})`
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
        }
        
        // Draw dots with glow
        for (const p of points) {
          const radius = p.isVowel ? 2.5 : 2
          ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, 0.3)`
          ctx.beginPath()
          ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, 1)`
          ctx.beginPath()
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        
        return tempCanvas.toDataURL("image/jpeg", 0.95)
      },
      
      copyToClipboard: async (highRes = false) => {
        const canvas = canvasRef.current
        if (!canvas) return false
        
        try {
          // High res copy at 3x
          const scale = highRes ? 3 : 1
          const { width, height } = dimensions
          
          const tempCanvas = document.createElement("canvas")
          const ctx = tempCanvas.getContext("2d", { alpha: false })
          if (!ctx) return false
          
          tempCanvas.width = width * scale
          tempCanvas.height = height * scale
          
          ctx.fillStyle = "#000000"
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
          ctx.scale(scale, scale)
          
          // Draw grid
          const gridCanvas = createGridImage(width, height, colors, width, height)
          ctx.drawImage(gridCanvas, 0, 0, width, height)
          
          const points = pointsRef.current
          const lines = linesRef.current
          const [lr, lg, lb] = colors.line
          const [dr, dg, db] = colors.dot
          const [gr, gg, gb] = colors.dotGlow
          
          ctx.lineCap = "round"
          ctx.lineWidth = 1
          for (const line of lines) {
            const from = points[line.from]
            const to = points[line.to]
            if (!from || !to) continue
            ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${line.opacity})`
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(to.x, to.y)
            ctx.stroke()
          }
          
          for (const p of points) {
            const radius = p.isVowel ? 2.5 : 2
            ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, 0.3)`
            ctx.beginPath()
            ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, 1)`
            ctx.beginPath()
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
          
          const blob = await new Promise<Blob | null>(resolve => {
            tempCanvas.toBlob(resolve, "image/png")
          })
          if (!blob) return false
          
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ])
          return true
        } catch {
          return false
        }
      },
      
      addStamp: () => {
        const now = new Date()
        const date = now.toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        }).toUpperCase()
        setStamp({ date, name: name.toUpperCase() })
      }
    }), [dimensions, colors, frameStyle, name])

    const drawFrame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (frameStyle === "none") return
      
      const padding = 4
      const [r, g, b] = colors.line
      
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`
      ctx.lineWidth = 1
      
      if (frameStyle === "thin") {
        ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2)
      } else if (frameStyle === "double") {
        ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`
        ctx.strokeRect(padding + 4, padding + 4, width - padding * 2 - 8, height - padding * 2 - 8)
      } else if (frameStyle === "corners") {
        const cornerLen = 20
        ctx.beginPath()
        // Top left
        ctx.moveTo(padding, padding + cornerLen)
        ctx.lineTo(padding, padding)
        ctx.lineTo(padding + cornerLen, padding)
        // Top right
        ctx.moveTo(width - padding - cornerLen, padding)
        ctx.lineTo(width - padding, padding)
        ctx.lineTo(width - padding, padding + cornerLen)
        // Bottom right
        ctx.moveTo(width - padding, height - padding - cornerLen)
        ctx.lineTo(width - padding, height - padding)
        ctx.lineTo(width - padding - cornerLen, height - padding)
        // Bottom left
        ctx.moveTo(padding + cornerLen, height - padding)
        ctx.lineTo(padding, height - padding)
        ctx.lineTo(padding, height - padding - cornerLen)
        ctx.stroke()
      }
    }, [colors, frameStyle])

    const generateSignature = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const now = performance.now()

      setDimensions({ width, height })
      lastTypingTimeRef.current = now
      revealTriggeredRef.current = false

      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) * 0.38

      const cleanName = name.toUpperCase().replace(/[^A-Z]/g, "")
      
      // Easter egg: VERCEL creates an equilateral triangle like the Vercel logo
      if (cleanName === "VERCEL") {
        const triangleSize = maxRadius * 1.2
        const triangleHeight = triangleSize * Math.sqrt(3) / 2
        
        // Triangle points (pointing up like Vercel logo)
        const topPoint = { x: centerX, y: centerY - triangleHeight * 0.6 }
        const bottomLeft = { x: centerX - triangleSize / 2, y: centerY + triangleHeight * 0.4 }
        const bottomRight = { x: centerX + triangleSize / 2, y: centerY + triangleHeight * 0.4 }
        
        const points: Point[] = [
          { x: topPoint.x, y: topPoint.y, char: "V", birthTime: now, isVowel: false, index: 0, twinkleOffset: 0, twinkleSpeed: 0.003, normalizedX: topPoint.x / width, normalizedY: topPoint.y / height },
          { x: bottomLeft.x, y: bottomLeft.y, char: "E", birthTime: now + 80, isVowel: true, index: 1, twinkleOffset: 2, twinkleSpeed: 0.003, normalizedX: bottomLeft.x / width, normalizedY: bottomLeft.y / height },
          { x: bottomRight.x, y: bottomRight.y, char: "L", birthTime: now + 160, isVowel: false, index: 2, twinkleOffset: 4, twinkleSpeed: 0.003, normalizedX: bottomRight.x / width, normalizedY: bottomRight.y / height },
        ]
        
        const lines: Line[] = [
          { from: 0, to: 1, birthTime: now + 50, opacity: 1 },
          { from: 1, to: 2, birthTime: now + 130, opacity: 1 },
          { from: 2, to: 0, birthTime: now + 210, opacity: 1 },
        ]
        
        pointsRef.current = points
        linesRef.current = lines
        return
      }

      const chars = cleanName.split("")
      
      if (chars.length === 0) {
        pointsRef.current = []
        linesRef.current = []
        return
      }

      let seed = 0
      for (let i = 0; i < name.length; i++) {
        seed = ((seed << 5) - seed) + name.charCodeAt(i)
        seed = seed & seed
      }

      const points: Point[] = []
      const seenChars = new Map<string, number>()
      
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i]
        if (seenChars.has(char)) continue
        
        const { angle, radius, isVowel } = getLetterPosition(char, i, chars.length, seed)
        
        const x = centerX + Math.cos(angle) * radius * maxRadius
        const y = centerY + Math.sin(angle) * radius * maxRadius
        
        seenChars.set(char, points.length)
        points.push({
          x,
          y,
          char,
          birthTime: now + points.length * 60,
          isVowel,
          index: points.length,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.002 + Math.random() * 0.002,
          normalizedX: x / width,
          normalizedY: y / height,
        })
      }

      const lines: Line[] = []
      const addedLines = new Set<string>()
      
      const addLine = (from: number, to: number, delay: number, opacity: number) => {
        const key = `${Math.min(from, to)}-${Math.max(from, to)}`
        if (addedLines.has(key) || from === to || from < 0 || to < 0) return
        if (from >= points.length || to >= points.length) return
        addedLines.add(key)
        lines.push({ from, to, birthTime: now + delay, opacity })
      }

      let prevIndex = -1
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i]
        const currentIndex = seenChars.get(char)
        if (currentIndex === undefined) continue
        
        if (prevIndex >= 0) {
          addLine(prevIndex, currentIndex, i * 60 + 30, 0.9)
        }
        prevIndex = currentIndex
      }

      if (points.length >= 3) {
        const firstIndex = seenChars.get(chars[0])
        if (firstIndex !== undefined && prevIndex >= 0 && firstIndex !== prevIndex) {
          addLine(prevIndex, firstIndex, chars.length * 60 + 50, 0.5)
        }
      }

      if (points.length >= 4) {
        for (let i = 0; i < points.length; i++) {
          const crossIndex = (i + 2) % points.length
          addLine(i, crossIndex, chars.length * 60 + 80 + i * 30, 0.25)
        }
      }

      pointsRef.current = points
      linesRef.current = lines
    }, [name])

    const draw = useCallback((time: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d", { alpha: false })
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      
      const targetWidth = Math.floor(rect.width * dpr)
      const targetHeight = Math.floor(rect.height * dpr)
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
      }
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Calculate theme transition progress
      const themeTransitionDuration = 400
      const timeSinceThemeChange = time - themeTransitionStartRef.current
      const currentTransitionProgress = Math.min(timeSinceThemeChange / themeTransitionDuration, 1)
      const transitionEase = 1 - Math.pow(1 - currentTransitionProgress, 2)
      
      // Get interpolated colors for smooth transition
      const animColors = getInterpolatedColors(transitionEase)

      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, width, height)

      // Regenerate grid cache when theme changes or during transition
      if (!gridCacheRef.current || 
          gridCacheRef.current.width !== targetWidth || 
          gridCacheRef.current.height !== targetHeight ||
          gridCacheRef.current.theme !== theme ||
          transitionEase < 1) {
        gridCacheRef.current = {
          canvas: createGridImage(targetWidth, targetHeight, animColors, width, height),
          width: targetWidth,
          height: targetHeight,
          theme
        }
      }
      ctx.drawImage(gridCacheRef.current.canvas, 0, 0, width, height)

      drawFrame(ctx, width, height)

      const points = pointsRef.current
      const lines = linesRef.current

      if (points.length === 0) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const timeSinceLastType = time - lastTypingTimeRef.current
      const isRevealing = timeSinceLastType > 800
      
      if (isRevealing && !revealTriggeredRef.current) {
        revealTriggeredRef.current = true
        revealStartTimeRef.current = time
      }

      const revealProgress = revealTriggeredRef.current 
        ? Math.min((time - revealStartTimeRef.current) / 600, 1)
        : 0
      const revealEase = 1 - Math.pow(1 - revealProgress, 3)

      const [lr, lg, lb] = animColors.line
      ctx.lineCap = "round"
      ctx.lineWidth = 1
      
      for (const line of lines) {
        const from = points[line.from]
        const to = points[line.to]
        if (!from || !to) continue

        const age = time - line.birthTime
        if (age < 0) continue

        const progress = Math.min(age / 200, 1)
        const ease = 1 - Math.pow(1 - progress, 3)

        const currentX = from.x + (to.x - from.x) * ease
        const currentY = from.y + (to.y - from.y) * ease

        const revealBoost = revealEase * 0.4
        const finalOpacity = Math.min(line.opacity * ease + revealBoost, 1)
        
        // Highlight lines connected to hovered point
        const isHighlighted = hoveredPoint && (from === hoveredPoint || to === hoveredPoint)
        const highlightBoost = isHighlighted ? 0.5 : 0
        
        ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${Math.min(finalOpacity + highlightBoost, 1)})`
        ctx.lineWidth = 1 + revealEase * 0.5 + (isHighlighted ? 0.5 : 0)
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(currentX, currentY)
        ctx.stroke()
      }

      const [gr, gg, gb] = animColors.dotGlow
      const [dr, dg, db] = animColors.dot
      
      for (const p of points) {
        const age = time - p.birthTime
        if (age < 0) continue

        const appearProgress = Math.min(age / 150, 1)
        const ease = 1 - Math.pow(1 - appearProgress, 3)
        
        const twinkle = 0.6 + Math.sin(time * p.twinkleSpeed + p.twinkleOffset) * 0.4
        
        const revealPulse = revealTriggeredRef.current 
          ? Math.sin(revealProgress * Math.PI) * 0.5
          : 0
        
        const isHovered = hoveredPoint === p
        const hoverBoost = isHovered ? 0.4 : 0
        const brightness = Math.min(ease * twinkle + revealPulse + hoverBoost, 1)

        const baseRadius = p.isVowel ? 2.5 : 2
        const radius = baseRadius * ease * (1 + revealEase * 0.3) * (isHovered ? 1.5 : 1)

        if (brightness > 0.3) {
          ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${0.3 * brightness})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(0.1, radius + 3 + revealEase * 2 + (isHovered ? 4 : 0)), 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${brightness})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.1, radius), 0, Math.PI * 2)
        ctx.fill()
        
        // Draw label for hovered point
        if (isHovered) {
          ctx.font = "bold 11px monospace"
          ctx.fillStyle = animColors.label
          ctx.textAlign = "center"
          ctx.fillText(p.char, p.x, p.y - radius - 8)
        }
      }

      // Draw stamp watermark
      if (stamp) {
        const stampX = width - 24
        const stampY = height - 44
        const [sr, sg, sb] = animColors.dot

        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.font = "8px monospace"
        ctx.fillStyle = `rgb(${sr}, ${sg}, ${sb})`
        ctx.textAlign = "right"
        ctx.fillText(stamp.date, stampX, stampY)
        ctx.fillText(stamp.name, stampX, stampY + 10)
        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(draw)
    }, [colors, theme, drawFrame, hoveredPoint, getInterpolatedColors, stamp])

    useEffect(() => {
      if (name !== prevNameRef.current) {
        if (name.length > prevNameRef.current.length && onKeyPress) {
          onKeyPress()
        }
        generateSignature()
        prevNameRef.current = name
      }
      
      animationRef.current = requestAnimationFrame(draw)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }, [name, generateSignature, draw, onKeyPress])

    useEffect(() => {
      let resizeTimeout: NodeJS.Timeout
      const handleResize = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          gridCacheRef.current = null
          generateSignature()
        }, 100)
      }
      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
        clearTimeout(resizeTimeout)
      }
    }, [generateSignature])

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: "block", touchAction: "none" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    )
  }
)
