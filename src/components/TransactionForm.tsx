import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Wallet, ArrowLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { toast } from 'sonner';
import { SelectWallet } from './SelectWallet';
import { SelectCategory } from './SelectCategory';

interface TransactionFormProps {
    transactionId?: string;
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface Category {
    id: string;
    name: string;
}

interface Wallet {
    id: string;
    name: string;
    color?: string;
    balance?: number;
    type?: string;
}

const TransactionForm = ({ transactionId, open, setOpen }: TransactionFormProps) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [walletId, setWalletId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name');

            if (error) {
                console.error('Error fetching categories:', error);
            } else {
                setCategories(data || []);
            }
        };

        const fetchWallets = async () => {
            const { data, error } = await supabase
                .from('wallets')
                .select('id, name');

            if (error) {
                console.error('Error fetching wallets:', error);
            } else {
                setWallets(data || []);
            }
        };

        fetchCategories();
        fetchWallets();
    }, []);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (transactionId) {
                setLoading(true);
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', transactionId)
                    .single();

                if (error) {
                    console.error('Error fetching transaction:', error);
                }

                if (data) {
                    setTitle(data.title);
                    setAmount(data.amount.toString());
                    setType(data.type as 'income' | 'expense');
                    setDate(new Date(data.date));
                    setCategoryId(data.category);
                    setWalletId(data.wallet_id);
                    setDescription(data.description || '');
                }
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [transactionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const transactionData = {
            title,
            amount: parseFloat(amount),
            type,
            date: format(date || new Date(), 'yyyy-MM-dd'),
            category: categoryId || '',
            wallet_id: walletId || '',
            description,
        };

        try {
            if (transactionId) {
                const { data, error } = await supabase
                    .from('transactions')
                    .update(transactionData)
                    .eq('id', transactionId);

                if (error) throw error;
                toast.success('Transaksi berhasil diperbarui!');
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase
                    .from('transactions')
                    .insert({ ...transactionData, user_id: user?.id })
                    .select();

                if (error) throw error;
                toast.success('Transaksi berhasil ditambahkan!');
            }
            navigate('/transactions');
            setOpen(false);
        } catch (error) {
            console.error('Error adding/updating transaction:', error);
            toast.error('Terjadi kesalahan saat menambahkan/memperbarui transaksi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    {transactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[85vw] sm:max-w-md p-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                {/* Header dengan Background Gradient */}
                <SheetHeader className="p-6 pb-4 bg-white/80 backdrop-blur-sm border-b border-white/50">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="p-2 hover:bg-white/70 rounded-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <SheetTitle className="text-lg font-semibold text-gray-900">
                                {transactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                            </SheetTitle>
                            <SheetDescription className="text-sm text-gray-600">
                                {transactionId ? 'Perbarui detail transaksi' : 'Buat transaksi baru dan kelola keuangan Anda'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Form Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="p-0">
                            <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Judul */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Judul</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Masukkan judul transaksi"
                                    className="h-11 bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Jumlah */}
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Jumlah</Label>
                                <Input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="h-11 bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Tipe Transaksi */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Tipe Transaksi</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant={type === 'income' ? 'default' : 'outline'}
                                        onClick={() => setType('income')}
                                        className={cn(
                                            "h-11 transition-all",
                                            type === 'income' 
                                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                : 'bg-white/80 hover:bg-green-50 text-gray-700 border-gray-200'
                                        )}
                                    >
                                        Pemasukan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={type === 'expense' ? 'default' : 'outline'}
                                        onClick={() => setType('expense')}
                                        className={cn(
                                            "h-11 transition-all",
                                            type === 'expense' 
                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                : 'bg-white/80 hover:bg-red-50 text-gray-700 border-gray-200'
                                        )}
                                    >
                                        Pengeluaran
                                    </Button>
                                </div>
                            </div>

                            {/* Tanggal */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Tanggal</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-11 justify-start text-left font-normal bg-white/80 border-gray-200",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) =>
                                                date > new Date()
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Kategori */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                                <SelectCategory
                                    categories={categories.map(cat => ({
                                        id: cat.id,
                                        name: cat.name,
                                        user_id: '',
                                        type: cat.type || 'expense',
                                        icon: cat.icon || '',
                                        color: cat.color || '#6B7280',
                                        sort_order: 0,
                                        created_at: '',
                                        updated_at: ''
                                    }))}
                                    categoryId={categoryId}
                                    setCategoryId={setCategoryId}
                                />
                            </div>

                            {/* Dompet dengan Warna */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Dompet</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full h-11 justify-between bg-white/80 border-gray-200",
                                                !walletId && "text-muted-foreground"
                                            )}
                                        >
                                            {walletId ? (
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                        style={{ 
                                                            backgroundColor: wallets.find(w => w.id === walletId)?.color || '#6B7280' 
                                                        }}
                                                    />
                                                    <span>{wallets.find(w => w.id === walletId)?.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="w-4 h-4 text-gray-400" />
                                                    <span>Pilih dompet</span>
                                                </div>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari dompet..." />
                                            <CommandEmpty>Tidak ada dompet ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {wallets.map((wallet) => (
                                                    <CommandItem
                                                        key={wallet.id}
                                                        value={wallet.id}
                                                        onSelect={() => setWalletId(wallet.id)}
                                                        className="flex items-center gap-2 p-3"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div 
                                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                                style={{ backgroundColor: wallet.color || '#6B7280' }}
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">{wallet.name}</p>
                                                                {wallet.balance !== undefined && (
                                                                    <p className="text-sm text-gray-500">
                                                                        Saldo: Rp {wallet.balance.toLocaleString('id-ID')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                walletId === wallet.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi (Opsional)</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Catatan tambahan..."
                                    className="h-11 bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className={cn(
                                    "w-full h-11 font-medium transition-all",
                                    type === 'income' 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-red-600 hover:bg-red-700'
                                )}
                            >
                                {loading ? 'Menyimpan...' : (transactionId ? 'Perbarui Transaksi' : 'Simpan Transaksi')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SheetContent>
    </Sheet>
    );
};

export default TransactionForm;
