
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Category } from "@/types";

interface SelectCategoryProps {
  categories: Category[];
  categoryId: string | null;
  setCategoryId: (id: string) => void;
}

export const SelectCategory = ({ categories, categoryId, setCategoryId }: SelectCategoryProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Pilih Kategori</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {categoryId ? categories.find((c) => c.id === categoryId)?.name : "Pilih kategori..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Cari kategori..." />
            <CommandEmpty>Tidak ada kategori yang ditemukan.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => {
                    setCategoryId(category.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      categoryId === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
