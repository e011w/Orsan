import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  ChevronLeft,
  Settings,
  Bell,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  profile: UserProfile | null;
}

export default function Profile({ profile }: ProfileProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    signOut(auth);
  };

  const menuItems = [
    { icon: Bell, label: 'الإشعارات', path: '/notifications' },
    { icon: CreditCard, label: 'طرق الدفع', path: '/payments' },
    { icon: HelpCircle, label: 'مركز المساعدة', path: '/help' },
    { icon: Shield, label: 'الخصوصية والأمان', path: '/privacy' },
  ];

  if (profile?.role === 'admin') {
    menuItems.unshift({ icon: Settings, label: 'لوحة التحكم', path: '/admin' });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-md mx-auto"
    >
      <div className="flex flex-col items-center gap-6 py-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gold/5 blur-3xl rounded-full -z-10" />
        <div className="w-32 h-32 rounded-[2.5rem] gold-gradient p-1.5 shadow-[0_10px_30px_rgba(212,175,55,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="w-full h-full rounded-[2.2rem] bg-black flex items-center justify-center text-white text-5xl font-bold">
            {profile?.displayName?.[0] || 'أ'}
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-bold text-black-soft tracking-tight">{profile?.displayName || 'مستخدم أورسان'}</h2>
          <p className="text-gray-400 font-medium">{profile?.email}</p>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-1.5 bg-gold/10 text-gold text-xs font-bold rounded-full border border-gold/20 shadow-sm uppercase tracking-widest">
            {profile?.role === 'admin' ? 'مدير النظام' : 'عميل مميز'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button 
                key={item.label}
                whileHover={{ x: -4 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-all group ${index < menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gold/10 group-hover:text-gold transition-all shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-black-soft transition-colors">{item.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-gold transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </Card>

        <Button 
          variant="ghost" 
          className="w-full py-6 text-red-500 hover:bg-red-50 hover:text-red-600 gap-3 rounded-2xl font-bold transition-all"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </Button>
      </div>

      <div className="text-center text-gray-300 text-xs pb-8 font-medium">
        إصدار التطبيق 1.0.0 &bull; أورسان بريميوم
      </div>
    </motion.div>
  );
}
