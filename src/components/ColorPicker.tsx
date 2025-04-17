
import React, { useState } from "react";
import { Check, Palette } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const colorOptions = [
  { id: "green", name: "Hijau", class: "bg-green-500" },
  { id: "blue", name: "Biru", class: "bg-blue-500" },
  { id: "purple", name: "Ungu", class: "bg-purple-500" },
  { id: "pink", name: "Pink", class: "bg-pink-500" },
  { id: "orange", name: "Oranye", class: "bg-orange-500" },
  { id: "yellow", name: "Kuning", class: "bg-yellow-500" },
  { id: "red", name: "Merah", class: "bg-red-500" },
];

const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [customColor, setCustomColor] = useState(value.startsWith('#') ? value : "#7E69AB");
  const selectedColor = colorOptions.find((c) => c.id === value);
  
  // Check if value is a hex color code
  const isCustomColor = value.startsWith('#');
  
  // Get background color class for the trigger button
  const getBgColorClass = () => {
    if (isCustomColor) {
      return "";
    }
    return selectedColor?.class || "bg-gray-200";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-10 h-10 rounded-full ${getBgColorClass()} border-2 border-white shadow-sm`}
          aria-label="Pick a color"
          style={isCustomColor ? { backgroundColor: value } : {}}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="mb-3">
          <label className="text-sm font-medium mb-1 block">Kustom Warna</label>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: customColor }}
            />
            <Input
              type="text"
              value={customColor} 
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              className="h-8"
            />
            <button
              className="h-8 px-2 bg-primary text-white rounded text-xs"
              onClick={() => onChange(customColor)}
            >
              Pilih
            </button>
          </div>
        </div>
        
        <label className="text-sm font-medium mb-1 block">Warna Preset</label>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.id}
              className={`
                w-12 h-12 rounded-full ${color.class} 
                flex items-center justify-center
                transition-all
                ${value === color.id ? 'ring-2 ring-offset-2 ring-black' : ''}
              `}
              onClick={() => onChange(color.id)}
            >
              {value === color.id && (
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
