-- Menambahkan kolom refresh_token ke tabel trusted_devices
ALTER TABLE IF EXISTS "public"."trusted_devices"
ADD COLUMN "refresh_token" text;

-- Meningkatkan keamanan dengan menambahkan enkripsi
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Membuat fungsi untuk menyimpan token secara terenkripsi
CREATE OR REPLACE FUNCTION store_encrypted_refresh_token(device_id UUID, token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE "public"."trusted_devices"
  SET "refresh_token" = encode(encrypt(convert_to(token, 'utf8'), current_setting('app.jwt_secret'), 'aes'), 'hex')
  WHERE id = device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Membuat fungsi untuk mendapatkan token yang sudah didekripsi
CREATE OR REPLACE FUNCTION get_decrypted_refresh_token(device_id UUID)
RETURNS text AS $$
DECLARE
  encrypted_token TEXT;
  decrypted_token TEXT;
BEGIN
  SELECT "refresh_token" INTO encrypted_token
  FROM "public"."trusted_devices"
  WHERE id = device_id;
  
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT convert_from(
    decrypt(decode(encrypted_token, 'hex'), current_setting('app.jwt_secret'), 'aes'),
    'utf8'
  ) INTO decrypted_token;
  
  RETURN decrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 