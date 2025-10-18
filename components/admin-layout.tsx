'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { Home, Plus, Settings, LogOut, Video, Menu, Plug } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useModal } from '@/contexts/modal-context';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard', isLink: true },
  { action: 'openModal', icon: Plus, label: 'Adicionar Vídeo', isLink: false },
  { href: '/admin/api-config', icon: Plug, label: 'Config API', isLink: true },
  { href: '/admin/settings', icon: Settings, label: 'Configuração', isLink: true },
];

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { openAddVideoModal } = useModal();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col gap-4 bg-[#0a0a0a] border-r border-border/50', className)}
    >
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Video Platform</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = item.isLink && pathname === item.href;
          const Icon = item.icon;

          const content = (
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.div>
          );

          if (item.isLink) {
            return (
              <Link key={item.href} href={item.href!}>
                {content}
              </Link>
            );
          } else {
            return (
              <button
                key={index}
                onClick={openAddVideoModal}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          }
        })}
      </nav>
    </motion.aside>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [session, setSession] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const userSession = getSession();
    if (!userSession) {
      router.push('/admin/login');
    } else {
      setSession(userSession);
    }
  }, [router]);

  const handleSignOut = () => {
    clearSession();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar className="hidden lg:flex w-64 fixed inset-y-0 z-50" />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80 border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-white">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 bg-[#0a0a0a]">
                  <Sidebar className="w-full h-full border-0" />
                </SheetContent>
              </Sheet>

              <h1 className="text-xl font-bold text-white hidden sm:block">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hidden sm:flex">
                <span className="w-2 h-2 rounded-full bg-[#10b981] mr-2 animate-pulse" />
                Online
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-[#8b5cf6]">
                      <AvatarFallback className="bg-[#8b5cf6] text-white">
                        {session?.email?.[0].toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-border/50">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="text-white font-medium">Admin</p>
                    <p className="text-gray-400 text-xs">{session?.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
