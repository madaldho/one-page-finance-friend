import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Banknote, 
  CreditCard, 
  PiggyBank, 
  Landmark,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

const WALLET_COLORS = [
  "#6E59A5", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#ec4899", "#14b8a6", "#64748b", "#000000"
];

export default function UIDemo() {
  const [name, setName] = useState('Demo Wallet');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState(1000000);
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const getWalletIcon = (type: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <div className="h-6 w-6 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-full w-full object-cover"
          />
        </div>
      );
    }
    
    switch (type) {
      case 'cash':
        return <Banknote className="h-6 w-6" />;
      case 'bank':
        return <Landmark className="h-6 w-6" />;
      case 'investment':
        return <CreditCard className="h-6 w-6" />;
      case 'savings':
        return <PiggyBank className="h-6 w-6" />;
      default:
        return <Banknote className="h-6 w-6" />;
    }
  };

  const handleLogoSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  };

  const handleLogoRemove = () => {
    setLogoUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UI/UX Demo - Logo Upload Feature
          </h1>
          <p className="text-gray-600">
            Demonstration of the new wallet form with logo upload and modern design
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Wallet Form</h2>
            
            <div className="space-y-6">
              {/* Wallet Name */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Nama Dompet</Label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                  placeholder="Contoh: Dompet Harian"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  <Label className="text-base font-semibold">Logo Dompet (Opsional)</Label>
                </div>
                <FileUpload
                  onFileSelect={handleLogoSelect}
                  onFileRemove={handleLogoRemove}
                  currentFileUrl={logoUrl}
                  placeholder="Pilih logo..."
                  accept="image/*"
                  maxSize={2}
                />
                <p className="text-sm text-gray-500">
                  Upload logo kustom untuk mempersonalisasi wallet Anda
                </p>
              </div>

              {/* Wallet Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipe Dompet</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-12 text-base border-2 focus:border-primary transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-3 py-1">
                        <Banknote className="h-5 w-5" />
                        <span className="font-medium">Uang Tunai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-3 py-1">
                        <Landmark className="h-5 w-5" />
                        <span className="font-medium">Rekening Bank</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="investment">
                      <div className="flex items-center gap-3 py-1">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">E-Wallet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="savings">
                      <div className="flex items-center gap-3 py-1">
                        <PiggyBank className="h-5 w-5" />
                        <span className="font-medium">Tabungan</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Balance */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Saldo</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="h-12 text-base border-2 focus:border-primary transition-colors pl-12"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Warna</Label>
                <div className="grid grid-cols-5 gap-3">
                  {WALLET_COLORS.map((walletColor) => (
                    <button
                      key={walletColor}
                      type="button"
                      className={cn(
                        "w-full aspect-square rounded-xl border-3 transition-all duration-200 hover:scale-105", 
                        color === walletColor ? "border-gray-800 shadow-lg scale-110" : "border-transparent hover:border-gray-300"
                      )}
                      style={{ backgroundColor: walletColor }}
                      onClick={() => setColor(walletColor)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div>
              <h2 className="text-xl font-bold mb-4">Preview</h2>
              <Card
                className="p-6 transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: color,
                  color: 'white'
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {getWalletIcon(type, logoUrl)}
                    <h3 className="font-semibold text-lg">{name || "Nama Dompet"}</h3>
                  </div>
                  <div>
                    <p className="text-sm opacity-80 font-medium">Saldo</p>
                    <p className="text-2xl font-bold tracking-wide">
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feature List */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4">New Features</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Logo Upload:</strong> Drag & drop file upload with preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Modern Design:</strong> Enhanced spacing, colors, and animations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Better Forms:</strong> Larger inputs with improved styling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Enhanced Cards:</strong> Better shadows and hover effects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Responsive:</strong> Works great on all screen sizes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>File Validation:</strong> Size and type validation with error handling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}