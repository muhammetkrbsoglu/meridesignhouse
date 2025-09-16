// WhatsApp utility functions (not server actions)

// Format phone number for WhatsApp (remove + and spaces)
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// Validate Turkish phone number
export function isValidTurkishPhone(phone: string): boolean {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  // Turkish mobile numbers: 90 + 5XX + 7 digits
  if (/^905[0-9]{9}$/.test(cleanPhone)) return true;
  // Accept local starting with 05 and normalize to 90
  return /^05[0-9]{9}$/.test(cleanPhone);
}

export function getWhatsAppHref(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const normalized = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? `9${cleanPhone}` : `90${cleanPhone}`);
  const text = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${text}`;
}
