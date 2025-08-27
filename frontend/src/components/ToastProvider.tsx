'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useToast, ToastContainer } from './ToastNotification';

interface ToastContextType {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showOrderSuccess: (orderId: string, totalAmount: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const contextValue: ToastContextType = {
    showSuccess: toast.showSuccess,
    showError: toast.showError,
    showWarning: toast.showWarning,
    showInfo: toast.showInfo,
    showOrderSuccess: toast.showOrderSuccess,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {isMounted && (
        <ToastContainer
          notifications={toast.notifications}
          onClose={toast.removeToast}
        />
      )}
    </ToastContext.Provider>
  );
}
