import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '../common/AnnouncementBar';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { ConnectionStatusBanner } from '../common/ConnectionStatusBanner';
import { CartDrawer } from '../cart/CartDrawer';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-warm text-charcoal-900 selection:bg-brand-500 selection:text-white">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <ConnectionStatusBanner />
    </div>
  );
};
