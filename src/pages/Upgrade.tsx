import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Star,
  CreditCard,
  PiggyBank,
  BarChart3,
  Building,
  Palette,
  Bookmark,
  Award,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Crown,
  Gift,
  Zap,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mendeklarasikan type untuk Facebook Pixel
declare global {
  interface Window {
    fbq?: (
      track: string,
      eventName: string,
      parameters?: Record<string, unknown>
    ) => void;
  }
}

export default function Upgrade() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto slider untuk testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Ganti setiap 4 detik

    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = (plan: string) => {
    // Melacak peristiwa AddToCart di Meta Pixel
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        const planData = {
          "monthly": { name: "Pro Bulanan", value: 20000 },
          "yearly": { name: "Pro Tahunan", value: 85000 },
          "lifetime": { name: "Pro Lifetime", value: 150000 }
        };
        
        const selectedPlan = planData[plan as keyof typeof planData] || planData.monthly;
        
        window.fbq('track', 'AddToCart', {
          content_name: selectedPlan.name,
          content_type: 'product',
          content_ids: [plan],
          value: selectedPlan.value,
          currency: 'IDR',
        });
      }
    } catch (error) {
      console.error("Error tracking AddToCart event:", error);
    }
    
    // Buat pesan WhatsApp sesuai paket yang dipilih
    let message = "";
    switch(plan) {
      case "monthly":
        message = "Halo, saya ingin upgrade ke paket Pro Bulanan (Rp20.000/bulan) di aplikasi Keuangan Pribadi.";
        break;
      case "yearly":
        message = "Halo, saya ingin upgrade ke paket Pro Tahunan (Rp85.000/tahun) di aplikasi Keuangan Pribadi. Hemat Rp155.000!";
        break;
      case "lifetime":
        message = "Halo, saya ingin upgrade ke paket Pro Lifetime (Rp150.000) - Promo Early Adopter di aplikasi Keuangan Pribadi.";
        break;
      default:
        message = "Halo, saya ingin upgrade ke paket Pro di aplikasi Keuangan Pribadi.";
    }
    
    // Redirect ke WhatsApp
    const whatsappUrl = `https://wa.me/6285794215084?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Fungsi untuk kembali ke halaman home
  const handleStayFree = () => {
    navigate("/home");
  };

  const proFeatures = [
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      title: "Analisis Tanpa Batas",
      description: "Lihat tren pemasukan & pengeluaran kapan pun, insights mendalam untuk keputusan finansial yang lebih baik",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Bookmark className="h-6 w-6 text-white" />,
      title: "Kategori Tak Terbatas", 
      description: "Bebas atur sesuai gaya hidup kamu, kategorisasi detail untuk tracking yang lebih akurat",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <PiggyBank className="h-6 w-6 text-white" />,
      title: "Tabungan/Celengan",
      description: "Targetkan dan pantau progres otomatis, milestone tracking untuk mencapai tujuan finansial",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      title: "Anggaran/Budget",
      description: "Kontrol pengeluaran biar nggak jebol, notifikasi real-time saat mendekati limit",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <CreditCard className="h-6 w-6 text-white" />,
      title: "Hutang-Piutang",
      description: "Catat, ingatkan, dan lunasi tepat waktu ",
      gradient: "from-amber-500 to-yellow-500"
    },
    {
      icon: <Building className="h-6 w-6 text-white" />,
      title: "Manajemen Aset",
      description: "Lihat nilai aset kamu di satu tempat, tracking portfolio investasi lengkap",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Palette className="h-6 w-6 text-white" />,
      title: "Tampilan Cakep",
      description: "Wallet card support gradient bisa kamu custom sesuai warna kesukaanmu",
      gradient: "from-teal-500 to-blue-500"
    }
  ];

  const testimonials = [
    {
      name: "Rani Septiani",
      role: "Mahasiswa",
      text: "Sejak pakai fitur anggaran, pengeluaran bulanan turun 30%! Sekarang bisa nabung buat wisuda tanpa minta ortu lagi 🎓",
      avatar: "👩‍🎓"
    },
    {
      name: "Dita Anggraini",
      role: "Ibu Rumah Tangga",
      text: "Target tabungan anak otomatis tercapai lebih cepat! Fitur celengan dengan persentase tracking bikin termotivasi nabung terus 🏦",
      avatar: "👩‍🏫"
    },
    {
      name: "Rio Pamungkas",
      role: "Freelancer",
      text: "Catat biaya admin pas pindah saldo udah gak susah lagi karna di sedikan fitur trasnfer, karna biaya admin yang sering bikin catatan berantkan tuh",
      avatar: "👨‍🎓"
    }
  ];

  return (
    <Layout>
      {/* Mobile view */}
      <div className="md:hidden min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-indigo-200 to-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        <div className="relative z-10 pt-4 pb-24">
          {/* Header with back button */}
          <div className="px-4 mb-6">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-3 shadow-sm border border-white/20">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:bg-white/50 rounded-xl p-2"
                onClick={handleStayFree}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Kembali</span>
              </Button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="px-6 text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full mb-4 shadow-lg">
              <span className="text-sm font-bold">🔥 Promo Early Adopter – Lifetime Rp150.000 (100 user pertama)</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-3 text-gray-800">
              Kelola Keuangan Lebih Rapi, Hemat, & Tenang
            </h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Dari analisis harian sampai rencana tabungan—semuanya dalam satu aplikasi yang simpel buat kebutuhan orang Indonesia.
            </p>
          </div>

          {/* Pricing Options */}
          <div className="px-6 space-y-4 mb-8">
            {/* Bulanan */}
            <div className="backdrop-blur-sm bg-white/90 p-5 rounded-2xl shadow-lg border border-blue-200 relative overflow-hidden transform transition-all duration-200 hover:scale-[1.02] cursor-pointer" onClick={() => handleUpgrade("monthly")}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Bulanan</h3>
                  <p className="text-xs text-blue-600">Coba fleksibel, bisa batal kapan saja</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-800">Rp 20.000</span>
                  <span className="text-sm text-gray-500">/ bulan</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium shadow-lg mb-3">
                Mulai Bulanan
              </Button>
              
              <p className="text-xs text-gray-500 text-center">Termasuk semua fitur Pro selama aktif.</p>
            </div>

            {/* Tahunan */}
            <div className="backdrop-blur-sm bg-white/90 p-5 rounded-2xl shadow-lg border border-green-200 relative overflow-hidden transform transition-all duration-200 hover:scale-[1.02] cursor-pointer" onClick={() => handleUpgrade("yearly")}>
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold py-1 right-[-25px] top-[10px] w-[70px] text-center shadow-sm">
                  HEMAT
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tahunan</h3>
                  <p className="text-xs text-green-600">Hemat dibanding bulanan</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-800">Rp 85.000</span>
                  <span className="text-sm text-gray-500">/ tahun</span>
                </div>
                <p className="text-green-600 text-sm font-medium">Hemat Rp 155.000 vs bulanan!</p>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg">
                Pilih Tahunan
              </Button>
            </div>

            {/* Lifetime */}
            <div className="backdrop-blur-sm bg-white/90 p-5 rounded-2xl shadow-xl border-2 border-orange-300 relative overflow-hidden transform transition-all duration-200 hover:scale-[1.02] cursor-pointer" onClick={() => handleUpgrade("lifetime")}>
              <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold py-1 right-[-35px] top-[12px] w-[90px] text-center shadow-sm">
                  PROMO
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Lifetime</h3>
                  <p className="text-xs text-orange-600">Akses selamanya, tanpa biaya tahunan</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-800">Rp 150.000</span>
                  <span className="text-sm text-gray-500">• sekali bayar</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  
                  <Badge className="bg-red-100 text-red-700 text-xs">100 pengguna pertama</Badge>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg">
                <Gift className="mr-2 h-4 w-4" />
                Amankan Lifetime
              </Button>
            </div>
          </div>

          {/* Kenapa Upgrade Pro Section */}
          <div className="px-6 mb-8">
            <h3 className="text-lg font-bold text-center mb-6 text-gray-800">🚀 Kenapa Upgrade Pro?</h3>
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Analisis tanpa batas</h4>
                    <p className="text-xs text-gray-600">Lihat tren pemasukan & pengeluaran kapan pun</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <Bookmark className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Kategori tak terbatas</h4>
                    <p className="text-xs text-gray-600">Bebas atur sesuai gaya hidup kamu</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <PiggyBank className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Tabungan/Celengan</h4>
                    <p className="text-xs text-gray-600">Targetkan dan pantau progres otomatis</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Anggaran/Budget</h4>
                    <p className="text-xs text-gray-600">Kontrol pengeluaran biar nggak jebol</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Hutang-Piutang</h4>
                    <p className="text-xs text-gray-600">Catat, ingatkan, dan lunasi tepat waktu</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Manajemen Aset</h4>
                    <p className="text-xs text-gray-600">Lihat nilai aset kamu di satu tempat</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Tampilan cakep</h4>
                    <p className="text-xs text-gray-600">Wallet card support gradient & tema</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-2.5 shadow-lg mt-0.5">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800 mb-1">Multi-device & backup</h4>
                    <p className="text-xs text-gray-600">Data kamu aman dan sinkron</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Comparison Matrix: FREE vs PRO di Mobile */}
          <div className="px-6 mb-8">
            <h3 className="text-lg font-bold text-center mb-6 text-gray-800">📊 Bandingkan FREE vs PRO</h3>
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-2 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="text-center py-4 border-r border-gray-200">
                  <span className="text-gray-500 font-bold text-sm">FREE VERSION</span>
                </div>
                <div className="text-center py-4">
                  <span className="text-blue-700 font-bold text-sm">PRO VERSION</span>
                </div>
              </div>
              
              {/* Comparison Rows */}
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Analisis:</strong> 3x/hari</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Analisis:</strong> Tanpa batas</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Wallet:</strong> Tanpa gradient</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Palette className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Wallet:</strong> Gradient aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Tabungan:</strong> Tidak ada</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <PiggyBank className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Tabungan:</strong> Aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Budget:</strong> Tidak ada</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Budget:</strong> Aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Hutang-Piutang:</strong> Tidak ada</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Hutang-Piutang:</strong> Aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Aset:</strong> Tidak ada</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Building className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Aset:</strong> Aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-xs">10</span>
                    </div>
                    <span className="text-xs text-gray-700"><strong>Kategori:</strong> Maks. 10</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xs">∞</span>
                    </div>
                    <span className="text-xs text-gray-700"><strong>Kategori:</strong> Tanpa batas</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 py-3">
                  <div className="px-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Backup:</strong> Dasar</span>
                  </div>
                  <div className="px-3 flex items-center gap-2 border-l border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-gray-700"><strong>Backup:</strong> Penuh & prioritas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials dengan Auto Slider */}
          <div className="px-6 mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">💬 Kata Mereka yang Sudah Pro</h3>
            <div className="relative">
              <div className="backdrop-blur-sm bg-white/90 rounded-xl p-5 border border-white/20 shadow-lg">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{testimonials[currentTestimonial].avatar}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-3 italic">"{testimonials[currentTestimonial].text}"</p>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{testimonials[currentTestimonial].name}</p>
                      <p className="text-xs text-gray-500">{testimonials[currentTestimonial].role}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Indicator dots */}
              <div className="flex justify-center gap-2 mt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-blue-500 w-6' 
                        : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-6">
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-5 border border-white/20 shadow-lg text-center">
              <p className="text-xs text-gray-600 mb-4">
                🔒 Pembayaran aman • 
              </p>
              <Button
                variant="outline"
                className="w-full border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 rounded-xl py-3"
                onClick={handleStayFree}>
                Tetap Gunakan Gratis (Terbatas)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background decorations - More subtle */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-100/40 to-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/40 to-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        <div className="container max-w-7xl mx-auto px-4 py-8 relative z-10">
          {/* Header - Modern redesign */}
          <div className="backdrop-blur-md bg-white/90 rounded-3xl p-6 mb-12 shadow-lg border border-white/30 sticky top-6 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="rounded-2xl hover:bg-white/80 h-12 w-12 p-0 border border-gray-200/50 shadow-sm transition-all duration-200 hover:shadow-md"
                  onClick={handleStayFree}>
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <div>
                  <span className="text-base text-gray-700 font-semibold">Kembali ke Home</span>
                  <p className="text-sm text-gray-500">Kelola keuangan lebih mudah</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-bold">PROMO TERBATAS</span>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Hero Section - Enhanced */}
          <div className="text-center mb-20 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-full mb-8 shadow-xl">
              <span className="text-base font-bold">🔥 Promo Early Adopter – Lifetime Rp150.000 (100 user pertama)</span>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight">
              Kelola Keuangan Lebih 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Rapi, Hemat, & Tenang</span>
            </h1>
            <p className="text-gray-600 text-xl mb-12 max-w-4xl mx-auto leading-relaxed">
              Dari analisis harian sampai rencana tabungan—semuanya dalam satu aplikasi yang simpel buat kebutuhan orang Indonesia.
            </p>
            
        
            
          </div>

          {/* Pricing Cards - Enhanced Design */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-24">
            {/* Bulanan */}
            <Card className="group overflow-hidden border-0 h-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative transform transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl cursor-pointer" onClick={() => handleUpgrade("monthly")}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-8 pb-6 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-800 mb-1">Bulanan</h3>
                    <p className="text-blue-700 font-medium">Coba fleksibel, bisa batal kapan saja</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-5xl font-bold text-gray-800">Rp 20.000</span>
                    <span className="text-xl text-gray-500">/ bulan</span>
                  </div>
                  <p className="text-blue-600 font-medium">Perfect untuk pemula</p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg py-7 shadow-xl group-hover:shadow-2xl transition-all duration-300 rounded-2xl"
                  onClick={() => handleUpgrade("monthly")}
                  size="lg">
                  <span>Mulai Bulanan</span>
                  <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </Button>
              </div>

              <div className="p-8 pt-6 border-t border-blue-200/50 relative z-10">
                <div className="text-blue-800 font-medium text-center">
                  ✨ Termasuk semua fitur Pro selama aktif
                </div>
              </div>
            </Card>

            {/* Tahunan */}
            <Card className="group overflow-hidden border-0 h-full bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 relative transform transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl cursor-pointer" onClick={() => handleUpgrade("yearly")}>
              <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold py-2 right-[-35px] top-[18px] w-[140px] text-center shadow-lg">
                  PALING HEMAT
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="p-8 pb-6 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-800 mb-1">Tahunan</h3>
                    <p className="text-green-700 font-medium">Hemat dibanding bulanan</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-5xl font-bold text-gray-800">Rp 85.000</span>
                    <span className="text-xl text-gray-500">/ tahun</span>
                  </div>
                  <p className="text-green-700 font-semibold text-lg">
                    💰 Hemat Rp 155.000 vs bulanan!
                  </p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-7 shadow-xl group-hover:shadow-2xl transition-all duration-300 rounded-2xl"
                  onClick={() => handleUpgrade("yearly")}
                  size="lg">
                  <Star className="mr-2 h-5 w-5" />
                  <span>Pilih Tahunan</span>
                  <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </Button>
              </div>

              <div className="p-8 pt-6 border-t border-green-200/50 relative z-10">
                <div className="text-green-800 font-medium text-center">
                  🎯 Perfect untuk komitmen finansial jangka panjang!
                </div>
              </div>
            </Card>

            {/* Lifetime */}
            <Card className="group overflow-hidden border-0 h-full bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 relative transform transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-3xl cursor-pointer" onClick={() => handleUpgrade("lifetime")}>
              <div className="absolute top-0 right-0 w-36 h-36 overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold py-2 right-[-40px] top-[25px] w-[160px] text-center shadow-lg">
                  PROMO 100 USER
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="p-8 pb-6 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-800 mb-1">Lifetime</h3>
                    <p className="text-orange-700 font-medium">Akses selamanya, tanpa biaya tahunan</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-5xl font-bold text-gray-800">Rp 150.000</span>
                    <span className="text-xl text-gray-500">• sekali bayar</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                
                    <Badge className="bg-red-100 text-red-700 border-0 text-sm px-3 py-1">100 pengguna pertama</Badge>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg py-7 shadow-xl group-hover:shadow-2xl transition-all duration-300 rounded-2xl"
                  onClick={() => handleUpgrade("lifetime")}
                  size="lg">
                  <Gift className="mr-2 h-5 w-5" />
                  <span>Amankan Lifetime</span>
                  <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </Button>
              </div>

              <div className="p-8 pt-6 border-t border-orange-200/50 relative z-10">
                <div className="text-orange-800 font-medium text-center">
                  🔥 LIMITED TIME: Invest sekali, untung selamanya!
                </div>
              </div>
            </Card>
          </div>

        {/* Kenapa Upgrade Pro Section - Desktop */}
        <div className="max-w-7xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-gray-900">
              🚀 Kenapa Upgrade Pro?
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Fitur-fitur premium yang akan mengubah cara Anda mengelola keuangan—dari basic tracking ke financial mastery
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {proFeatures.map((feature, index) => (
              <Card
                key={index}
                className="group h-full p-8 border-0 bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03] rounded-3xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8">
                  <div className={`w-full h-full rounded-3xl bg-gradient-to-r ${feature.gradient}`}></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6 mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl bg-gradient-to-r ${feature.gradient} group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl mb-3 text-gray-800 group-hover:text-gray-900 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Included in Pro</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-100">
              <h4 className="text-2xl font-bold text-gray-800 mb-4">
                Semua Fitur di Atas Menunggu Anda! 🎯
              </h4>
              <p className="text-gray-600 mb-6 text-lg">
                Bergabunglah dengan ribuan pengguna yang sudah merasakan perbedaannya
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleUpgrade("lifetime")}>
                  <Crown className="mr-2 h-5 w-5" />
                  Upgrade Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Comparison Matrix: FREE vs PRO - Enhanced */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 mb-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4 text-gray-900">
              📊 Bandingkan Fitur FREE vs PRO
            </h3>
            <p className="text-xl text-gray-600">
              Lihat perbedaan lengkap antara versi gratis dan premium
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* FREE Version */}
            <div className="text-center">
              <div className="bg-gray-100 text-gray-600 font-bold mb-8 text-xl py-4 rounded-2xl">
                FREE VERSION
              </div>
              <ul className="space-y-6 text-left">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Analisis Terbatas</span>
                    <p className="text-sm text-gray-600 mt-1">Maksimal 3x/hari</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Wallet Card Standar</span>
                    <p className="text-sm text-gray-600 mt-1">Tanpa gradient color & tema</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Fitur Premium Terkunci</span>
                    <p className="text-sm text-gray-600 mt-1">Tabungan, Budget, Hutang-Piutang, Aset</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">10</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Kategori Terbatas</span>
                    <p className="text-sm text-gray-600 mt-1">Maksimal 10 kategori total</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Sinkronisasi Multi-device</span>
                    <p className="text-sm text-gray-600 mt-1">Multi-device realtime     </p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* PRO Version */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold mb-8 text-xl py-4 rounded-2xl shadow-lg">
                PRO VERSION
              </div>
              <ul className="space-y-6 text-left">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Analisis Unlimited</span>
                    <p className="text-sm text-gray-600 mt-1">Tanpa batas waktu & frekuensi</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Palette className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Wallet Card Premium</span>
                    <p className="text-sm text-gray-600 mt-1">20+ tema gradient & dark mode</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Star className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Semua Fitur Premium</span>
                    <p className="text-sm text-gray-600 mt-1">Tabungan, Budget, Hutang-Piutang, Aset</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">∞</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Kategori Unlimited</span>
                    <p className="text-sm text-gray-600 mt-1">Buat kategori sebanyak yang dibutuhkan</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Sinkronisasi Multi-device </span>
                    <p className="text-sm text-gray-600 mt-1">Multi-device penuh </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testimonials - Completely Redesigned */}
        <div className="mb-24 relative">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-gray-900">
              💬 Kata Mereka yang Sudah Pro
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Lihat bagaimana fitur Pro membantu pengguna lain mencapai tujuan finansial mereka
            </p>
          </div>
          
          {/* Hero Testimonial */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-12 rounded-3xl shadow-2xl border-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    R
                  </div>
                  <div>
                    <div className="font-bold text-2xl">Rani Septiani</div>
                    <div className="text-lg text-blue-100">Mahasiswa</div>
                    <div className="flex text-yellow-300 text-xl mt-2">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                </div>
                <blockquote className="text-2xl leading-relaxed italic">
                  "Sejak pakai fitur anggaran, pengeluaran bulanan turun 30%! Sekarang bisa nabung buat wisuda tanpa minta ortu lagi 🎓"
                </blockquote>
              </div>
            </Card>
          </div>
          
          {/* Grid Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.slice(1).map((testimonial, index) => (
              <Card key={index} className="group p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 hover:border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-3xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-800">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{testimonial.role}</div>
                      <div className="flex text-yellow-400 text-base">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-blue-400">
                    <p className="text-gray-700 leading-relaxed text-base italic">"{testimonial.text}"</p>
                  </div>
                  
                  {/* Success badge */}
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verified Success Story</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
         
        </div>

        {/* FAQ Section - Enhanced */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 mb-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4 text-gray-900">
              ❓ Frequently Asked Questions
            </h3>
            <p className="text-xl text-gray-600">
              Jawaban untuk pertanyaan yang sering ditanyakan
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="bg-blue-50 rounded-2xl p-6">
                <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">?</span>
                  </div>
                  Apakah bisa downgrade?
                </h4>
                <p className="text-gray-700 leading-relaxed">Bisa kapan saja (kecuali Lifetime yang sudah dibayar). Fitur Pro akan terkunci tapi data tetap aman dan bisa diakses.</p>
              </div>
              
              <div className="bg-green-50 rounded-2xl p-6">
                <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">?</span>
                  </div>
                  Apakah data saya hilang kalau berhenti Pro?
                </h4>
                <p className="text-gray-700 leading-relaxed">Data tetap ada dan aman. Hanya fitur Pro yang akan terkunci, data keuangan kamu tetap bisa diakses dengan fitur dasar.</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-orange-50 rounded-2xl p-6">
                <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">?</span>
                  </div>
                  Metode pembayaran?
                </h4>
                <p className="text-gray-700 leading-relaxed">Kartu kredit/debit, e-wallet (OVO, GoPay, DANA), dan virtual account. Biaya transaksi ditanggung kami!</p>
              </div>
              
              <div className="bg-purple-50 rounded-2xl p-6">
                <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">?</span>
                  </div>
                  Apakah ada garansi uang kembali?
                </h4>
                <p className="text-gray-700 leading-relaxed">Ya! 7 hari pertama untuk paket Tahunan & Lifetime. No questions asked, refund 100%.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-3xl p-16 text-white shadow-2xl mb-12 relative overflow-hidden">
          <h3 className="text-3xl font-bold mb-4">Siap Kelola Keuangan Lebih Baik? �</h3>
          <p className="text-orange-100 mb-12 text-2xl leading-relaxed">
            Gabung dengan 50,000+ pengguna yang sudah merasakan hidup lebih tenang dengan keuangan yang teratur. 
            Mulai hari ini juga!
          </p>
          
          <div className="flex gap-6 justify-center flex-wrap mb-8">
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-300 text-xl px-12 py-6 shadow-2xl transform hover:scale-110 transition-all duration-300 rounded-2xl font-bold animate-pulse"
              onClick={() => handleUpgrade("lifetime")}
              size="lg">
              <Gift className="mr-3 h-6 w-6" />
              <span>AMBIL LIFETIME SEKARANG!</span>
            </Button>
            <Button
              className="bg-white text-orange-600 hover:bg-orange-50 text-xl px-10 py-6 shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl font-bold"
              onClick={() => handleUpgrade("yearly")}
              size="lg">
              <TrendingUp className="mr-3 h-6 w-6" />
              <span>Pilih Tahunan</span>
            </Button>
           
          </div>
          
          <div className="flex items-center justify-center gap-8 text-orange-100 text-lg flex-wrap">
            💳 Semua metode pembayaran • 🔒 Data 100% aman  • 🎯 Garansi 7 hari
          </div>
        </div>

        {/* Desktop Footer dengan tombol tetap gratis - Enhanced */}
        <div className="max-w-xl mx-auto text-center">
          <Button
            variant="ghost"
            className="w-full h-14 border-2 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-2xl text-lg font-medium transition-all duration-300"
            onClick={handleStayFree}>
            Tetap Gunakan Versi Gratis
          </Button>
          <p className="text-gray-500 mt-6 leading-relaxed">
            Versi gratis memiliki batasan: maksimum 10 kategori dan fitur
            premium tidak tersedia. Upgrade kapan saja untuk akses penuh.
          </p>
        </div>
        </div>
      </div>
    </Layout>
  );
}
