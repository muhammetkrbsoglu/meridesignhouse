'use client'

import { motion } from 'framer-motion'
import { Award, Sparkles, Heart, Star, Shield, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

interface ElYapimiBadgeProps {
  variant?: 'default' | 'premium' | 'compact' | 'floating'
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
  onClick?: () => void
}

const badgeVariants = {
  default: {
    icon: Award,
    text: 'El Yapımı',
    description: 'Geleneksel el sanatları ile üretilmiştir',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textColor: 'text-white',
    shadow: 'shadow-lg shadow-amber-500/25'
  },
  premium: {
    icon: Sparkles,
    text: 'Premium El Yapımı',
    description: 'Özel tekniklerle, sınırlı sayıda üretilmiştir',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
    textColor: 'text-white',
    shadow: 'shadow-xl shadow-rose-500/30'
  },
  compact: {
    icon: Heart,
    text: 'El Yapımı',
    description: 'El sanatları ile üretilmiştir',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
    textColor: 'text-white',
    shadow: 'shadow-md shadow-green-500/20'
  },
  floating: {
    icon: Star,
    text: 'El Yapımı',
    description: 'Ustalarımızın eliyle özenle üretilmiştir',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    textColor: 'text-white',
    shadow: 'shadow-2xl shadow-purple-500/40'
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
    spacing: 'gap-1.5'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    spacing: 'gap-2'
  }
}

export function ElYapimiBadge({
  variant = 'default',
  size = 'md',
  showTooltip = true,
  className,
  onClick
}: ElYapimiBadgeProps) {
  const { light, medium } = useHapticFeedback()
  const badgeConfig = badgeVariants[variant]
  const sizeConfig = sizeVariants[size]
  const IconComponent = badgeConfig.icon

  const handleClick = () => {
    if (onClick) {
      medium('El yapımı badge tıklandı')
      onClick()
    }
  }

  const badgeContent = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center rounded-full font-semibold transition-all duration-300',
        badgeConfig.bgColor,
        badgeConfig.textColor,
        badgeConfig.shadow,
        sizeConfig.container,
        sizeConfig.spacing,
        onClick && 'cursor-pointer hover:shadow-xl',
        className
      )}
      onClick={handleClick}
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <IconComponent className={sizeConfig.icon} />
      </motion.div>
      <span>{badgeConfig.text}</span>
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
      />
    </motion.div>
  )

  if (showTooltip && !onClick) {
    return (
      <HoverCard
        content={
          <div className="p-3 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className="w-4 h-4 text-rose-500" />
              <span className="font-semibold text-gray-900">{badgeConfig.text}</span>
            </div>
            <p className="text-sm text-gray-600">{badgeConfig.description}</p>
          </div>
        }
        side="top"
        align="center"
      >
        {badgeContent}
      </HoverCard>
    )
  }

  return badgeContent
}

// Specialized badge components for different use cases
export function PremiumElYapimiBadge({ className, ...props }: Omit<ElYapimiBadgeProps, 'variant'>) {
  return <ElYapimiBadge variant="premium" className={className} {...props} />
}

export function CompactElYapimiBadge({ className, ...props }: Omit<ElYapimiBadgeProps, 'variant'>) {
  return <ElYapimiBadge variant="compact" className={className} {...props} />
}

export function FloatingElYapimiBadge({ className, ...props }: Omit<ElYapimiBadgeProps, 'variant'>) {
  return <ElYapimiBadge variant="floating" className={className} {...props} />
}

// Badge with additional features
export function ElYapimiBadgeWithFeatures({ 
  features = [],
  className,
  ...props 
}: ElYapimiBadgeProps & { features?: string[] }) {
  const { light } = useHapticFeedback()

  return (
    <div className={cn('relative group', className)}>
      <ElYapimiBadge {...props} />
      
      {features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg border-2 border-rose-200 p-1"
        >
          <div className="flex items-center gap-1">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-xs text-rose-600 font-medium"
              >
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

