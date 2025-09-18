"use client";

import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  messageId: string;
  message: string;
  phone: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function WhatsAppButton({ 
  messageId, 
  message, 
  phone, 
  size = 'default',
  variant = 'outline',
  className = ''
}: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const template = `Talep ID\u0027si "${messageId.slice(0, 8)}" olan kullanıcıdan:\n\n${message}`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(template)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`bg-green-50 hover:bg-green-100 text-green-700 ${className}`}
      onClick={handleWhatsAppClick}
    >
      WhatsApp\u0027ta Yanıtla
    </Button>
  );
}

