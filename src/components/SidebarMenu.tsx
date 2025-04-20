import { NavLink } from 'react-router-dom';
import { Building2, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarMenu() {
  return (
    <div className="space-y-1">
      <NavLink
        to="/loans"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100",
            isActive ? "bg-gray-100 text-primary" : "text-gray-600"
          )
        }
      >
        <CreditCard className="w-4 h-4" />
        Hutang Piutang
      </NavLink>
      
      <NavLink
        to="/assets"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100",
            isActive ? "bg-gray-100 text-primary" : "text-gray-600"
          )
        }
      >
        <Building2 className="w-4 h-4" />
        Aset
      </NavLink>
      
      <NavLink
        to="/home"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100",
            isActive ? "bg-gray-100 text-primary" : "text-gray-600"
          )
        }
      >
        <Wallet className="w-4 h-4" />
        Dompet
      </NavLink>
    </div>
  );
}
