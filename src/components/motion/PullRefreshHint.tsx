'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullRefreshHintProps {
  children: React.ReactNode
  showOnMount?: boolean
  delay?: number
  className?: string
}

export function PullRefreshHint({ 
  children, 
  showOnMount = false, 
  delay = 0,
  className 
}: PullRefreshHintProps) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (showOnMount) {
      const timer = setTimeout(() => {
        setShowHint(true)
        // Auto hide after 3 seconds
        setTimeout(() => setShowHint(false), 3000)
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [showOnMount, delay])

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
            Yenilemek için aşağı çekin
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}