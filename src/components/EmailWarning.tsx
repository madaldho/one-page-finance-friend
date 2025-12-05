import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function EmailWarning() {
  const { user } = useAuth();

  return (
    <div className="backdrop-blur-sm bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-800 text-sm font-semibold mb-1">
            ⚠️ PENTING: Gunakan Email yang Sama!
          </p>
          <p className="text-yellow-700 text-xs mb-2">
            Pastikan email saat checkout sama dengan email akun Anda agar upgrade otomatis berhasil.
          </p>
          {user?.email && (
            <p className="text-yellow-900 text-xs font-mono bg-yellow-100 px-2 py-1 rounded">
              Email Anda: {user.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
