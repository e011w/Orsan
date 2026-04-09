import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, User, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: ClipboardList, label: 'طلباتي', path: '/orders' },
    { icon: User, label: 'حسابي', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-3 flex items-center justify-between shadow-xl border-b border-gold/10">
        <div className="flex items-center gap-3">
          <Logo variant="light" className="scale-90 origin-right" />
          <div className="h-6 w-[1px] bg-gold/20 mx-1" />
          <span className="text-xs font-bold tracking-widest text-gold/80 uppercase">Premium</span>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors group">
          <Settings className="w-5 h-5 text-gold group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-md mx-auto px-4 pt-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 transition-all duration-200',
                isActive ? 'text-gold scale-110' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'fill-gold/20')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
