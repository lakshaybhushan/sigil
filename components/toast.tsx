"use client"

import { motion, AnimatePresence } from "framer-motion"

interface ToastProps {
  message: string
  isVisible: boolean
}

export function Toast({ message, isVisible }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-20 left-1/2 z-50 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs uppercase tracking-wider"
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 10, x: "-50%" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
