import React from 'react';
import Header from './Header';
import { SidebarMenu } from './SidebarMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <aside className="fixed w-64 h-screen bg-white border-r">
          <SidebarMenu />
        </aside>
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
