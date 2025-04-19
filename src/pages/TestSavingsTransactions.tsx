import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SavingTransaction } from "@/types";

const TestSavingsTransactions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [result, setResult] = useState<string>("Belum ada data");
  const [loading, setLoading] = useState(false);
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [tableInfo, setTableInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      fetchTableInfo();
    }
  }, [user]);

  const fetchTableInfo = async () => {
    try {
      setLoading(true);
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');

      if (tablesError) throw tablesError;
      setDbTables(tables || []);

      // Jika tabel savings_transactions ada, dapatkan info kolom
      if (tables && tables.includes('savings_transactions')) {
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_columns', { table_name: 'savings_transactions' });

        if (columnsError) throw columnsError;
        setTableInfo(prev => ({ ...prev, savings_transactions: columns }));
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa struktur database';
      console.error("Error fetching database info:", errorMsg);
      toast({
        title: "Gagal memeriksa database",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testTransaction = async () => {
    try {
      setLoading(true);
      setResult("Memulai pengujian transaksi tabungan...");

      // 1. Periksa apakah tabel savings_transactions ada
      setResult(prev => prev + "\n\nMemeriksa tabel savings_transactions...");
      const { data: tableExists, error: tableError } = await supabase
        .from('savings_transactions')
        .select('id')
        .limit(1);

      if (tableError) {
        setResult(prev => prev + `\nKesalahan: ${tableError.message}`);
        throw tableError;
      }

      setResult(prev => prev + "\nTabel savings_transactions ditemukan.");

      // 2. Periksa apakah ada data savings
      setResult(prev => prev + "\n\nMemeriksa data tabungan...");
      const { data: savings, error: savingsError } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user?.id)
        .limit(5);

      if (savingsError) {
        setResult(prev => prev + `\nKesalahan: ${savingsError.message}`);
        throw savingsError;
      }

      if (!savings || savings.length === 0) {
        setResult(prev => prev + "\nTidak ada data tabungan. Silakan buat tabungan terlebih dahulu.");
        return;
      }

      setResult(prev => prev + `\nDitemukan ${savings.length} data tabungan.`);
      
      // 3. Periksa wallets
      setResult(prev => prev + "\n\nMemeriksa data dompet...");
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .limit(5);

      if (walletsError) {
        setResult(prev => prev + `\nKesalahan: ${walletsError.message}`);
        throw walletsError;
      }

      if (!wallets || wallets.length === 0) {
        setResult(prev => prev + "\nTidak ada data dompet. Silakan buat dompet terlebih dahulu.");
        return;
      }

      setResult(prev => prev + `\nDitemukan ${wallets.length} data dompet.`);

      // 4. Uji membuat transaksi tabungan
      const testSaving = savings[0];
      const testWallet = wallets[0];
      
      setResult(prev => prev + "\n\nMencoba membuat transaksi tabungan...");
      
      // Mencoba membuat transaksi
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .insert({
          user_id: user?.id,
          savings_id: testSaving.id,
          wallet_id: testWallet.id,
          amount: 1000,
          type: 'deposit',
          date: new Date().toISOString().split('T')[0],
          notes: 'Transaksi pengujian'
        })
        .select();
      
      if (transactionError) {
        setResult(prev => prev + `\nKesalahan saat membuat transaksi: ${transactionError.message}`);
        throw transactionError;
      }
      
      setResult(prev => prev + "\nBerhasil membuat transaksi pengujian!");
      
      // 5. Hapus transaksi pengujian
      if (transaction && transaction.length > 0) {
        const { error: deleteError } = await supabase
          .from('savings_transactions')
          .delete()
          .eq('id', transaction[0].id);
        
        if (deleteError) {
          setResult(prev => prev + `\nKesalahan saat menghapus transaksi pengujian: ${deleteError.message}`);
        } else {
          setResult(prev => prev + "\nBerhasil menghapus transaksi pengujian.");
        }
      }
      
      setResult(prev => prev + "\n\nPengujian selesai! Silakan refresh halaman dan mencoba setor/tarik pada halaman tabungan.");
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menguji transaksi';
      console.error("Error testing transaction:", errorMsg);
      setResult(prev => prev + `\n\nTerjadi kesalahan: ${errorMsg}`);
      
      toast({
        title: "Gagal melakukan pengujian",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <div className="flex items-center mb-6">
          <Link to="/savings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Pengujian Transaksi Tabungan</h1>
        </div>

        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-2">Informasi Database</h2>
          
          {loading ? (
            <p>Memuat informasi database...</p>
          ) : (
            <>
              <h3 className="font-medium mt-3">Tabel yang tersedia:</h3>
              <div className="bg-gray-50 p-2 rounded-md mt-1 text-sm">
                {dbTables.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {dbTables.map((table, index) => (
                      <li key={index}>{table}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Tidak ada tabel yang ditemukan.</p>
                )}
              </div>
              
              {tableInfo.savings_transactions && (
                <>
                  <h3 className="font-medium mt-3">Struktur tabel savings_transactions:</h3>
                  <div className="bg-gray-50 p-2 rounded-md mt-1 text-sm">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left">Kolom</th>
                          <th className="text-left">Tipe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableInfo.savings_transactions.map((column: any, index: number) => (
                          <tr key={index}>
                            <td>{column.column_name}</td>
                            <td>{column.data_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="mt-4">
            <Button 
              onClick={fetchTableInfo}
              variant="outline"
              disabled={loading}
            >
              Refresh Info Database
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-2">Pengujian Transaksi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tombol ini akan menguji proses transaksi tabungan dengan membuat transaksi dummy, kemudian menghapusnya.
            Gunakan untuk memverifikasi bahwa semua sistem terkait transaksi tabungan berfungsi dengan benar.
          </p>
          
          <Button 
            onClick={testTransaction}
            disabled={loading}
            className="mb-4"
          >
            <FileText className="w-4 h-4 mr-2" />
            Mulai Pengujian
          </Button>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium mb-2">Hasil Pengujian:</h3>
            <pre className="text-xs whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/savings">Kembali ke Tabungan</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default TestSavingsTransactions; 