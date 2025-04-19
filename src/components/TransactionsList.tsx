import { PiggyBank } from 'lucide-react';

const renderTransactionIcon = (transaction: any) => {
  const isSavingsTransaction = 
    transaction.title?.toLowerCase().includes('tabungan') || 
    transaction.description?.toLowerCase().includes('tabungan') ||
    transaction.category === 'Tabungan';
  
  if (isSavingsTransaction) {
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-amber-100'}`}>
        <PiggyBank className={`h-5 w-5 ${transaction.type === 'income' ? 'text-green-600' : 'text-amber-600'}`} />
      </div>
    );
  }
  
  // Ikon untuk transaksi lain yang sudah ada
  // ... kode ikon lain yang sudah ada ...
};

const getTransactionCategory = (transaction: any) => {
  if (transaction.title?.toLowerCase().includes('setor ke tabungan')) {
    return 'Setoran Tabungan';
  } else if (transaction.title?.toLowerCase().includes('tarik dari tabungan')) {
    return 'Penarikan Tabungan';
  }
  
  // Kategori default untuk transaksi lain
  return transaction.category || 'Tidak Berkategori';
};

// Gunakan fungsi-fungsi di atas saat menampilkan transaksi
// ... kode yang sudah ada ... 