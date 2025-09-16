'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '../prisma'
import { getSupabaseAdmin, createServerClient, createAnonClient } from '@/lib/supabase'
import { MessageType, MessageStatus } from '@prisma/client'
import { sendContactFormResponse } from '../whatsapp'
import { formatPhoneForWhatsApp, isValidTurkishPhone } from '../whatsapp-utils'

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z
    .string({ required_error: 'Telefon numarası zorunludur' })
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır')
    .refine((val) => isValidTurkishPhone(val), 'Geçerli bir telefon numarası girin'),
  subject: z.string().min(5, 'Konu en az 5 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
})

export type ContactFormData = z.infer<typeof contactSchema>

// Create a new contact message
export async function createContactMessage(data: ContactFormData) {
  try {
    // Validate the data
    const validatedData = contactSchema.parse(data)

    // Try to get authenticated user first
    let userId = null
    let client = createAnonClient() // Default to anon client
    
    try {
      const serverClient = await createServerClient()
      const { data: auth } = await serverClient.auth.getUser()
      if (auth.user) {
        userId = auth.user.id
        client = serverClient // Use server client if authenticated
      }
    } catch (authError) {
      // If auth fails, continue with anon client
      console.log('No authenticated user, using anon client')
    }

    const { data: inserted, error } = await client
      .from('messages')
      .insert({
        userId: userId,
        orderId: null,
        type: 'CONTACT',
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
        status: 'UNREAD'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert failed:', error)
      revalidatePath('/admin/messages')
      return {
        success: false,
        message: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
      }
    }

    // Revalidate admin messages page
    revalidatePath('/admin/messages')

    return {
      success: true,
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
      data: inserted,
    }
  } catch (error) {
    console.error('Contact message creation error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Form verilerinde hata var.',
        errors: error.issues,
      }
    }

    return {
      success: false,
      message: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
    }
  }
}

// Fetch all messages for admin
export async function fetchMessages(page: number = 1, limit: number = 10) {
  try {
    const offset = (page - 1) * limit

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      }),
      prisma.message.count(),
    ])

    return {
      messages,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    }
  } catch (error) {
    console.error('Fetch messages error:', error)
    throw new Error('Mesajlar yüklenirken hata oluştu')
  }
}

// Update message status
export async function updateMessageStatus(messageId: string, status: MessageStatus) {
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { status },
    })

    revalidatePath('/admin/messages')

    return {
      success: true,
      message: 'Mesaj durumu güncellendi',
      data: message,
    }
  } catch (error) {
    console.error('Update message status error:', error)
    return {
      success: false,
      message: 'Mesaj durumu güncellenirken hata oluştu',
    }
  }
}

// Reply to a message
export async function replyToMessage(messageId: string, reply: string) {
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        adminReply: reply,
        status: MessageStatus.REPLIED,
        updatedAt: new Date(),
      },
    })

    // Send WhatsApp response if phone number is available
    try {
      if (message.phone) {
        const phone = formatPhoneForWhatsApp(message.phone);
        if (isValidTurkishPhone(phone)) {
          await sendContactFormResponse(phone, message.name, reply);
        }
      }
    } catch (whatsappError) {
      console.error('WhatsApp response error:', whatsappError);
      // Don't fail the main operation if WhatsApp fails
    }

    revalidatePath('/admin/messages')

    return {
      success: true,
      message: 'Yanıt başarıyla gönderildi',
      data: message,
    }
  } catch (error) {
    console.error('Reply to message error:', error)
    return {
      success: false,
      message: 'Yanıt gönderilirken hata oluştu',
    }
  }
}

// Delete a message
export async function deleteMessage(messageId: string) {
  try {
    await prisma.message.delete({
      where: { id: messageId },
    })

    revalidatePath('/admin/messages')

    return {
      success: true,
      message: 'Mesaj başarıyla silindi',
    }
  } catch (error) {
    console.error('Delete message error:', error)
    return {
      success: false,
      message: 'Mesaj silinirken hata oluştu',
    }
  }
}

// Get message by ID
export async function getMessageById(messageId: string) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    })

    return message
  } catch (error) {
    console.error('Get message by ID error:', error)
    throw new Error('Mesaj yüklenirken hata oluştu')
  }
}

// Get unread messages count
export async function getUnreadMessagesCount() {
  try {
    const count = await prisma.message.count({
      where: {
        status: MessageStatus.UNREAD,
      },
    })

    return count
  } catch (error) {
    console.error('Get unread messages count error:', error)
    return 0
  }
}

// Backfill userId for existing messages by email
export async function backfillMessageUserIds() {
  try {
    const serverClient = await createServerClient()
    const { data: auth } = await serverClient.auth.getUser()
    
    if (!auth.user) {
      return {
        success: false,
        message: 'Kullanıcı giriş yapmamış',
      }
    }

    const { data: messages, error } = await serverClient
      .from('messages')
      .select('id, email')
      .is('userId', null)
      .eq('email', auth.user.email)

    if (error) {
      console.error('Backfill query error:', error)
      return {
        success: false,
        message: 'Mesajlar sorgulanırken hata oluştu',
      }
    }

    if (messages.length === 0) {
      return {
        success: true,
        message: 'Eşleştirilecek mesaj bulunamadı',
        count: 0,
      }
    }

    const { error: updateError } = await serverClient
      .from('messages')
      .update({ userId: auth.user.id })
      .in('id', messages.map(m => m.id))

    if (updateError) {
      console.error('Backfill update error:', updateError)
      return {
        success: false,
        message: 'Mesajlar güncellenirken hata oluştu',
      }
    }

    revalidatePath('/profile')
    revalidatePath('/admin/messages')

    return {
      success: true,
      message: `${messages.length} mesaj eşleştirildi`,
      count: messages.length,
    }
  } catch (error) {
    console.error('Backfill message user IDs error:', error)
    return {
      success: false,
      message: 'Mesajlar eşleştirilirken hata oluştu',
    }
  }
}