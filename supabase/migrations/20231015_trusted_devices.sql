-- Membuat tabel untuk menyimpan informasi perangkat terpercaya (trusted devices)
CREATE TABLE IF NOT EXISTS "public"."trusted_devices" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL,
  "fingerprint" text NOT NULL,
  "device_name" text NOT NULL,
  "last_used" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- Membuat indeks untuk mempercepat pencarian berdasarkan fingerprint
CREATE INDEX IF NOT EXISTS "trusted_devices_fingerprint_idx" ON "public"."trusted_devices" ("fingerprint");

-- Membuat indeks untuk mempercepat pencarian perangkat berdasarkan user_id
CREATE INDEX IF NOT EXISTS "trusted_devices_user_id_idx" ON "public"."trusted_devices" ("user_id");

-- Mengatur kebijakan keamanan Row Level Security (RLS)
ALTER TABLE "public"."trusted_devices" ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk INSERT: Pengguna hanya dapat menambahkan perangkat untuk dirinya sendiri
CREATE POLICY "users_can_insert_their_own_devices" 
  ON "public"."trusted_devices" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Kebijakan untuk SELECT: Pengguna hanya dapat melihat perangkat miliknya
CREATE POLICY "users_can_select_their_own_devices" 
  ON "public"."trusted_devices" 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Kebijakan untuk UPDATE: Pengguna hanya dapat memperbarui perangkat miliknya
CREATE POLICY "users_can_update_their_own_devices" 
  ON "public"."trusted_devices" 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Kebijakan untuk DELETE: Pengguna hanya dapat menghapus perangkat miliknya
CREATE POLICY "users_can_delete_their_own_devices" 
  ON "public"."trusted_devices" 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Fungsi untuk membersihkan perangkat kadaluwarsa secara berkala
CREATE OR REPLACE FUNCTION clean_expired_trusted_devices()
RETURNS void AS $$
BEGIN
  DELETE FROM "public"."trusted_devices"
  WHERE "expires_at" < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Jadwalkan pembersihan berkala (setiap hari)
SELECT cron.schedule(
  'clean-expired-trusted-devices',
  '0 0 * * *',
  $$SELECT clean_expired_trusted_devices()$$
); 