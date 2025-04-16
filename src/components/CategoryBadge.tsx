
import React from "react";

interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  // Map of category names to colors
  const categoryColors: Record<string, { bg: string; text: string }> = {
    // Income categories
    "Gaji": { bg: "bg-green-100", text: "text-green-800" },
    "Bonus": { bg: "bg-emerald-100", text: "text-emerald-800" },
    "Investasi": { bg: "bg-blue-100", text: "text-blue-800" },
    "Penjualan": { bg: "bg-indigo-100", text: "text-indigo-800" },
    "Hadiah": { bg: "bg-purple-100", text: "text-purple-800" },
    
    // Expense categories
    "Makanan": { bg: "bg-orange-100", text: "text-orange-800" },
    "Transportasi": { bg: "bg-amber-100", text: "text-amber-800" },
    "Tagihan": { bg: "bg-red-100", text: "text-red-800" },
    "Belanja": { bg: "bg-pink-100", text: "text-pink-800" },
    "Hiburan": { bg: "bg-violet-100", text: "text-violet-800" },
    "Kesehatan": { bg: "bg-cyan-100", text: "text-cyan-800" },
    
    // Default
    "Lainnya": { bg: "bg-gray-100", text: "text-gray-800" },
    
    // Special categories
    "Hutang": { bg: "bg-sky-100", text: "text-sky-800" },
    "Piutang": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  };
  
  const style = categoryColors[category] || categoryColors["Lainnya"];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {category}
    </span>
  );
};
