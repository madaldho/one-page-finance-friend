// Modern design tokens and enhanced styling for Finance Friend
export const modernColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export const modernShadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: '0 0 0 1px rgb(59 130 246 / 0.1), 0 0 0 3px rgb(59 130 246 / 0.05)',
  glowSuccess: '0 0 0 1px rgb(34 197 94 / 0.1), 0 0 0 3px rgb(34 197 94 / 0.05)',
  glowDanger: '0 0 0 1px rgb(239 68 68 / 0.1), 0 0 0 3px rgb(239 68 68 / 0.05)'
};

export const modernBorderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px'
};

export const modernSpacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem'
};

// Animation presets
export const modernAnimations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInLeft: 'animate-in slide-in-from-left-2 duration-300',
  slideInRight: 'animate-in slide-in-from-right-2 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin'
};

// Modern component styles
export const modernStyles = {
  card: `
    bg-white rounded-xl shadow-md border border-gray-100
    hover:shadow-lg hover:border-gray-200
    transition-all duration-200 ease-in-out
  `,
  cardInteractive: `
    bg-white rounded-xl shadow-md border border-gray-100
    hover:shadow-lg hover:border-gray-200 hover:scale-[1.02]
    cursor-pointer transition-all duration-200 ease-in-out
    active:scale-[0.98]
  `,
  button: {
    primary: `
      bg-blue-500 hover:bg-blue-600 active:bg-blue-700
      text-white font-medium rounded-lg px-4 py-2
      transition-all duration-150 ease-in-out
      shadow-sm hover:shadow-md
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 active:bg-gray-300
      text-gray-700 font-medium rounded-lg px-4 py-2
      transition-all duration-150 ease-in-out
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
    `,
    success: `
      bg-green-500 hover:bg-green-600 active:bg-green-700
      text-white font-medium rounded-lg px-4 py-2
      transition-all duration-150 ease-in-out
      shadow-sm hover:shadow-md
      focus:ring-2 focus:ring-green-500 focus:ring-offset-2
    `,
    danger: `
      bg-red-500 hover:bg-red-600 active:bg-red-700
      text-white font-medium rounded-lg px-4 py-2
      transition-all duration-150 ease-in-out
      shadow-sm hover:shadow-md
      focus:ring-2 focus:ring-red-500 focus:ring-offset-2
    `
  },
  input: `
    w-full px-3 py-2 rounded-lg border border-gray-300
    focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
    transition-all duration-150 ease-in-out
    placeholder:text-gray-400
  `,
  badge: {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
    primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    danger: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
  }
};

// Gradient presets
export const modernGradients = {
  primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
  success: 'bg-gradient-to-r from-green-500 to-green-600',
  danger: 'bg-gradient-to-r from-red-500 to-red-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
  pink: 'bg-gradient-to-r from-pink-500 to-pink-600',
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  teal: 'bg-gradient-to-r from-teal-500 to-teal-600',
  gray: 'bg-gradient-to-r from-gray-500 to-gray-600',
  background: 'bg-gradient-to-br from-gray-50 to-gray-100',
  subtle: 'bg-gradient-to-r from-gray-50 via-white to-gray-50'
};

// Enhanced utility functions
export const getStatusColor = (status: string) => {
  const statusColors = {
    success: modernColors.success[500],
    warning: modernColors.warning[500],
    danger: modernColors.danger[500],
    info: modernColors.primary[500],
    default: modernColors.gray[500]
  };
  return statusColors[status as keyof typeof statusColors] || statusColors.default;
};

export const getStatusBadgeClass = (status: string) => {
  const statusClasses = {
    success: modernStyles.badge.success,
    warning: modernStyles.badge.warning,
    danger: modernStyles.badge.danger,
    info: modernStyles.badge.primary,
    default: modernStyles.badge.default
  };
  return statusClasses[status as keyof typeof statusClasses] || statusClasses.default;
};

// Modern responsive breakpoints
export const modernBreakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Enhanced typography scale
export const modernTypography = {
  xs: 'text-xs leading-4',
  sm: 'text-sm leading-5',
  base: 'text-base leading-6',
  lg: 'text-lg leading-7',
  xl: 'text-xl leading-7',
  '2xl': 'text-2xl leading-8',
  '3xl': 'text-3xl leading-9',
  '4xl': 'text-4xl leading-10'
};

export default {
  colors: modernColors,
  shadows: modernShadows,
  borderRadius: modernBorderRadius,
  spacing: modernSpacing,
  animations: modernAnimations,
  styles: modernStyles,
  gradients: modernGradients,
  breakpoints: modernBreakpoints,
  typography: modernTypography,
  utils: {
    getStatusColor,
    getStatusBadgeClass
  }
};