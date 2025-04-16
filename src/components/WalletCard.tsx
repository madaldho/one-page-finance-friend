import { Wallet } from "@/types";

interface WalletCardProps {
  wallet: Wallet;
  onClick?: () => void;
  key?: string;
}

const WalletCard = ({ wallet, onClick }: WalletCardProps) => {
  const colors: Record<string, string> = {
    green: "bg-green-100 border-green-200",
    pink: "bg-pink-100 border-pink-200",
    blue: "bg-blue-100 border-blue-200",
    orange: "bg-orange-100 border-orange-200",
    purple: "bg-purple-100 border-purple-200",
    default: "bg-gray-100 border-gray-200"
  };

  const colorClass = colors[wallet.color] || colors.default;

  return (
    <div 
      className={`rounded-lg p-3 border ${colorClass} cursor-pointer`}
      onClick={onClick}
    >
      <div className="text-xs font-medium uppercase">{wallet.name}</div>
      <div className="font-semibold mt-1">Rp {wallet.balance.toLocaleString()}</div>
    </div>
  );
};

export default WalletCard;
