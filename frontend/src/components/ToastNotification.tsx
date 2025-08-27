'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  orderId?: string;
  duration?: number;
  showCopyButton?: boolean;
}

interface ToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, notification.duration || 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, notification.duration, onClose]);

  const handleCopy = async () => {
    if (notification.orderId) {
      try {
        await navigator.clipboard.writeText(notification.orderId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getTitleColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-[99999] max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{ zIndex: 99999 }}
    >
      <div className={`
        ${getBgColor()} border rounded-lg shadow-lg p-4
        backdrop-blur-sm bg-opacity-95
      `}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getIcon()}</span>
            <div>
              <h3 className={`font-semibold ${getTitleColor()}`}>
                {notification.title}
              </h3>
              <p className={`text-sm ${getTextColor()} mt-1`}>
                {notification.message}
              </p>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={() => onClose(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order ID Section */}
        {notification.orderId && (
          <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Sipariş Numarası:</p>
                <p className="text-sm text-gray-900 font-mono">{notification.orderId}</p>
              </div>
              
              {notification.showCopyButton && (
                <button
                  onClick={handleCopy}
                  className={`
                    px-3 py-1 rounded-md text-xs font-medium transition-all duration-200
                    ${isCopied 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }
                  `}
                >
                  {isCopied ? '✅ Kopyalandı!' : '📋 Kopyala'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-linear"
            style={{
              width: isVisible ? '100%' : '0%',
              transition: 'width 5s linear'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Toast Container
export function ToastContainer({ notifications, onClose }: { notifications: ToastNotification[]; onClose: (id: string) => void }) {
  if (typeof window === 'undefined' || !document?.body) return null as any;

  return (typeof window !== 'undefined' && document?.body) ? createPortal(
    <div className="fixed top-0 right-0 z-[99999] p-4 space-y-4">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  ) as any : null as any;
}

// Toast Hook
export const useToast = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addToast = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      console.log('State updated, new count:', updated.length);
      return updated;
    });
  };

  const removeToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message: string, options?: Partial<ToastNotification>) => {
    addToast({ type: 'success', title, message, ...options });
  };

  const showError = (title: string, message: string, options?: Partial<ToastNotification>) => {
    addToast({ type: 'error', title, message, ...options });
  };

  const showWarning = (title: string, message: string, options?: Partial<ToastNotification>) => {
    addToast({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title: string, message: string, options?: Partial<ToastNotification>) => {
    addToast({ type: 'info', title, message, ...options });
  };

  const showOrderSuccess = (orderId: string, totalAmount: string) => {
    console.log('showOrderSuccess called:', orderId, totalAmount);
    const notification = {
      type: 'success' as const,
      title: 'Sipariş Başarıyla Oluşturuldu! 🎉',
      message: `Toplam tutar: ₺${totalAmount}`,
      orderId,
      showCopyButton: true,
      duration: 15000
    };
    console.log('Adding notification:', notification);
    addToast(notification);
    
    // Force re-render after state update
    setTimeout(() => {
      console.log('Current notifications after timeout:', notifications);
    }, 100);
  };

  return {
    notifications,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showOrderSuccess
  };
};
