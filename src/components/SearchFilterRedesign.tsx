import React from "react";
import { Search, X, CheckCircle2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectionMode?: boolean;
  selectedCount?: number;
  onCancelSelection?: () => void;
  onBulkDelete?: () => void;
}

export default function SearchFilterRedesign({
  searchQuery,
  onSearchChange,
  selectionMode = false,
  selectedCount = 0,
  onCancelSelection,
  onBulkDelete,
}: SearchFilterProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar - Modern Design */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" />
        </div>
        <Input
          type="text"
          placeholder="Cari transaksi, kategori, atau wallet..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-12 h-12 sm:h-13 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 text-base placeholder:text-gray-400 font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {/* Subtle gradient border effect on focus */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
      </div>

      {/* Selection Mode Banner */}
      {selectionMode && (
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex-1 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-semibold text-blue-900 block">
                {selectedCount} transaksi dipilih
              </span>
              <span className="text-xs text-blue-600 hidden sm:block">
                Pilih transaksi untuk dihapus
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelSelection}
              className="h-9 sm:h-10 rounded-xl hover:bg-white/80 text-gray-700 font-medium px-3 sm:px-4"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-9 sm:h-10 rounded-xl shadow-md hover:shadow-lg transition-all font-medium px-3 sm:px-4"
              disabled={selectedCount === 0}
            >
              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Hapus</span>
              <span className="sm:hidden">{selectedCount}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
