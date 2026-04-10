import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogIn, Mail, Lock, User, ArrowLeft, ArrowRight, Info, Sparkles, ShieldCheck, Phone } from 'lucide-react';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError('حدث خطأ أثناء تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        if (!displayName) throw new Error('يرجى إدخال الاسم');
        if (!phone) throw new Error('يرجى إدخال رقم الهاتف');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Save full user profile to Firestore to satisfy security rules
        const isAdminEmail = email.toLowerCase() === 'msdan07@gmail.com' || 
                           email.toLowerCase() === 'studentforum9019@gmail.com' || 
                           email.toLowerCase() === 'mohammed@gmail.com';
                           
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          phone: phone,
          role: isAdminEmail ? 'admin' : 'customer',
          createdAt: serverTimestamp()
        });
        
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'حدث خطأ. يرجى التأكد من البيانات والمحاولة مرة أخرى.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل. هل تريد تسجيل الدخول بدلاً من ذلك؟';
      }
      if (err.code === 'auth/invalid-email') msg = 'البريد الإلكتروني غير صالح.';
      if (err.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة جداً.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      if (err.code === 'auth/operation-not-allowed') msg = 'طريقة تسجيل الدخول هذه غير مفعلة في إعدادات Firebase. يرجى تفعيل "Email/Password" من لوحة تحكم Firebase.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Side: Atmospheric Branding (Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-gold/20" />
          
          {/* Animated Atmospheric Glows */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" 
          />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-lg">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block p-6 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <Logo variant="light" className="scale-[2] mx-auto" />
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl font-bold text-white tracking-tight leading-tight"
            >
              التميز في عالم <br />
              <span className="text-gold">الخدمات الفاخرة</span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-gray-400 text-lg font-light leading-relaxed"
            >
              نحن هنا لنحول رؤيتك إلى واقع ملموس بأعلى معايير الجودة والاحترافية في المقاولات والديكور.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-8 pt-8"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-[10px] uppercase tracking-widest text-gold/60">مشروع منجز</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-[10px] uppercase tracking-widest text-gold/60">رضا العملاء</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-gold/60">دعم فني</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12">
          <Logo variant="light" className="scale-125" />
        </div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-right space-y-2">
            <h2 className="text-3xl font-bold text-white">
              {isForgotPassword ? 'استعادة الوصول' : (isSignUp ? 'انضم إلينا' : 'تسجيل الدخول')}
            </h2>
            <p className="text-gray-500 font-light">
              {isForgotPassword 
                ? 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور' 
                : (isSignUp ? 'ابدأ رحلتك مع خدماتنا المتميزة اليوم' : 'مرحباً بعودتك، يرجى إدخال بياناتك')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/5 rounded-full blur-[60px]" />
            
            <form onSubmit={handleEmailAuth} className="space-y-5 relative z-10">
              <AnimatePresence mode="wait">
                {isSignUp && !isForgotPassword && (
                  <motion.div 
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-widest">الاسم الكامل</label>
                      <div className="relative group">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors w-5 h-5" />
                        <Input
                          placeholder="أدخل اسمك الكامل"
                          className="pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-gold/50 focus:ring-gold/10 rounded-2xl transition-all"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
                      <div className="relative group">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors w-5 h-5" />
                        <Input
                          type="tel"
                          placeholder="05xxxxxxxx"
                          className="pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-gold/50 focus:ring-gold/10 rounded-2xl transition-all text-left"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="example@mail.com"
                    className="pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-gold/50 focus:ring-gold/10 rounded-2xl transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">كلمة المرور</label>
                    {!isSignUp && (
                      <button 
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[10px] text-gold/60 hover:text-gold transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors w-5 h-5" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-gold/50 focus:ring-gold/10 rounded-2xl transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 gold-gradient text-black font-bold text-lg rounded-2xl shadow-xl shadow-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <>
                    {isForgotPassword ? 'إرسال رابط الاستعادة' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول')}
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {!isForgotPassword && (
              <div className="mt-8 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]"><span className="bg-[#0c0c0c] px-4 text-gray-600">أو عبر</span></div>
                </div>

                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                  variant="outline"
                  className="w-full h-14 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 group transition-all"
                >
                  <LogIn className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                  <span className="font-medium">المتابعة باستخدام جوجل</span>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-gray-500 hover:text-gold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isForgotPassword ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </>
              ) : isSignUp ? (
                <>
                  لديك حساب بالفعل؟ <span className="text-gold font-bold">سجل دخولك</span>
                </>
              ) : (
                <>
                  ليس لديك حساب؟ <span className="text-gold font-bold">أنشئ حساباً جديداً</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center flex flex-col gap-2"
              >
                <span>{error}</span>
                {error.includes('مسجل بالفعل') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                    }}
                    className="text-gold font-bold hover:underline underline-offset-4"
                  >
                    اضغط هنا لتسجيل الدخول
                  </button>
                )}
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm text-center flex items-center justify-center gap-2"
              >
                <Info className="w-4 h-4" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="absolute bottom-8 text-[10px] text-gray-700 uppercase tracking-widest">
          &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
