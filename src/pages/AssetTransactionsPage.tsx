import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CircleDollarSign, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AssetTransactionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch asset transactions with join to get asset name
      const { data, error } = await supabase
        .from("asset_transactions")
        .select(`
          *,
          transactions:transaction_id (title, date, category)
        `)
        .eq("user_id", user?.id)
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching asset transactions:", error);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat riwayat transaksi aset",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (transaction.transactions?.title && transaction.transactions.title.toLowerCase().includes(searchLower)) ||
      (transaction.type && transaction.type.toLowerCase().includes(searchLower)) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
      </div>

      <div className="container mx-auto py-2 px-2 md:px-6 max-w-4xl lg:max-w-5xl relative z-10 pt-6 md:pt-4 pb-32">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/assets")}
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md border border-white/30"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">Riwayat Transaksi Aset</h1>
              <p className="text-xs text-gray-500">Penjualan dan pembelian aset</p>
            </div>
          </div>
        </div>
        
        {/* Search dengan design modern */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              placeholder="Cari transaksi..."
              className="pl-12 h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-12 backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20">
            <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-base font-medium">Memuat data transaksi...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${transaction.type === "sale" ? "bg-green-100" : "bg-blue-100"}`}>
                          <CircleDollarSign className={`h-5 w-5 ${transaction.type === "sale" ? "text-green-600" : "text-blue-600"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {transaction.transactions?.title || 
                             (transaction.type === "sale" ? "Penjualan Aset" : "Pembelian Aset")}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={transaction.type === "sale" ? "default" : "outline"}
                      className={`${
                        transaction.type === "sale" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-none" 
                        : "border-blue-200 text-blue-600 bg-blue-50"
                      } px-3 py-1 font-medium`}
                    >
                      {transaction.type === "sale" ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Penjualan
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          Pembelian
                        </div>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Jumlah Transaksi</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</span>
                    </div>
                    
                    {transaction.admin_fee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-medium">Biaya Admin</span>
                        <span className="text-red-600 font-semibold">-{formatCurrency(transaction.admin_fee)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-800">Total</span>
                      <span className={`font-bold text-lg ${transaction.type === "sale" ? "text-green-600" : "text-blue-600"}`}>
                        {formatCurrency(transaction.net_amount)}
                      </span>
                    </div>
                  </div>
                  
                  {transaction.notes && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-purple-700 font-medium">{transaction.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CircleDollarSign className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Belum ada transaksi</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Transaksi penjualan dan pembelian aset akan muncul di sini. Mulai kelola aset Anda untuk melihat riwayat transaksi.
            </p>
            <Button 
              onClick={() => navigate("/assets")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CircleDollarSign className="h-5 w-5 mr-2" />
              Lihat Aset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 