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
  value?: string;
  onChange?: (color: string) => void;
  onChangeGradient?: (gradient: string) => void;
  showGradients?: boolean;
  // Alias props untuk backward compatibility
  color?: string;
  onColorChange?: (color: string) => void;
  gradient?: string;
  onGradientChange?: (gradient: string) => void;
}

const colorOptions = [
  { id: "green", name: "Hijau", class: "bg-green-500", hex: "#10b981" },
  { id: "blue", name: "Biru", class: "bg-blue-500", hex: "#3b82f6" },
  { id: "purple", name: "Ungu", class: "bg-purple-500", hex: "#8b5cf6" },
  { id: "pink", name: "Pink", class: "bg-pink-500", hex: "#ec4899" },
  { id: "orange", name: "Oranye", class: "bg-orange-500", hex: "#f97316" },
  { id: "yellow", name: "Kuning", class: "bg-yellow-500", hex: "#eab308" },
  { id: "red", name: "Merah", class: "bg-red-500", hex: "#ef4444" },
  { id: "teal", name: "Teal", class: "bg-teal-500", hex: "#14b8a6" },
  { id: "indigo", name: "Indigo", class: "bg-indigo-500", hex: "#6366f1" },
  { id: "emerald", name: "Emerald", class: "bg-emerald-500", hex: "#10b981" },
  { id: "amber", name: "Amber", class: "bg-amber-500", hex: "#f59e0b" },
  { id: "cyan", name: "Cyan", class: "bg-cyan-500", hex: "#06b6d4" },
];

const gradientOptions = [
  { id: "sunset", name: "Sunset", class: "bg-gradient-to-r from-orange-500 to-pink-500" },
  { id: "ocean", name: "Ocean", class: "bg-gradient-to-r from-blue-500 to-teal-400" },
  { id: "forest", name: "Forest", class: "bg-gradient-to-r from-green-500 to-emerald-400" },
  { id: "aurora", name: "Aurora", class: "bg-gradient-to-r from-purple-500 to-indigo-400" },
  { id: "desert", name: "Desert", class: "bg-gradient-to-r from-amber-500 to-yellow-400" },
  { id: "midnight", name: "Midnight", class: "bg-gradient-to-r from-indigo-600 to-purple-600" },
  { id: "flamingo", name: "Flamingo", class: "bg-gradient-to-r from-pink-500 to-red-400" },
  { id: "mint", name: "Mint", class: "bg-gradient-to-r from-teal-400 to-cyan-300" },
];

const ColorPicker = ({ 
  value, 
  onChange, 
  onChangeGradient, 
  showGradients = true, 
  // Support untuk alias props
  color, 
  onColorChange, 
  gradient, 
  onGradientChange 
}: ColorPickerProps) => {
  // Gunakan value atau color, dengan prioritas ke value
  const colorValue = value || color || "#7E69AB";
  // Gunakan onChange atau onColorChange, dengan prioritas ke onChange
  const handleColorChange = onChange || onColorChange;

  const [customColor, setCustomColor] = useState(colorValue.startsWith('#') ? colorValue : "#7E69AB");
  const [gradientDirection, setGradientDirection] = useState("to-r");
  const [gradientColors, setGradientColors] = useState({
    from: "#3b82f6",
    to: "#10b981",
  });
  const [activeTab, setActiveTab] = useState<string>("solid");
  
  // Check if value is a hex color code
  const isCustomColor = colorValue.startsWith('#');
  
  // Get background for the trigger button
  const getButtonStyle = () => {
    if (isCustomColor) {
      return { backgroundColor: colorValue };
    }
    
    const colorOption = colorOptions.find((c) => c.id === colorValue);
    if (colorOption) {
      return { backgroundColor: colorOption.hex };
    }
    
    return { backgroundColor: "#6E59A5" };
  };

  const handleGradientChange = () => {
    const gradientValue = `bg-gradient-${gradientDirection} from-[${gradientColors.from}] to-[${gradientColors.to}]`;
    // Gunakan onChangeGradient atau onGradientChange, dengan prioritas ke onChangeGradient
    if (onChangeGradient) {
      onChangeGradient(gradientValue);
    } else if (onGradientChange) {
      onGradientChange(gradientValue);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          aria-label="Pick a color"
          style={getButtonStyle()}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="center">
        {showGradients ? (
          <Tabs defaultValue="solid" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full mb-3">
              <TabsTrigger value="solid" className="flex-1">Solid</TabsTrigger>
              <TabsTrigger value="gradient" className="flex-1">Gradient</TabsTrigger>
            </TabsList>
            
            <TabsContent value="solid" className="mt-0">
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
                  <button
                    className="h-8 px-2 bg-primary text-white rounded text-xs"
                    onClick={() => handleColorChange && handleColorChange(customColor)}
                  >
                    Pilih
                  </button>
                </div>
              </div>
              
              <label className="text-sm font-medium mb-1 block">Warna Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    className={`
                      w-12 h-12 rounded-full ${colorOption.class} 
                      flex items-center justify-center
                      transition-all
                      ${colorValue === colorOption.id ? 'ring-2 ring-offset-2 ring-black' : ''}
                    `}
                    onClick={() => handleColorChange && handleColorChange(colorOption.id)}
                    title={colorOption.name}
                  >
                    {colorValue === colorOption.id && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="gradient" className="mt-0">
              <div className="mb-3">
                <label className="text-sm font-medium mb-1 block">Preset Gradient</label>
                <div className="grid grid-cols-2 gap-2">
                  {gradientOptions.map((gradientOption) => (
                    <button
                      key={gradientOption.id}
                      className={`
                        h-12 rounded-lg ${gradientOption.class} 
                        flex items-center justify-center text-white text-xs font-medium
                        transition-all
                      `}
                      onClick={() => {
                        if (onChangeGradient) {
                          onChangeGradient(gradientOption.class.replace("bg-", ""));
                        } else if (onGradientChange) {
                          onGradientChange(gradientOption.class.replace("bg-", ""));
                        }
                      }}
                      title={gradientOption.name}
                    >
                      {gradientOption.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <label className="text-sm font-medium mb-1 block">Kustom Gradient</label>
                
                <div>
                  <div className="mb-1 text-xs text-gray-500">Arah Gradient</div>
                  <RadioGroup 
                    defaultValue="to-r" 
                    className="grid grid-cols-4 gap-2"
                    onValueChange={(value) => setGradientDirection(value)}
                  >
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="to-r" id="to-r" />
                      <Label htmlFor="to-r" className="text-xs mt-1">→</Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="to-l" id="to-l" />
                      <Label htmlFor="to-l" className="text-xs mt-1">←</Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="to-b" id="to-b" />
                      <Label htmlFor="to-b" className="text-xs mt-1">↓</Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="to-tr" id="to-tr" />
                      <Label htmlFor="to-tr" className="text-xs mt-1">↗</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-gray-500">Warna Awal</div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={gradientColors.from}
                        onChange={(e) => setGradientColors({...gradientColors, from: e.target.value})}
                        className="w-8 h-8 p-1 rounded cursor-pointer border-gray-300"
                        aria-label="Warna awal gradient"
                      />
                      <Input 
                        type="text" 
                        value={gradientColors.from}
                        onChange={(e) => setGradientColors({...gradientColors, from: e.target.value})}
                        className="h-8 text-xs"
                        aria-label="Kode warna awal gradient"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-gray-500">Warna Akhir</div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={gradientColors.to}
                        onChange={(e) => setGradientColors({...gradientColors, to: e.target.value})}
                        className="w-8 h-8 p-1 rounded cursor-pointer border-gray-300"
                        aria-label="Warna akhir gradient"
                      />
                      <Input 
                        type="text" 
                        value={gradientColors.to}
                        onChange={(e) => setGradientColors({...gradientColors, to: e.target.value})}
                        className="h-8 text-xs"
                        aria-label="Kode warna akhir gradient"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="h-10 rounded-lg mt-2 mb-2" 
                  style={{
                    background: `linear-gradient(${gradientDirection.replace('to-', 'to ')} , ${gradientColors.from}, ${gradientColors.to})`
                  }}
                />
                
                <Button 
                  className="w-full"
                  onClick={handleGradientChange}
                >
                  Terapkan Gradient
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
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
            <button
              className="h-8 px-2 bg-primary text-white rounded text-xs"
              onClick={() => handleColorChange && handleColorChange(customColor)}
            >
              Pilih
            </button>
          </div>
        </div>
        
        <label className="text-sm font-medium mb-1 block">Warna Preset</label>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption.id}
              className={`
                w-12 h-12 rounded-full ${colorOption.class} 
                flex items-center justify-center
                transition-all
                ${colorValue === colorOption.id ? 'ring-2 ring-offset-2 ring-black' : ''}
              `}
              onClick={() => handleColorChange && handleColorChange(colorOption.id)}
                  title={colorOption.name}
            >
              {colorValue === colorOption.id && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
          ))}
        </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
