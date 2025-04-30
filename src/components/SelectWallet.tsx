
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Wallet } from "@/types";

interface SelectWalletProps {
  wallets: Wallet[];
  walletId: string | null;
  setWalletId: (id: string) => void;
}

export const SelectWallet = ({ wallets, walletId, setWalletId }: SelectWalletProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Pilih Dompet</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {walletId ? wallets.find((w) => w.id === walletId)?.name : "Pilih dompet..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Cari dompet..." />
            <CommandEmpty>Tidak ada dompet yang ditemukan.</CommandEmpty>
            <CommandGroup>
              {wallets.map((wallet) => (
                <CommandItem
                  key={wallet.id}
                  onSelect={() => {
                    setWalletId(wallet.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      walletId === wallet.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {wallet.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
