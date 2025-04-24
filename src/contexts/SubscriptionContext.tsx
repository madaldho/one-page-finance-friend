import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SubscriptionType = "free" | "pro_6m" | "pro_12m" | null;

interface UserSubscription {
  type: SubscriptionType;
  trialStart: string | null;
  trialEnd: string | null;
  daysRemaining: number | null;
  isActive: boolean;
  isPro: boolean;
  lastChecked: Date;
}

interface SubscriptionContextType {
  subscription: UserSubscription;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  updateLocalSubscription: (type: SubscriptionType, trialStart?: string, trialEnd?: string) => void;
}

const defaultSubscription: UserSubscription = {
  type: null,
  trialStart: null,
  trialEnd: null,
  daysRemaining: null,
  isActive: false,
  isPro: false,
  lastChecked: new Date(),
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription>(defaultSubscription);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Cek status langganan pada mount dan ketika user berubah
  useEffect(() => {
    checkSubscription();
  }, []);

  const calculateDaysRemaining = (endDate: string | null): number | null => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset jam untuk perhitungan hari yang lebih akurat
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return Math.max(0, days);
  };

  const checkSubscription = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Dapatkan user saat ini
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(defaultSubscription);
        return;
      }
      
      // Dapatkan profil user
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_type, trial_start, trial_end")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      
      const type = profile?.subscription_type as SubscriptionType || "free";
      const trialStart = profile?.trial_start;
      const trialEnd = profile?.trial_end;
      const daysRemaining = calculateDaysRemaining(trialEnd);
      
      // Periksa apakah langganan aktif (Pro atau trial masih berlaku)
      const isPro = type === "pro_6m" || type === "pro_12m";
      const isActive = isPro || (daysRemaining !== null && daysRemaining > 0);
      
      setSubscription({
        type,
        trialStart,
        trialEnd,
        daysRemaining,
        isActive,
        isPro,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      // Jika terjadi error, tetap set default
      setSubscription({
        ...defaultSubscription,
        lastChecked: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalSubscription = (
    type: SubscriptionType,
    trialStart?: string,
    trialEnd?: string
  ): void => {
    const updatedSubscription = {
      type,
      trialStart: trialStart || subscription.trialStart,
      trialEnd: trialEnd || subscription.trialEnd,
      daysRemaining: calculateDaysRemaining(trialEnd || subscription.trialEnd),
      isActive: type === "pro_6m" || type === "pro_12m" || false,
      isPro: type === "pro_6m" || type === "pro_12m",
      lastChecked: new Date(),
    };
    
    setSubscription(updatedSubscription);
    
    toast({
      title: "Status langganan diperbarui",
      description: `Langganan Anda sekarang ${type === "free" ? "Free" : type === "pro_6m" ? "Pro 6 Bulan" : "Pro 12 Bulan"}`,
    });
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        checkSubscription,
        updateLocalSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  
  return context;
}; 