/**
 * Utilitas keamanan untuk aplikasi
 * Menyediakan fungsi-fungsi untuk mencegah serangan XSS dan input validation
 */

/**
 * Sanitasi string untuk mencegah XSS
 * @param input String yang akan disanitasi
 * @returns String yang telah disanitasi
 */
export const sanitizeString = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Gunakan DOM API untuk sanitasi string dari potensi HTML berbahaya
  const element = document.createElement('div');
  element.textContent = input;
  return element.innerHTML;
};

/**
 * Sanitasi dan escape HTML dalam string
 * @param html String yang berisi HTML
 * @returns String HTML yang aman
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (html === null || html === undefined) {
    return '';
  }
  
  // Escape karakter berbahaya untuk XSS
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;');
};

/**
 * Validasi apakah sebuah string adalah UUID yang valid
 * @param uuid String UUID yang akan divalidasi
 * @returns true jika UUID valid
 */
export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validasi apakah sebuah string adalah email yang valid
 * @param email String email yang akan divalidasi
 * @returns true jika email valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitasi dan validasi objek untuk mencegah injeksi
 * @param data Objek yang akan disanitasi
 * @returns Objek yang telah disanitasi
 */
export const sanitizeObject = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  });
  
  return sanitized;
};

/**
 * Enkripsi data sensitif sebelum disimpan secara lokal
 * @param data Data yang akan dienkripsi
 * @param secretKey Kunci enkripsi (opsional)
 * @returns Data terenkripsi dalam format string
 */
export const encryptLocalData = (data: any, secretKey?: string): string => {
  try {
    // Gunakan kunci dari environment atau kunci default
    const key = secretKey || import.meta.env.VITE_ENCRYPTION_KEY || 'default-secure-key-change-in-production';
    
    // Implementasi sederhana - untuk produksi sebaiknya gunakan library crypto yang lebih kuat
    const jsonString = JSON.stringify(data);
    const encodedData = btoa(jsonString); // Base64 encode
    
    // XOR dengan key untuk enkripsi sederhana
    const encrypted = Array.from(encodedData)
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
    
    return btoa(encrypted); // Encode hasil lagi
  } catch (error) {
    console.error('Error encrypting data');
    // Fallback jika enkripsi gagal - masih lakukan sanitasi
    return btoa(JSON.stringify(sanitizeObject(data)));
  }
};

/**
 * Dekripsi data yang telah dienkripsi
 * @param encryptedData String data terenkripsi
 * @param secretKey Kunci dekripsi (opsional)
 * @returns Data asli hasil dekripsi
 */
export const decryptLocalData = (encryptedData: string, secretKey?: string): any => {
  try {
    // Gunakan kunci yang sama dengan enkripsi
    const key = secretKey || import.meta.env.VITE_ENCRYPTION_KEY || 'default-secure-key-change-in-production';
    
    // Decode Base64
    const decoded = atob(encryptedData);
    
    // XOR dengan key untuk dekripsi
    const decrypted = Array.from(decoded)
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
    
    // Decode Base64 lagi dan parse JSON
    return JSON.parse(atob(decrypted));
  } catch (error) {
    console.error('Error decrypting data');
    return null;
  }
}; 