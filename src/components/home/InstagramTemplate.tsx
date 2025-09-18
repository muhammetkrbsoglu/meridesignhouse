'use client';

import Image from 'next/image';
import { getPresetImageUrl } from '@/lib/imagekit';

interface InstagramTemplateProps {
  screenshotUrl: string;
  customerName: string;
  altText: string;
}

export default function InstagramTemplate({ 
  screenshotUrl, 
  customerName, 
  altText 
}: InstagramTemplateProps) {
  return (
    <div className="instagram-template">
      {/* Instagram Header */}
      <div className="instagram-header">
        <div className="instagram-back-arrow" aria-hidden="true">←</div>
        <div className="instagram-contact-info">
          <div className="instagram-avatar" aria-hidden="true">
            <div className="instagram-avatar-initial">
              {(customerName?.charAt(0)?.toUpperCase?.() ?? '?')}
            </div>
          </div>
          <div className="instagram-contact-details">
            {customerName && (
              <div className="instagram-contact-name">{customerName}</div>
            )}
          </div>
        </div>
        <div className="instagram-actions" aria-hidden="true">
          <div className="instagram-action-icon">☆</div>
          <div className="instagram-action-icon">⋯</div>
          <div className="instagram-action-icon">✉</div>
        </div>
      </div>

      {/* Instagram Messages Area */}
      <div className="instagram-messages">
        <div className="instagram-message-container">
          <Image
            src={getPresetImageUrl(screenshotUrl, 'whatsappMessage')}
            alt={altText}
            fill
            className="instagram-screenshot"
          />
        </div>
      </div>

      {/* Instagram Input Area */}
      <div className="instagram-input-area" aria-hidden="true">
        <div className="instagram-input-container">
          <div className="instagram-input-icon">😊</div>
          <div className="instagram-input-field">
            <span className="instagram-input-placeholder">Mesaj gönder...</span>
          </div>
          <div className="instagram-input-icon">📎</div>
          <div className="instagram-send-button">➤</div>
        </div>
      </div>
    </div>
  );
}
