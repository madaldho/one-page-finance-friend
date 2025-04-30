import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

const AddBudgetSource = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nama Diperlukan",
        description: "Masukkan nama sumber dana",
        variant: "destructive",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah dana yang valid",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("budget_sources").insert({
        name: name.trim(),
        amount: Number(amount),
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Sumber Dana Ditambahkan",
        description: "Sumber dana baru berhasil ditambahkan",
      });

      navigate("/budgets");
    } catch (error: any) {
      console.error("Error adding budget source:", error);
      toast({
        title: "Gagal Menambahkan",
        description: error.message || "Terjadi kesalahan saat menambahkan sumber dana",
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
          <h1 className="text-xl font-bold">Tambah Sumber Dana</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Sumber Dana</Label>
            <Input
              id="name"
              placeholder="contoh: Gaji Bulanan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <CurrencyInput
              id="amount"
              placeholder="2000000"
              value={Number(amount)}
              onChange={(value) => setAmount(value.toString())}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/budgets")}
              disabled={loading}
              className="w-full"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddBudgetSource;
