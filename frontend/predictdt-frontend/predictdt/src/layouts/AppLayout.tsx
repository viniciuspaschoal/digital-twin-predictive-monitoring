import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D1117' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 grid-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
