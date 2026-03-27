import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { PWANotifications } from './PWANotifications';
import { BrandLogo } from './BrandLogo';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/petitions', label: 'Campanhas', icon: FileText },
    { path: '/tasks', label: 'Tarefas', icon: CheckCircle },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PWANotifications />

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <BrandLogo dark={theme === 'dark'} className="w-[164px]" />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-600 dark:text-blue-300">
                Painel administrativo
              </p>
              <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                Gestão de campanhas, assinaturas e equipes.
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
            Tudo em um só lugar para operar mobilizações do AssinaPovo.
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200',
                isActive(item.path)
                  ? 'border-r-4 border-blue-700 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              )}
            >
              <item.icon size={20} className="mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="lg:pl-64">
        <div className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu size={24} />
              </button>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  AssinaPovo Admin
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Operação das campanhas e assinaturas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Users size={16} />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                title="Sair do sistema"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};
