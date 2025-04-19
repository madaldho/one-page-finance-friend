import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ChevronDown, LogOut, User, Settings as SettingsIcon, BarChart2, MoreVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Particle {
  x: number;
  y: number;
  size: number;
  velocity: {
    x: number;
    y: number;
  };
  life: number;
  maxLife: number;
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();

    const particleCount = 100;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      velocity: {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
      },
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 50,
    }));

    const animate = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.life += 1;
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }

        const opacity = Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.08;

        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-75" />;
}

const Header = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileName, setProfileName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("Kelola keuangan Anda dengan mudah");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setProfileName(data.name || user.email || 'User');
          setAvatarUrl(data.avatar_url || "");
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Gagal Memuat Profil",
          description: "Terjadi kesalahan saat mengambil data profil",
          variant: "destructive"
        });
      }
    };

    fetchProfile();
  }, [user, toast]);

  return (
    <div className="container mx-auto relative mb-6 bg-white p-4 pt-6 rounded-lg shadow-md overflow-hidden ">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-50">
        <ParticleBackground />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#6E59A5] flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg sm:text-2xl font-semibold">
                {profileName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-base sm:text-lg">{profileName}</p>
            <p className="text-sm text-gray-500">Akun Personal</p>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold shimmer-text mb-2">
          Manajemen Keuangan {profileName}
        </h1>

        <p className="text-sm sm:text-base text-gray-600 backdrop-blur-sm bg-white/30 inline-block px-2 py-1 rounded-full">
          {bio}
        </p>
      </div>

      <style>{`
        .shimmer-text {
          --shimmer-color-start: #1e40af;
          --shimmer-color-mid: #60a5fa;
          background: linear-gradient(
            90deg,
            var(--shimmer-color-start) 0%,
            var(--shimmer-color-start) 40%,
            var(--shimmer-color-mid) 50%,
            var(--shimmer-color-start) 60%,
            var(--shimmer-color-start) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 2.5s infinite linear;
        }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
};

export default Header;
