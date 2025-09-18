/**
 * MeriDesignHouse Mobile Checkout Stepper
 * Step-by-step checkout process optimized for mobile
 */

"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useMicroAnimations } from '@/hooks/useMicroAnimations'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight, Lock, User, MapPin, CreditCard, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface Step {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  current: boolean
  disabled: boolean
}

interface MobileCheckoutStepperProps {
  steps: Step[]
  currentStep: string
  onStepChange: (stepId: string) => void
  onNext: () => void
  onPrevious: () => void
  onComplete: () => void
  canProceed: boolean
  isSubmitting: boolean
  className?: string
}

const stepIcons = {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  User,
  MapPin,
  CreditCard,
  Package
}

export function MobileCheckoutStepper({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onComplete,
  canProceed,
  isSubmitting,
  className
}: MobileCheckoutStepperProps) {
  const { createButtonAnimation } = useMicroAnimations()
  const [isVisible, setIsVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleStepClick = (step: Step) => {
    if (step.disabled) return
    onStepChange(step.id)
  }

  const handleNext = () => {
    if (currentStepIndex === steps.length - 1) {
      onComplete()
    } else {
      onNext()
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      onPrevious()
    }
  }

  // Don't show on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null
  }

  return (
    <div className={cn('md:hidden', className)}>
      {/* Progress Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Adım {currentStepIndex + 1} / {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            %{Math.round(progress)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const IconComponent = stepIcons[step.icon as keyof typeof stepIcons] || step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.completed
            const isDisabled = step.disabled

            return (
              <motion.button
                key={step.id}
                onClick={() => handleStepClick(step)}
                disabled={isDisabled}
                className={cn(
                  'flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
                  isActive && 'bg-rose-50 text-rose-700',
                  isCompleted && !isActive && 'text-green-600',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  !isActive && !isCompleted && !isDisabled && 'text-gray-500 hover:text-gray-700'
                )}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isActive && 'bg-rose-100',
                  isCompleted && 'bg-green-100',
                  !isActive && !isCompleted && 'bg-gray-100'
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-medium text-center">
                  {step.title}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.3, ease: 'easeInOut' }}
          className="flex-1"
        >
          {steps.find(step => step.id === currentStep) && (
            <Card className="m-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {(() => {
                    const step = steps.find(s => s.id === currentStep)
                    const IconComponent = step ? stepIcons[step.icon as keyof typeof stepIcons] || step.icon : null
                    return IconComponent ? <IconComponent className="w-5 h-5" /> : null
                  })()}
                  <span>{steps.find(step => step.id === currentStep)?.title}</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {steps.find(step => step.id === currentStep)?.description}
                </p>
              </CardHeader>
              <CardContent>
                {/* Step content will be rendered here by parent component */}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-gray-200 px-4 py-3 safe-pb">
        <div className="flex items-center justify-between space-x-3">
          <motion.div
            {...createButtonAnimation({
              haptic: true,
              hapticType: 'light',
              hapticMessage: 'Önceki adım'
            })}
          >
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Önceki</span>
            </Button>
          </motion.div>

          <motion.div
            {...createButtonAnimation({
              haptic: true,
              hapticType: 'medium',
              hapticMessage: currentStepIndex === steps.length - 1 ? 'Siparişi tamamla' : 'Sonraki adım'
            })}
          >
            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="flex items-center space-x-2 flex-1"
            >
              <span>
                {isSubmitting 
                  ? 'İşleniyor...' 
                  : currentStepIndex === steps.length - 1 
                    ? 'Siparişi Tamamla' 
                    : 'Sonraki'
                }
              </span>
              {!isSubmitting && (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing checkout steps
export function useCheckoutSteps(initialStep: string = 'shipping') {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const steps: Step[] = [
    {
      id: 'shipping',
      title: 'Teslimat',
      description: 'Teslimat adresinizi girin',
      icon: MapPin,
      completed: completedSteps.has('shipping'),
      current: currentStep === 'shipping',
      disabled: false
    },
    {
      id: 'billing',
      title: 'Fatura',
      description: 'Fatura adresinizi girin',
      icon: User,
      completed: completedSteps.has('billing'),
      current: currentStep === 'billing',
      disabled: !completedSteps.has('shipping')
    },
    {
      id: 'payment',
      title: 'Ödeme',
      description: 'Ödeme yönteminizi seçin',
      icon: CreditCard,
      completed: completedSteps.has('payment'),
      current: currentStep === 'payment',
      disabled: !completedSteps.has('billing')
    },
    {
      id: 'review',
      title: 'Özet',
      description: 'Siparişinizi gözden geçirin',
      icon: Package,
      completed: completedSteps.has('review'),
      current: currentStep === 'review',
      disabled: !completedSteps.has('payment')
    }
  ]

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))
  }

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId)
  }

  const goToNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex < steps.length - 1) {
      markStepCompleted(currentStep)
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  return {
    steps,
    currentStep,
    completedSteps,
    markStepCompleted,
    goToStep,
    goToNextStep,
    goToPreviousStep
  }
}

