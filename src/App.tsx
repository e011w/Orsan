import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import Layout from './components/Layout';
import Home from './pages/Home';
import SubServices from './pages/SubServices';
import Login from './pages/Login';
import Booking from './pages/Booking';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { UserProfile } from './types';
import { seedServices } from './services/seed';
import { ErrorBoundary } from './components/ErrorBoundary';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import Logo from './components/Logo';
import { NotificationProvider } from './components/NotificationProvider';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setProfile(profileData);
            if (profileData.role === 'admin') {
              seedServices();
            }
          } else {
            const isAdminEmail = user.email === 'studentforum9019@gmail.com' || 
                               user.email === 'Mohammed@gmail.com' || 
                               user.email === 'msdan07@gmail.com';
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: isAdminEmail ? 'admin' : 'customer',
              createdAt: serverTimestamp() as any,
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
            if (isAdminEmail) {
              seedServices();
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/10 rounded-full blur-[100px] animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="p-6 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-bounce duration-[2000ms]">
            <Logo variant="light" className="scale-150" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gold animate-[loading_2s_ease-in-out_infinite]" />
            </div>
            <span className="text-gold/50 text-[10px] font-bold tracking-[0.3em] uppercase">Premium Services</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" expand={true} richColors />
      <Router>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route
              path="/*"
              element={
                user ? (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/services/:serviceId" element={<SubServices />} />
                      <Route path="/booking/:serviceId" element={<Booking />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/orders/:orderId" element={<OrderDetails />} />
                      <Route path="/profile" element={<Profile profile={profile} />} />
                      {profile?.role === 'admin' && <Route path="/admin" element={<Admin />} />}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}
