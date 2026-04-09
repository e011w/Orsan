import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { UserProfile, AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  ChevronLeft,
  Settings,
  Bell,
  MessageCircle,
  Info,
  Edit2,
  Save,
  X,
  Lock,
  Loader2,
  Facebook,
  Instagram,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { toast } from 'sonner';

interface ProfileProps {
  profile: UserProfile | null;
}

export default function Profile({ profile }: ProfileProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
        if (settingsDoc.exists()) {
          setAppSettings(settingsDoc.data() as AppSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleLogout = () => {
    signOut(auth);
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser || !profile) return;
    setLoading(true);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      });

      // Update Firestore
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: formData.displayName,
        phone: formData.phone
      });

      toast.success('تم تحديث البيانات بنجاح');
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      
      if (isGoogleUser) {
        toast.error('حسابات جوجل لا تدعم تغيير كلمة المرور من هنا. يرجى تغييرها من إعدادات حساب جوجل الخاص بك.');
        return;
      }

      // Re-authenticate (required for password change)
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, passwordData.newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور الحالية غير صحيحة');
      } else {
        toast.error('حدث خطأ أثناء تغيير كلمة المرور');
      }
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: Bell, label: 'الإشعارات', path: '/notifications' },
    { icon: MessageCircle, label: 'تواصل معنا', onClick: () => setShowContact(!showContact) },
    { icon: Info, label: 'من نحن', onClick: () => setShowAbout(true) },
    { icon: Shield, label: 'الخصوصية والأمان', path: '/privacy' },
  ];

  if (profile?.role === 'admin') {
    menuItems.unshift({ icon: Settings, label: 'لوحة التحكم', path: '/admin' });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-md mx-auto pb-10"
    >
      <div className="flex flex-col items-center gap-6 py-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gold/5 blur-3xl rounded-full -z-10" />
        
        <div className="relative group">
          <div className="w-32 h-32 rounded-[2.5rem] gold-gradient p-1.5 shadow-[0_10px_30px_rgba(212,175,55,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <div className="w-full h-full rounded-[2.2rem] bg-black flex items-center justify-center text-white text-5xl font-bold">
              {profile?.displayName?.[0] || 'أ'}
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute -bottom-2 -left-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-all border border-gray-100"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-4 px-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 pr-2">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  <Input 
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="pr-12 h-12 rounded-2xl"
                    placeholder="الاسم"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 pr-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pr-12 h-12 rounded-2xl"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={loading}
                  className="flex-1 h-12 rounded-2xl font-bold gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التغييرات
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="h-12 rounded-2xl font-bold gap-2"
                >
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Button>
              </div>

              {isChangingPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-4 border-t border-gray-100"
                >
                  <Input 
                    type="password"
                    placeholder="كلمة المرور الحالية"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                  <Input 
                    type="password"
                    placeholder="كلمة المرور الجديدة"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                  <Input 
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                  <Button 
                    onClick={handleChangePassword}
                    disabled={loading}
                    variant="secondary"
                    className="w-full h-11 rounded-xl font-bold"
                  >
                    تحديث كلمة المرور
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="profile-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-1"
            >
              <h2 className="text-3xl font-bold text-black-soft tracking-tight">{profile?.displayName || 'مستخدم أورسان'}</h2>
              <p className="text-gray-400 font-medium">{profile?.email}</p>
              {profile?.phone && <p className="text-gold font-bold text-sm">{profile.phone}</p>}
              <div className="flex justify-center gap-2 pt-4">
                <span className="px-4 py-1.5 bg-gold/10 text-gold text-xs font-bold rounded-full border border-gold/20 shadow-sm uppercase tracking-widest">
                  {profile?.role === 'admin' ? 'مدير النظام' : 'عميل مميز'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <Card className="p-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <motion.button 
                  whileHover={{ x: -4 }}
                  onClick={() => item.path ? navigate(item.path) : item.onClick?.()}
                  className={`w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-all group ${index < menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gold/10 group-hover:text-gold transition-all shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-black-soft transition-colors">{item.label}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <ChevronLeft className={cn("w-5 h-5 text-gray-300 group-hover:text-gold transition-all", item.label === 'تواصل معنا' && showContact && "-rotate-90")} />
                  </div>
                </motion.button>
                
                {item.label === 'تواصل معنا' && (
                  <AnimatePresence>
                    {showContact && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50/50"
                      >
                        <div className="grid grid-cols-4 gap-4 p-6">
                          {appSettings?.whatsapp && (
                            <a href={`https://wa.me/${appSettings.whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-500">واتساب</span>
                            </a>
                          )}
                          {appSettings?.facebook && (
                            <a href={appSettings.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                <Facebook className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-500">فيسبوك</span>
                            </a>
                          )}
                          {appSettings?.instagram && (
                            <a href={appSettings.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                              <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/20 group-hover:scale-110 transition-transform">
                                <Instagram className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-500">انستاجرام</span>
                            </a>
                          )}
                          {appSettings?.phone && (
                            <a href={`tel:${appSettings.phone}`} className="flex flex-col items-center gap-2 group">
                              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                                <Phone className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-500">اتصال</span>
                            </a>
                          )}
                        </div>
                        {appSettings?.location && (
                          <div className="px-6 pb-6 flex items-center gap-3 text-xs text-gray-500">
                            <MapPin className="w-4 h-4 text-gold" />
                            <span className="font-medium">{appSettings.location}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
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

      {/* About Us Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16" />
              
              <div className="relative space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Info className="w-6 h-6" />
                  </div>
                  <button onClick={() => setShowAbout(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-black-soft">من نحن</h3>
                  <div className="h-1 w-12 bg-gold rounded-full" />
                </div>

                <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {appSettings?.aboutText || 'تطبيق أورسان للخدمات الفنية والمقاولات، نسعى لتقديم أفضل الحلول المتكاملة لعملائنا بأعلى معايير الجودة والاحترافية.'}
                </div>

                <Button onClick={() => setShowAbout(false)} className="w-full h-14 rounded-2xl font-bold">
                  إغلاق
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
