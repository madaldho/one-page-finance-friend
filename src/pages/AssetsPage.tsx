
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { House, Plus } from "lucide-react"
import { Asset } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { AssetCard } from "@/components/assets/AssetCard"

export default function AssetsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAssets()
    }
  }, [user])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat daftar aset",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const totalWealth = assets.reduce((sum, asset) => sum + asset.current_value, 0)

  return (
    <div className="container mx-auto p-4 pb-32 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <House className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Aset</h1>
            <p className="text-sm text-gray-500">Kelola aset kekayaan Anda</p>
          </div>
        </div>
        <Button onClick={() => navigate("/assets/add")} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <p className="text-sm text-gray-500 mb-1">Total Kekayaan</p>
        <p className="text-2xl font-bold">{formatCurrency(totalWealth)}</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Memuat...</div>
        ) : assets.length > 0 ? (
          assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            Belum ada aset. Klik tombol Tambah untuk menambahkan aset baru.
          </div>
        )}
      </div>
    </div>
  )
}
