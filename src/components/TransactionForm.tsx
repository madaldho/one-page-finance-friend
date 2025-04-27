import { useState, useEffect } from 'react';
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
                    setType(data.type);
                    setDate(new Date(data.date));
                    setCategoryId(data.category_id);
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
            category_id: categoryId,
            wallet_id: walletId,
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
                const { data, error } = await supabase
                    .from('transactions')
                    .insert({ ...transactionData, user_id: supabase.auth.user()?.id })
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
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Judul transaksi"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Jumlah</Label>
                                <Input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Jumlah transaksi"
                                    required
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
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Deskripsi transaksi"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Loading...' : 'Simpan'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </SheetContent>
        </Sheet>
    );
};

export default TransactionForm;
