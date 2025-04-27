import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { cn, debounce } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Category } from "@/types";

interface SelectCategoryProps {
  categories: Category[];
  categoryId: string | null;
  setCategoryId: (id: string) => void;
}

export const SelectCategory = ({ categories, categoryId, setCategoryId }: SelectCategoryProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  // Deteksi perangkat mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Memoisasi daftar kategori yang difilter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);
  
  // Menggunakan debounce untuk mencari kategori
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );
  
  // Optimalkan untuk perangkat mobile
  const mobileItemHeight = 40; // perkiraan tinggi item dalam piksel
  const maxMobileItems = 5; // maksimum item yang ditampilkan tanpa scroll
  
  const popoverHeight = useMemo(() => {
    if (!isMobile) return undefined;
    
    const itemCount = Math.min(filteredCategories.length, maxMobileItems);
    // Tambahkan ruang untuk input pencarian dan elemen lainnya
    return `${(itemCount * mobileItemHeight) + 60}px`;
  }, [filteredCategories.length, isMobile]);
  
  // Menutup dropdown dengan klik di luar
  const popoverRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

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
            onClick={() => setOpen(!open)}
          >
            {categoryId 
              ? categories.find((c) => c.id === categoryId)?.name 
              : "Pilih kategori..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          ref={popoverRef}
          className="w-full p-0" 
          style={{ maxHeight: popoverHeight }}
        >
          <Command>
            <CommandInput 
              placeholder="Cari kategori..." 
              onValueChange={debouncedSearch}
              className="border-none focus:ring-0"
            />
            <CommandEmpty>Tidak ada kategori yang ditemukan.</CommandEmpty>
            <CommandGroup className={isMobile ? "touch-auto overflow-y-auto" : ""}>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => {
                    setCategoryId(category.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={isMobile ? "py-3" : ""}
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
