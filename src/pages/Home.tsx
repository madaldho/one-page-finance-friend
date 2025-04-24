import ActiveWalletsList from "@/components/ActiveWalletsList";

// ... kode yang sudah ada

// Ganti wallets grid dengan ActiveWalletsList
// Cari kode yang mirip seperti:
/*
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
  {wallets.map((wallet) => (
    <WalletCard
      key={wallet.id}
      wallet={wallet}
      onEdit={handleEditWallet}
      onDelete={handleDeleteWallet}
      onSuccess={fetchData}
    />
  ))}
</div>
*/

// Ganti dengan:
<ActiveWalletsList
  wallets={wallets}
  onEditWallet={handleEditWallet}
  onDeleteWallet={handleDeleteWallet}
  onSuccess={fetchData}
/>

// Pastikan fungsi handler seperti handleEditWallet, handleDeleteWallet tetap ada 