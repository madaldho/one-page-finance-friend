
import { format as fnsFormat, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    return fnsFormat(parseISO(dateString), "dd/MM/yyyy");
  } catch (error) {
    return dateString;
  }
}; 
