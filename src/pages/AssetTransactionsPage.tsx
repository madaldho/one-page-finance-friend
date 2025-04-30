import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CircleDollarSign, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AssetTransaction } from "@/types";
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
    <div className="container mx-auto p-4 pb-32 max-w-md">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/assets")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Riwayat Transaksi Aset</h1>
          <p className="text-sm text-gray-500">Penjualan dan pembelian aset</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          placeholder="Cari transaksi..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="text-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat data transaksi...</p>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.transactions?.title || 
                       (transaction.type === "sale" ? "Penjualan Aset" : "Pembelian Aset")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                  <Badge 
                    variant={transaction.type === "sale" ? "default" : "outline"}
                    className={
                      transaction.type === "sale" 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "border-blue-200 text-blue-600"
                    }
                  >
                    {transaction.type === "sale" ? "Penjualan" : "Pembelian"}
                  </Badge>
                </div>
                
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jumlah Transaksi</span>
                    <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                  </div>
                  
                  {transaction.admin_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Biaya Admin</span>
                      <span className="text-red-500">-{formatCurrency(transaction.admin_fee)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-base">
                      {formatCurrency(transaction.net_amount)}
                    </span>
                  </div>
                </div>
                
                {transaction.notes && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {transaction.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <CircleDollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">Belum ada transaksi</h3>
          <p className="text-gray-500 text-sm mb-4">
            Transaksi penjualan dan pembelian aset akan muncul di sini
          </p>
          <Button 
            onClick={() => navigate("/assets")}
            variant="outline"
            size="sm"
          >
            Lihat Aset
          </Button>
        </div>
      )}
    </div>
  );
} 