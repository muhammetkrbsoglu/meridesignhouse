'use client';

import Image from 'next/image';
import { getPresetImageUrl } from '@/lib/imagekit';

interface WhatsAppTemplateProps {
  screenshotUrl: string;
  customerName: string;
  altText: string;
}

export default function WhatsAppTemplate({ 
  screenshotUrl, 
  customerName, 
  altText 
}: WhatsAppTemplateProps) {
  return (
    <div className="whatsapp-template">
      {/* WhatsApp Header */}
      <div className="whatsapp-header">
        <div className="whatsapp-back-arrow">←</div>
        <div className="whatsapp-contact-info">
          <div className="whatsapp-avatar" aria-hidden="true">
            <div className="whatsapp-avatar-initial">
              {(customerName?.charAt(0)?.toUpperCase?.() ?? '?')}
            </div>
          </div>
          <div className="whatsapp-contact-details">
            {customerName && (
              <div className="whatsapp-contact-name">{customerName}</div>
            )}
          </div>
        </div>
        <div className="whatsapp-actions">
          <div className="whatsapp-action-icon">📹</div>
          <div className="whatsapp-action-icon">📞</div>
          <div className="whatsapp-action-icon">⋮</div>
        </div>
      </div>

      {/* WhatsApp Messages Area */}
      <div className="whatsapp-messages">
        <div className="whatsapp-message-container">
          <Image
            src={getPresetImageUrl(screenshotUrl, 'whatsappMessage')}
            alt={altText}
            fill
            className="whatsapp-screenshot"
          />
        </div>
      </div>

      {/* WhatsApp Input Area */}
      <div className="whatsapp-input-area">
        <div className="whatsapp-input-container">
          <div className="whatsapp-input-icon">😊</div>
          <div className="whatsapp-input-field">
            <span className="whatsapp-input-placeholder">Mesaj</span>
          </div>
          <div className="whatsapp-input-icon">📎</div>
          <div className="whatsapp-send-button">🎤</div>
        </div>
      </div>
    </div>
  );
}
