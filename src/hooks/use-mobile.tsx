import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Fungsi untuk memeriksa apakah perangkat adalah mobile berdasarkan user agent
const isMobileUserAgent = () => {
  if (typeof navigator === "undefined") return false;
  
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(
    navigator.userAgent.toLowerCase()
  );
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Gabungkan deteksi berdasarkan ukuran layar dan user agent
    const checkIsMobile = () => {
      const isMobileSize = window.innerWidth < MOBILE_BREAKPOINT;
      const isMobileDevice = isMobileUserAgent();
      return isMobileSize || isMobileDevice;
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(checkIsMobile());
    }
    
    mql.addEventListener("change", onChange);
    setIsMobile(checkIsMobile());
    
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}
