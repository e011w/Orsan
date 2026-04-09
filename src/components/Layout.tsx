import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, Bell, Check, MessageSquare, Package, CheckCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from './NotificationProvider';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: ClipboardList, label: 'طلباتي', path: '/orders' },
    { icon: User, label: 'حسابي', path: '/profile' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'new_order': return <Package className="w-4 h-4 text-gold" />;
      case 'status_update': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-3 flex items-center justify-between shadow-xl border-b border-gold/10">
        <div className="flex items-center gap-3">
          <Logo variant="light" className="scale-90 origin-right" />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors relative group"
          >
            <Bell className={cn("w-5 h-5 transition-transform duration-300", showNotifications ? "scale-110" : "group-hover:rotate-12")} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-left"
                >
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-black-soft">الإشعارات</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllAsRead()}
                        className="text-[10px] font-bold text-gold hover:underline"
                      >
                        تحديد الكل كمقروء
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              if (notif.orderId) navigate(`/orders/${notif.orderId}`);
                              setShowNotifications(false);
                            }}
                            className={cn(
                              "p-4 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50",
                              !notif.read && "bg-gold/5"
                            )}
                          >
                            <div className="mt-1">{getIcon(notif.type)}</div>
                            <div className="flex-1 space-y-1">
                              <p className={cn("text-sm", !notif.read ? "font-bold text-black" : "text-gray-600")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-2">{notif.body}</p>
                              <p className="text-[10px] text-gray-300">
                                {notif.createdAt && (notif.createdAt as any).toDate ? (notif.createdAt as any).toDate().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                              </p>
                            </div>
                            {!notif.read && <div className="w-2 h-2 bg-gold rounded-full mt-2" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center space-y-2">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto" />
                        <p className="text-sm text-gray-400">لا توجد إشعارات حالياً</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
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
