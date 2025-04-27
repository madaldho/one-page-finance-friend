import { supabase } from '@/integrations/supabase/client';
import { getDeviceFingerprint, clearDeviceFingerprint } from './deviceFingerprint';

interface DeviceInfo {
  id?: string;
  user_id: string;
  fingerprint: string;
  device_name: string;
  last_used: string;
  created_at?: string;
  expires_at: string;
}

/**
 * Mendaftarkan perangkat baru ke database
 */
export const registerDevice = async (userId: string): Promise<boolean> => {
  try {
    const fingerprint = await getDeviceFingerprint();
    
    // Data perangkat
    const deviceInfo: DeviceInfo = {
      user_id: userId,
      fingerprint,
      device_name: getBrowserInfo(),
      last_used: new Date().toISOString(),
      // Perangkat berlaku selama 30 hari
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    // Periksa apakah perangkat sudah ada
    const { data: existingDevice } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('user_id', userId)
      .single();
    
    if (existingDevice) {
      // Update perangkat yang sudah ada
      await supabase
        .from('trusted_devices')
        .update({
          last_used: deviceInfo.last_used,
          expires_at: deviceInfo.expires_at
        })
        .eq('id', existingDevice.id);
    } else {
      // Buat perangkat baru
      await supabase
        .from('trusted_devices')
        .insert(deviceInfo);
    }
    
    return true;
  } catch (error) {
    console.error('Gagal mendaftarkan perangkat:', error);
    return false;
  }
};

/**
 * Verifikasi apakah perangkat sudah terdaftar dan valid
 */
export const verifyDevice = async (): Promise<string | null> => {
  try {
    const fingerprint = await getDeviceFingerprint();
    
    // Cari perangkat di database
    const { data: device, error } = await supabase
      .from('trusted_devices')
      .select('user_id, expires_at')
      .eq('fingerprint', fingerprint)
      .gt('expires_at', new Date().toISOString())
      .order('last_used', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !device) {
      return null;
    }
    
    // Update waktu terakhir digunakan
    await supabase
      .from('trusted_devices')
      .update({ 
        last_used: new Date().toISOString(),
        // Perpanjang kedaluwarsa setiap kali diverifikasi
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      })
      .eq('fingerprint', fingerprint)
      .eq('user_id', device.user_id);
    
    return device.user_id;
  } catch (error) {
    console.error('Gagal verifikasi perangkat:', error);
    return null;
  }
};

/**
 * Hapus semua perangkat terpercaya untuk user tertentu
 */
export const removeAllDevices = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId);
    
    // Hapus fingerprint lokal
    clearDeviceFingerprint();
  } catch (error) {
    console.error('Gagal menghapus perangkat:', error);
  }
};

/**
 * Dapatkan informasi browser dan sistem operasi
 */
const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  let browserName = "Browser tidak dikenal";
  
  // Deteksi browser
  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browserName = "Opera";
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge";
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
    browserName = "Internet Explorer";
  }
  
  // Deteksi OS
  let osName = "OS tidak dikenal";
  if (userAgent.indexOf("Windows") > -1) {
    osName = "Windows";
  } else if (userAgent.indexOf("Mac") > -1) {
    osName = "MacOS";
  } else if (userAgent.indexOf("Linux") > -1) {
    osName = "Linux";
  } else if (userAgent.indexOf("Android") > -1) {
    osName = "Android";
  } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
    osName = "iOS";
  }
  
  return `${browserName} di ${osName}`;
}; 