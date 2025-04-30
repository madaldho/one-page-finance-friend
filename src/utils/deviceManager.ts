import { supabase } from '@/integrations/supabase/client';
import { getDeviceFingerprint, clearDeviceFingerprint } from './deviceFingerprint';
// import { TrustedDevice } from '@/types';

// Definisi interface TrustedDevice langsung di file ini
interface TrustedDevice {
  id: string;
  user_id: string;
  fingerprint: string;
  device_name: string;
  last_used: string;
  created_at: string;
  expires_at: string;
}

/**
 * Fungsi untuk mendapatkan informasi browser dan sistem operasi
 */
const getBrowserInfo = (): string => {
  try {
    const userAgent = navigator.userAgent;
    const browserInfo = {};
    
    // Deteksi sistem operasi
    if (userAgent.includes('Windows')) {
      browserInfo['os'] = 'Windows';
    } else if (userAgent.includes('Mac')) {
      browserInfo['os'] = 'macOS';
    } else if (userAgent.includes('Linux')) {
      browserInfo['os'] = 'Linux';
    } else if (userAgent.includes('Android')) {
      browserInfo['os'] = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      browserInfo['os'] = 'iOS';
    } else {
      browserInfo['os'] = 'Unknown OS';
    }
    
    // Deteksi browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserInfo['browser'] = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browserInfo['browser'] = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo['browser'] = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browserInfo['browser'] = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browserInfo['browser'] = 'Opera';
    } else {
      browserInfo['browser'] = 'Unknown Browser';
    }
    
    return `${browserInfo['browser']} on ${browserInfo['os']}`;
  } catch (e) {
    console.error('Error getting browser info:', e);
    return 'Unknown Device';
  }
};

/**
 * Mendaftarkan perangkat baru ke database
 */
export const registerDevice = async (userId: string): Promise<boolean> => {
  try {
    console.log("Attempting to register device for user:", userId);
    
    // Mendapatkan fingerprint perangkat
    const fingerprint = await getDeviceFingerprint();
    if (!fingerprint) {
      console.error("Failed to generate device fingerprint");
      return false;
    }
    
    // Data perangkat dengan expiry 30 hari dari sekarang
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + 30); // 30 hari dari sekarang
    
    const deviceInfo = {
      user_id: userId,
      fingerprint,
      device_name: getBrowserInfo(),
      last_used: now.toISOString(),
      expires_at: expiryDate.toISOString(),
    };
    
    // Periksa apakah perangkat sudah ada
    try {
      const { data: existingDevice, error: checkError } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('fingerprint', fingerprint)
        .eq('user_id', userId)
        .single();
      
      if (checkError) {
        if (checkError.code !== 'PGRST116') { // PGRST116 = tidak ditemukan, itu normal
          console.error('Error checking existing device:', checkError);
        }
      }
      
      if (existingDevice) {
        // Update perangkat yang sudah ada
        const { error: updateError } = await supabase
          .from('trusted_devices')
          .update({
            last_used: deviceInfo.last_used,
            expires_at: deviceInfo.expires_at
          })
          .eq('id', existingDevice.id);
        
        if (updateError) {
          console.error('Error updating existing device:', updateError);
          return false;
        }
        
        console.log('Device updated successfully:', existingDevice.id);
        return true;
      } else {
        // Buat perangkat baru
        const { data: newDevice, error: insertError } = await supabase
          .from('trusted_devices')
          .insert(deviceInfo)
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error registering device:', insertError);
          return false;
        }
        
        console.log('Device registered successfully:', newDevice?.id);
        return true;
      }
    } catch (innerError) {
      console.error('Inner error in registerDevice:', innerError);
      return false;
    }
  } catch (error) {
    console.error('Error in registerDevice:', error);
    return false;
  }
};

/**
 * Verifikasi perangkat saat ini dengan database
 */
export const verifyDevice = async (userId: string): Promise<boolean> => {
  try {
    console.log("Verifying device for user:", userId);
    
    // Mendapatkan fingerprint perangkat saat ini
    const fingerprint = await getDeviceFingerprint();
    if (!fingerprint) {
      console.error("Failed to generate device fingerprint for verification");
      return false;
    }
    
    console.log("Current fingerprint:", fingerprint.substring(0, 8) + "...");
    
    // Cari perangkat di database
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('id, expires_at')
        .eq('fingerprint', fingerprint)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log("Device not found in trusted devices");
        } else {
          console.error('Error verifying device:', error);
        }
        return false;
      }
      
      // Periksa apakah perangkat masih valid (belum kadaluarsa)
      if (data && data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        
        console.log("Device expiry:", expiresAt.toISOString());
        console.log("Current time:", now.toISOString());
        console.log("Days until expiry:", Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        if (expiresAt < now) {
          console.log("Device expired, needs re-authentication");
          return false;
        }
        
        // Update last_used dan perpanjang waktu kedaluwarsa 30 hari dari sekarang
        const newExpiryDate = new Date(now);
        newExpiryDate.setDate(now.getDate() + 30);
        
        await supabase
          .from('trusted_devices')
          .update({ 
            last_used: now.toISOString(),
            expires_at: newExpiryDate.toISOString()
          })
          .eq('id', data.id);
        
        console.log("Device verified successfully and expiry extended");
        return true;
      }
      
      return false;
    } catch (innerError) {
      console.error('Inner error in verifyDevice:', innerError);
      return false;
    }
  } catch (error) {
    console.error('Error in verifyDevice:', error);
    return false;
  }
};

/**
 * Hapus semua perangkat terpercaya untuk user tertentu
 */
export const removeAllDevices = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error removing all devices:', error);
      return;
    }
    
    // Hapus fingerprint lokal
    clearDeviceFingerprint();
    console.log("All devices removed for user:", userId);
  } catch (error) {
    console.error('Error in removeAllDevices:', error);
  }
};

/**
 * Mengambil daftar semua perangkat terpercaya untuk pengguna
 */
export const getUserDevices = async (userId: string): Promise<TrustedDevice[]> => {
  try {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_used', { ascending: false });
    
    if (error) {
      console.error('Error fetching user devices:', error);
      return [];
    }
    
    return data as TrustedDevice[];
  } catch (error) {
    console.error('Error in getUserDevices:', error);
    return [];
  }
};

/**
 * Hapus perangkat berdasarkan ID perangkat
 */
export const removeDevice = async (deviceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);
    
    if (error) {
      console.error('Error removing device:', error);
      return false;
    }
    
    console.log("Device removed successfully:", deviceId);
    return true;
  } catch (error) {
    console.error('Error in removeDevice:', error);
    return false;
  }
};
