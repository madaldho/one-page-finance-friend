import React from "react";
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

  const handleUpgrade = (plan: string) => {
    // Melacak peristiwa AddToCart di Meta Pixel
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: plan === "pro_6m" ? "Pro 6 Bulan" : "Pro 12 Bulan",
          content_type: 'product',
          content_ids: [plan],
          value: plan === "pro_6m" ? 99000 : 150000,
          currency: 'IDR',
        });
      }
    } catch (error) {
      console.error("Error tracking AddToCart event:", error);
    }
    
    // Redirect ke halaman pembelian
    const purchaseUrl = "https://beli.keuanganpribadi.web.id/";
    window.open(purchaseUrl, "_blank");
  };

  // Fungsi untuk kembali ke halaman home
  const handleStayFree = () => {
    navigate("/home");
  };

  const benefits = [
    {
      icon: <Palette className="h-5 w-5 text-white" />,
      title: "Custom Tampilan",
      description:
        "Personalisasi tema aplikasi dengan pilihan warna gradient premium",
    },
    {
      icon: <Bookmark className="h-5 w-5 text-white" />,
      title: "Anggaran dan katgeori tanpa batas",
      description:
        "Buat anggaran untuk kategori tanpa batas dan atur sesuai kebutuhan",
    },
    {
      icon: <CreditCard className="h-5 w-5 text-white" />,
      title: "Hutang & Piutang",
      description: "Pantau dan kelola semua transaksi hutang dan piutang",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-white" />,
      title: "Analisis Lengkap",
      description: "Akses tak terbatas ke fitur analisis keuangan mendalam",
    },
    {
      icon: <PiggyBank className="h-5 w-5 text-white" />,
      title: "Tabungan Tanpa Batas",
      description: "Buat dan kelola target tabungan tanpa batasan jumlah",
    },
    {
      icon: <Building className="h-5 w-5 text-white" />,
      title: "Aset & Kekayaan",
      description: "Lacak pertumbuhan aset dan kekayaan Anda setiap waktu",
    }
  ];

  const testimonials = [
    {
      name: "Rizky",
      text: "Upgrade ke Pro sangat membantu perencanaan keuangan saya. Fitur tabungan dan anggaran memudahkan saya mengatur keuangan bulanan.",
    },
    {
      name: "Siti Nurhayati",
      text: "Fitur analisis di versi Pro menunjukkan dengan jelas dimana uang saya terpakai. Sekarang saya bisa lebih bijak dalam belanja.",
    },
  ];

  return (
    <Layout>
      {/* Mobile view */}
      <div className="md:hidden min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 pt-4 pb-24">
        {/* Header with back button */}
        <div className="px-4 mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-gray-600 hover:bg-white/50 rounded-full p-2"
            onClick={handleStayFree}>
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Kembali</span>
          </Button>
        </div>

        {/* Logo and Description */}
        <div className="px-6 text-center mb-8">
          <h1 className="text-2xl font-bold mb-1 inline-flex items-center">
            Keuangan Pribadi{" "}
            <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm rounded-md">
              Pro
            </span>
          </h1>
          <p className="text-gray-600 text-sm">
            Kelola keuangan pribadi makin mudah dengan fitur Pro lengkap
          </p>
        </div>

        {/* Pricing Options */}
        <div className="px-6 space-y-3 mb-10">
          <div
            className="bg-white p-4 rounded-xl shadow-sm border-2 border-amber-200 relative overflow-hidden transform transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            onClick={() => handleUpgrade("pro_12m")}>
            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
              <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold py-0.5 right-[-35px] top-[12px] w-[85px] text-center shadow-sm">
                HEMAT
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Pro 12 Bulan</h3>
                <p className="text-xs text-gray-500">
                  <s>Rp 300.000</s>
                </p>
              </div>
              <div className="text-right pr-2">
                <p className="font-bold">Rp 150.000</p>
                <p className="text-xs text-amber-600">Rp 12.500/bulan</p>
              </div>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-200 transform transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            onClick={() => handleUpgrade("pro_6m")}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Pro 6 Bulan</h3>
                <p className="text-xs text-gray-500"></p>
              </div>
              <div className="text-right">
                <p className="font-bold">Rp 99.000</p>
                <p className="text-xs text-gray-500">Rp 16.500/bulan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="px-6 mb-8">
          {benefits.slice(0, 4).map((benefit, index) => (
            <div key={index} className="flex items-center mb-5">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2 mr-3">
                {benefit.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm">{benefit.title}</h3>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 mt-6">
          <p className="text-xs text-gray-500 mb-4 text-center">
            Perpanjangan diproses 1x24 jam, Harga sudah termasuk semua fitur
            tanpa batasan.
          </p>
          <Button
            variant="outline"
            className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl py-2.5"
            onClick={handleStayFree}>
            Tetap Gunakan Versi Gratis
          </Button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block container max-w-6xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            className="rounded-full hover:bg-white/80 h-9 w-9 p-0"
            onClick={handleStayFree}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">Kembali ke Home</span>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-800 border-0 rounded-full px-3 py-1 mb-4">
            <Star className="h-3.5 w-3.5 mr-1" /> Upgrade ke Pro
          </Badge>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Tingkatkan Pengalaman Keuangan Anda
          </h1>
          <p className="text-gray-600 text-lg">
            Akses semua fitur premium untuk kontrol keuangan yang lebih baik dan
            analisa yang lebih mendalam.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {/* Pro 12 Bulan */}
          <Card className="overflow-hidden border-2 border-amber-200 h-full bg-gradient-to-br from-amber-50 to-amber-100/40 relative transform transition-all duration-200 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden">
              <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold py-0.5 right-[-30px] top-[15px] w-[100px] md:w-[140px] md:py-1 md:right-[-40px] md:top-[20px] text-center shadow-md">
                POPULER
              </div>
            </div>

            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-lg">Pro 12 Bulan</h3>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">Rp150.000</span>
                <span className="text-gray-500 ml-1.5">/tahun</span>
                <div className="mt-1.5 space-x-2">
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                    HEMAT 25%
                  </Badge>
                  <span className="text-amber-600 font-medium text-sm">
                    Rp12.500/bulan
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                onClick={() => handleUpgrade("pro_12m")}
                size="lg">
                <span>Pilih Paket Ini</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 pt-4 border-t border-amber-200/50">
              <div className="text-sm text-amber-700 mb-4">
                Pesan sekarang untuk mendapatkan akses selama 1 tahun penuh
                dengan harga terbaik!
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm">
                    Hemat 25% dibandingkan pembayaran 6 bulan
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm">
                    Akses semua fitur premium tanpa batas
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm">
                    Update fitur baru selama 1 tahun
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Pro 6 Bulan */}
          <Card className="overflow-hidden border-2 border-gray-200 h-full bg-white relative transform transition-all duration-200 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden">
              <div className="absolute transform rotate-45 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold py-0.5 right-[-30px] top-[12px] w-[100px] md:w-[120px] md:py-1 md:right-[-35px] md:top-[12px] text-center shadow-md">
                HEMAT
              </div>
            </div>
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-lg">Pro 6 Bulan</h3>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">Rp99.000</span>
                <span className="text-gray-500 ml-1.5">/6 bulan</span>
                <div className="mt-1.5">
                  <span className="text-gray-500 text-sm">Rp16.500/bulan</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 text-blue-700"
                onClick={() => handleUpgrade("pro_6m")}
                size="lg">
                <span>Pilih Paket Ini</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-4">
                Akses semua fitur Pro selama 6 bulan dengan harga terjangkau!
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm">
                    Akses semua fitur premium tanpa batas
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm">
                    Update fitur baru selama 6 bulan
                  </span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            Semua Fitur Pro yang Anda Dapatkan
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="h-full p-5 border hover:border-amber-200 hover:shadow-md transition-all transform hover:scale-[1.02]">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-1.5">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 p-8 rounded-xl">
            <h2 className="text-xl font-bold mb-3">Siap untuk Upgrade?</h2>
            <p className="text-gray-600 mb-5">
              Mulai kelola keuangan Anda dengan lebih efektif. Tingkatkan ke Pro
              sekarang dan nikmati semua fitur premium!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                onClick={() => handleUpgrade("pro_12m")}
                size="lg">
                <span>Upgrade ke Pro 12 Bulan</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-white/80"
                onClick={handleStayFree}>
                Kembali
              </Button>
            </div>
          </div>

          {/* Desktop Footer dengan tombol tetap gratis */}
          <div className="mt-8 max-w-md mx-auto">
            <Button
              variant="ghost"
              className="w-full h-12 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={handleStayFree}>
              Tetap Gunakan Versi Gratis
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Versi gratis memiliki batasan: maksimum 10 kategori dan fitur
              premium tidak tersedia.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
