import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogIn, Mail, Lock, User, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'حدث خطأ. يرجى التأكد من البيانات والمحاولة مرة أخرى.';
      if (err.code === 'auth/email-already-in-use') msg = 'هذا البريد الإلكتروني مستخدم بالفعل.';
      if (err.code === 'auth/invalid-email') msg = 'البريد الإلكتروني غير صالح.';
      if (err.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة جداً.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      if (err.code === 'auth/operation-not-allowed') msg = 'طريقة تسجيل الدخول هذه غير مفعلة في إعدادات Firebase. يرجى تفعيل "Email/Password" من لوحة تحكم Firebase.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  const fieldVariants = {
    initial: { opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' },
    animate: { opacity: 1, height: 'auto', marginBottom: 16, overflow: 'visible' },
    exit: { opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' },
    transition: { duration: 0.3, ease: "easeInOut" }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="inline-block p-4 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 mb-6 shadow-2xl">
          <Logo variant="light" className="scale-150 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">مرحباً بك في أورسان</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          التميز في خدمات المقاولات والديكور والخدمات المنزلية
        </p>
      </motion.div>

      <motion.div 
        layout
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
      >
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <motion.h2 
            layout
            className="text-2xl font-bold text-white mb-6 text-center"
          >
            {isForgotPassword ? 'استعادة كلمة المرور' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول')}
          </motion.h2>

          <AnimatePresence initial={false}>
            {isSignUp && !isForgotPassword && (
              <motion.div 
                key="name-field"
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative"
              >
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
                <Input
                  placeholder="الاسم الكامل"
                  className="pr-12 bg-gradient-to-br from-gold/5 to-gold-dark/10 border-gold-dark/30 text-white placeholder:text-white/40 focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              className="pr-12 bg-gradient-to-br from-gold/5 to-gold-dark/10 border-gold-dark/30 text-white placeholder:text-white/40 focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          <AnimatePresence initial={false}>
            {!isForgotPassword && (
              <motion.div 
                key="password-field"
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative"
              >
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
                <Input
                  type="password"
                  placeholder="كلمة المرور"
                  className="pr-12 bg-gradient-to-br from-gold/5 to-gold-dark/10 border-gold-dark/30 text-white placeholder:text-white/40 focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isSignUp && !isForgotPassword && (
              <motion.div 
                key="forgot-link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-left"
              >
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-gold hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout>
            <Button 
              type="submit"
              disabled={loading}
              className="w-full py-4 gold-gradient text-black font-bold text-lg rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? 'جاري التحميل...' : (isForgotPassword ? 'إرسال الرابط' : (isSignUp ? 'إنشاء الحساب' : 'دخول'))}
            </Button>
          </motion.div>
        </form>

        <motion.div layout className="mt-8 space-y-6">
          <AnimatePresence initial={false}>
            {!isForgotPassword && (
              <motion.div 
                key="google-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/50 px-2 text-gray-500">أو عبر</span></div>
                </div>

                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                  variant="outline"
                  className="w-full py-4 text-lg flex gap-3 items-center justify-center bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <LogIn className="w-6 h-6 text-gold" />
                  جوجل
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            layout
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
              }
              setError(null);
              setMessage(null);
            }}
            className="w-full text-gold text-sm font-medium hover:underline flex items-center justify-center gap-2"
          >
            {isForgotPassword ? (
              <>
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </>
            ) : isSignUp ? (
              <>
                لديك حساب بالفعل؟ تسجيل الدخول
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                ليس لديك حساب؟ إنشاء حساب جديد
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mt-6 text-red-400 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center overflow-hidden"
            >
              {error}
            </motion.p>
          )}

          {message && (
            <motion.p 
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mt-6 text-green-400 text-sm bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-center flex items-center justify-center gap-2 overflow-hidden"
            >
              <Info className="w-4 h-4" />
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-12 text-gray-600 text-xs text-center">
        &copy; {new Date().getFullYear()} أورسان. جميع الحقوق محفوظة.
      </div>
    </motion.div>
  );
}
