import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Headphones } from 'lucide-react';

export default function Layout() {
  const { pathname } = useLocation();
  const showPageLogo = pathname !== '/' && !pathname.startsWith('/call/');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {showPageLogo && (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              aria-label="Call Flow AI home"
              className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0029FF] text-white shadow-md shadow-blue-500/20">
                <Headphones className="h-5 w-5" />
              </span>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Call Flow <span className="text-[#2F6BFF]">AI</span>
              </span>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
