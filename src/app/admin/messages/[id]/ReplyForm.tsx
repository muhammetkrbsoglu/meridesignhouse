'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WhatsAppTemplateSelector } from '@/components/admin/WhatsAppTemplateSelector';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { replyToMessage } from '@/lib/actions/messages';
import { useRouter } from 'next/navigation';

interface ReplyFormProps {
  messageId: string;
  message?: any;
}

export function ReplyForm({ messageId, message }: ReplyFormProps) {
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      toast.error('Lütfen yanıt mesajını yazın');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await replyToMessage(messageId, reply.trim());
      
      if (result.success) {
        toast.success('Yanıt başarıyla gönderildi');
        setReply('');
        router.refresh();
      } else {
        toast.error(result.message || 'Yanıt gönderilirken hata oluştu');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Beklenmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* WhatsApp Template Selector */}
        {message?.phone && (
          <WhatsAppTemplateSelector
            messageContext={{
              subject: message.subject,
              message: message.message,
              lastOrderNumber: message.order?.orderNumber,
              lastOrderDate: message.order?.createdAt
            }}
            orderContext={{
              orderNumber: message.order?.orderNumber || '',
              customerName: message.name,
              customerPhone: message.phone,
              status: message.order?.status || '',
              totalAmount: message.order?.totalAmount || 0,
              createdAt: message.createdAt
            }}
            context="MESSAGE"
          />
        )}

        <div>
          <Label htmlFor="reply">E-posta Yanıtı</Label>
          <Textarea
            id="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Müşteriye e-posta yanıtınızı yazın..."
            rows={6}
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>


        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !reply.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Yanıt Gönder
              </>
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}