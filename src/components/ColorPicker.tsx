
import React from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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
  const selectedColor = colorOptions.find((c) => c.id === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-10 h-10 rounded-full ${selectedColor?.class} border-2 border-white shadow-sm`}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
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
