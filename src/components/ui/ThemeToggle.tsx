'use client'

import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { MicroFeedback } from '@/components/motion/MicroFeedback'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'minimal' | 'floating'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const variants = {
  default: {
    container: 'px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700',
    icon: 'w-4 h-4',
    label: 'text-sm font-medium'
  },
  compact: {
    container: 'px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700',
    icon: 'w-4 h-4',
    label: 'text-xs font-medium'
  },
  minimal: {
    container: 'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800',
    icon: 'w-5 h-5',
    label: 'text-sm font-medium'
  },
  floating: {
    container: 'p-3 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    icon: 'w-5 h-5',
    label: 'text-sm font-medium'
  }
}

const sizeVariants = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    spacing: 'gap-1'
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    spacing: 'gap-2'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    spacing: 'gap-3'
  }
}

export function ThemeToggle({
  variant = 'default',
  size = 'md',
  showLabel = true,
  className
}: ThemeToggleProps) {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme()
  const variantConfig = variants[variant]
  const sizeConfig = sizeVariants[size]

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor
    return actualTheme === 'dark' ? Moon : Sun
  }

  const getThemeLabel = () => {
    if (theme === 'system') return 'Sistem'
    return actualTheme === 'dark' ? 'Koyu' : 'Açık'
  }

  const getNextTheme = (): Theme => {
    if (theme === 'light') return 'dark'
    if (theme === 'dark') return 'system'
    return 'light'
  }

  const handleClick = () => {
    const nextTheme = getNextTheme()
    setTheme(nextTheme)
  }

  const IconComponent = getThemeIcon()

  if (variant === 'minimal') {
    return (
      <MicroFeedback
        onClick={toggleTheme}
        hapticType="light"
        hapticMessage="Tema değiştirildi"
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-200',
          variantConfig.container,
          sizeConfig.container,
          className
        )}
      >
        <motion.div
          key={actualTheme}
          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <IconComponent className={cn(
            'text-gray-600 dark:text-gray-300',
            variantConfig.icon
          )} />
        </motion.div>
      </MicroFeedback>
    )
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed bottom-20 right-4 z-50',
          className
        )}
      >
        <MicroFeedback
          onClick={handleClick}
          hapticType="light"
          hapticMessage="Tema değiştirildi"
          className={cn(
            'inline-flex items-center gap-2 transition-all duration-200 hover:shadow-xl',
            variantConfig.container,
            sizeConfig.container,
            sizeConfig.spacing
          )}
        >
          <motion.div
            key={theme}
            initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <IconComponent className={cn(
              'text-gray-600 dark:text-gray-300',
              variantConfig.icon
            )} />
          </motion.div>
          {showLabel && (
            <span className={cn(
              'text-gray-700 dark:text-gray-200',
              variantConfig.label
            )}>
              {getThemeLabel()}
            </span>
          )}
        </MicroFeedback>
      </motion.div>
    )
  }

  return (
    <MicroFeedback
      onClick={handleClick}
      hapticType="light"
      hapticMessage="Tema değiştirildi"
      className={cn(
        'inline-flex items-center gap-2 transition-all duration-200 hover:shadow-md',
        variantConfig.container,
        sizeConfig.container,
        sizeConfig.spacing,
        'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200',
        className
      )}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <IconComponent className={cn(
          'text-gray-600 dark:text-gray-300',
          variantConfig.icon
        )} />
      </motion.div>
      {showLabel && (
        <span className={cn(
          'text-gray-700 dark:text-gray-200',
          variantConfig.label
        )}>
          {getThemeLabel()}
        </span>
      )}
    </MicroFeedback>
  )
}

// Specialized theme toggle components
export function CompactThemeToggle({ className, ...props }: Omit<ThemeToggleProps, 'variant'>) {
  return <ThemeToggle variant="compact" className={className} {...props} />
}

export function MinimalThemeToggle({ className, ...props }: Omit<ThemeToggleProps, 'variant'>) {
  return <ThemeToggle variant="minimal" className={className} {...props} />
}

export function FloatingThemeToggle({ className, ...props }: Omit<ThemeToggleProps, 'variant'>) {
  return <ThemeToggle variant="floating" className={className} {...props} />
}
