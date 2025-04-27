import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown } from 'lucide-react';
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
    const [formTouched, setFormTouched] = useState(false);
    const navigate = useNavigate();
    
    // Debounce untuk input dan update state lebih efisien
    const [debouncedTitle, setDebouncedTitle] = useState('');
    const [debouncedAmount, setDebouncedAmount] = useState('');
    const [debouncedDesc, setDebouncedDesc] = useState('');
    
    // Menggunakan useEffect untuk menerapkan debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            setTitle(debouncedTitle);
        }, 300); // Delay 300ms
        
        return () => clearTimeout(timer);
    }, [debouncedTitle]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setAmount(debouncedAmount);
        }, 300);
        
        return () => clearTimeout(timer);
    }, [debouncedAmount]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDescription(debouncedDesc);
        }, 300);
        
        return () => clearTimeout(timer);
    }, [debouncedDesc]);

    // Mengoptimalkan fetch data dengan caching
    useEffect(() => {
        const fetchCategoriesAndWallets = async () => {
            try {
                // Periksa cache terlebih dahulu
                const cachedCategories = localStorage.getItem('form_categories');
                const cachedWallets = localStorage.getItem('form_wallets');
                const cacheTimestamp = localStorage.getItem('form_cache_timestamp');
                const now = Date.now();
                
                // Cache valid selama 30 menit
                const isCacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp)) < 1800000;
                
                if (isCacheValid && cachedCategories && cachedWallets) {
                    setCategories(JSON.parse(cachedCategories));
                    setWallets(JSON.parse(cachedWallets));
                    return;
                }
                
                // Jika cache tidak ada atau sudah kadaluarsa, fetch data baru
                const [{ data: categoriesData, error: categoriesError }, { data: walletsData, error: walletsError }] = 
                    await Promise.all([
                        supabase.from('categories').select('id, name'),
                        supabase.from('wallets').select('id, name')
                    ]);
    
                if (categoriesError) {
                    console.error('Error fetching categories:', categoriesError);
                } else {
                    setCategories(categoriesData || []);
                    localStorage.setItem('form_categories', JSON.stringify(categoriesData));
                }
    
                if (walletsError) {
                    console.error('Error fetching wallets:', walletsError);
                } else {
                    setWallets(walletsData || []);
                    localStorage.setItem('form_wallets', JSON.stringify(walletsData));
                }
                
                localStorage.setItem('form_cache_timestamp', now.toString());
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchCategoriesAndWallets();
    }, []);

    // Menggunakan useCallback untuk fungsi yang sering dipanggil
    const fetchTransaction = useCallback(async () => {
        if (transactionId) {
            setLoading(true);
            
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', transactionId)
                    .single();

                if (error) {
                    console.error('Error fetching transaction:', error);
                    return;
                }

                if (data) {
                    setDebouncedTitle(data.title);
                    setDebouncedAmount(data.amount.toString());
                    setType(data.type);
                    setDate(new Date(data.date));
                    setCategoryId(data.category_id);
                    setWalletId(data.wallet_id);
                    setDebouncedDesc(data.description || '');
                }
            } catch (error) {
                console.error('Error in fetchTransaction:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [transactionId]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    // Menggunakan useMemo untuk memvalidasi form - mencegah kalkulasi berulang
    const isFormValid = useMemo(() => {
        return (
            title.trim() !== '' &&
            amount !== '' &&
            parseFloat(amount) > 0 &&
            walletId !== null
        );
    }, [title, amount, walletId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid) {
            toast.error('Harap isi semua field yang diperlukan');
            return;
        }
        
        setLoading(true);

        const transactionData = {
            title,
            amount: parseFloat(amount),
            type,
            date: format(date || new Date(), 'yyyy-MM-dd'),
            category_id: categoryId,
            wallet_id: walletId,
            description,
        };

        try {
            if (transactionId) {
                const { error } = await supabase
                    .from('transactions')
                    .update(transactionData)
                    .eq('id', transactionId);

                if (error) throw error;
                toast.success('Transaksi berhasil diperbarui!');
            } else {
                const { error } = await supabase
                    .from('transactions')
                    .insert([{ ...transactionData, user_id: (await supabase.auth.getUser()).data.user?.id }]);

                if (error) throw error;
                toast.success('Transaksi berhasil ditambahkan!');
            }
            
            // Gunakan setTimeout untuk memastikan toast muncul sebelum navigasi
            setTimeout(() => {
                navigate('/transactions');
                setOpen(false);
            }, 500);
        } catch (error) {
            console.error('Error adding/updating transaction:', error);
            toast.error('Terjadi kesalahan saat menambahkan/memperbarui transaksi.');
        } finally {
            setLoading(false);
        }
    };

    // Handler debounce untuk perubahan input
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDebouncedTitle(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDebouncedAmount(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDebouncedDesc(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    return (
        <Sheet open={open} onOpenChange={(newOpen) => {
            // Cegah penutupan form secara tidak sengaja jika sudah dimodifikasi
            if (!newOpen && formTouched) {
                if (window.confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?')) {
                    setOpen(newOpen);
                }
            } else {
                setOpen(newOpen);
            }
        }}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    {transactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{transactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}</SheetTitle>
                    <SheetDescription>
                        Buat transaksi baru dan kelola keuangan anda.
                    </SheetDescription>
                </SheetHeader>
                <Card className="w-full">
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Judul</Label>
                                <Input
                                    id="title"
                                    value={debouncedTitle}
                                    onChange={handleTitleChange}
                                    placeholder="Judul transaksi"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Jumlah</Label>
                                <Input
                                    type="number"
                                    id="amount"
                                    value={debouncedAmount}
                                    onChange={handleAmountChange}
                                    placeholder="Jumlah transaksi"
                                    required
                                    inputMode="numeric"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipe</Label>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant={type === 'income' ? 'secondary' : 'outline'}
                                        onClick={() => setType('income')}
                                    >
                                        Pemasukan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={type === 'expense' ? 'secondary' : 'outline'}
                                        onClick={() => setType('expense')}
                                    >
                                        Pengeluaran
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Tanggal</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
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

                            <SelectCategory
                                categories={categories}
                                categoryId={categoryId}
                                setCategoryId={setCategoryId}
                            />

                            <SelectWallet
                                wallets={wallets}
                                walletId={walletId}
                                setWalletId={setWalletId}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Input
                                    id="description"
                                    value={debouncedDesc}
                                    onChange={handleDescriptionChange}
                                    placeholder="Deskripsi transaksi"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading || !isFormValid}
                                className="w-full"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </SheetContent>
        </Sheet>
    );
};

export default TransactionForm;
