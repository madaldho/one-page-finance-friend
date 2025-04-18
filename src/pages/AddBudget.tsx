
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface BudgetSource {
  id: string;
  name: string;
  amount: number;
}

const AddBudget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category.trim()) {
      toast({
        title: "Kategori Diperlukan",
        description: "Masukkan nama kategori anggaran",
        variant: "destructive",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah anggaran yang valid",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("budgets").insert({
        category: category.trim(),
        amount: Number(amount),
        period: period,
        spent: 0,
        active: true,
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Anggaran Ditambahkan",
        description: "Anggaran baru berhasil ditambahkan",
      });

      navigate("/budgets");
    } catch (error: any) {
      console.error("Error adding budget:", error);
      toast({
        title: "Gagal Menambahkan",
        description: error.message || "Terjadi kesalahan saat menambahkan anggaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/budgets" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Tambah Anggaran</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              placeholder="contoh: Makan/Jajan"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Periode</Label>
            <RadioGroup value={period} onValueChange={setPeriod} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">Bulanan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="cursor-pointer">Rentang Waktu</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Anggaran"}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default AddBudget;
