import React, { useState } from "react";
import { Check, Palette, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const colorOptions = [
  { id: "green", name: "Hijau", hex: "#10b981" },
  { id: "blue", name: "Biru", hex: "#3b82f6" },
  { id: "purple", name: "Ungu", hex: "#8b5cf6" },
  { id: "pink", name: "Pink", hex: "#ec4899" },
  { id: "orange", name: "Oranye", hex: "#f97316" },
  { id: "yellow", name: "Kuning", hex: "#eab308" },
  { id: "red", name: "Merah", hex: "#ef4444" },
  { id: "teal", name: "Teal", hex: "#14b8a6" },
  { id: "indigo", name: "Indigo", hex: "#6366f1" },
  { id: "emerald", name: "Emerald", hex: "#10b981" },
  { id: "amber", name: "Amber", hex: "#f59e0b" },
  { id: "cyan", name: "Cyan", hex: "#06b6d4" },
];

const ColorPicker = ({ selectedColor, onColorSelect }: ColorPickerProps) => {
  const [customColor, setCustomColor] = useState(selectedColor.startsWith('#') ? selectedColor : "#7E69AB");
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          aria-label="Pick a color"
          style={{ backgroundColor: selectedColor }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="center">
        <div className="mb-3">
          <label className="text-sm font-medium mb-1 block">Kustom Warna</label>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: customColor }}
            />
            <Input
              type="text"
              value={customColor} 
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              className="h-8"
            />
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-8 p-0 rounded cursor-pointer"
            />
            <Button
              size="sm"
              onClick={() => onColorSelect(customColor)}
            >
              Pilih
            </Button>
          </div>
        </div>
        
        <label className="text-sm font-medium mb-1 block">Warna Preset</label>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption.id}
              className={`
                w-12 h-12 rounded-full
                flex items-center justify-center
                transition-all
                ${selectedColor === colorOption.hex ? 'ring-2 ring-offset-2 ring-black' : ''}
              `}
              style={{ backgroundColor: colorOption.hex }}
              onClick={() => onColorSelect(colorOption.hex)}
              title={colorOption.name}
            >
              {selectedColor === colorOption.hex && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
