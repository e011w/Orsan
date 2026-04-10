import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, UserProfile, Service, SubService, AppSettings } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNotifications } from '../components/NotificationProvider';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { toast } from 'sonner';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  MessageSquare, 
  Star,
  Loader2,
  Filter,
  MoreVertical,
  User,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Users,
  Settings,
  Layers,
  Layout,
  Wrench,
  PaintBucket,
  Building2,
  Car,
  Save,
  X,
  Shield,
  Info,
  Search,
  Truck,
  Check,
  XCircle,
  History,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICES as INITIAL_SERVICES } from '../constants';

const statusMap = {
  pending: { label: 'قيد الانتظار', color: 'text-orange-500 bg-orange-50 border-orange-100', icon: Clock },
  'in-progress': { label: 'جاري التنفيذ', color: 'text-blue-500 bg-blue-50 border-blue-100', icon: Loader2 },
  completed: { label: 'تم الانتهاء', color: 'text-green-500 bg-green-50 border-green-100', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'text-red-500 bg-red-50 border-red-100', icon: AlertCircle },
};

const iconMap: Record<string, any> = {
  Wrench,
  PaintBucket,
  Layout,
  Building2,
  Car,
  Settings,
  Layers,
  Star,
  User
};

export default function Admin() {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'users' | 'settings'>('orders');
  const [orderTab, setOrderTab] = useState<'new' | 'approved' | 'rejected' | 'finished'>('new');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderUsers, setOrderUsers] = useState<Record<string, UserProfile>>({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [sendingWorker, setSendingWorker] = useState<Order | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '' });
  const [isSendingWorker, setIsSendingWorker] = useState(false);

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);

  // Users State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [adminCreating, setAdminCreating] = useState(false);

  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    whatsapp: '',
    facebook: '',
    instagram: '',
    phone: '',
    location: '',
    aboutText: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState<Partial<Service>>({
    title: '',
    description: '',
    icon: 'Wrench',
    subServices: []
  });

  // Fetch Orders
  useEffect(() => {
    const path = 'orders';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(ordersData);
      setOrdersLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setOrdersLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Services
  useEffect(() => {
    const path = 'services';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(servicesData);
      setServicesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setServicesLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Users
  useEffect(() => {
    if (activeTab === 'users') {
      const path = 'users';
      const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
        setAllUsers(usersData);
        setUsersLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setUsersLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Fetch User Profiles for Orders
  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = Array.from(new Set(orders.map(o => o.userId)));
      const missingUserIds = userIds.filter(uid => !orderUsers[uid]);
      if (missingUserIds.length === 0) return;

      const newUserProfiles: Record<string, UserProfile> = {};
      await Promise.all(missingUserIds.map(async (uid: string) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            newUserProfiles[uid] = userDoc.data() as UserProfile;
          }
        } catch (e) {
          console.error('Error fetching user:', uid, e);
        }
      }));
      
      if (Object.keys(newUserProfiles).length > 0) {
        setOrderUsers(prev => ({ ...prev, ...newUserProfiles }));
      }
    };

    if (orders.length > 0) fetchUsers();
  }, [orders]); // Removed orderUsers from dependency array to prevent loops

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    const path = `orders/${orderId}`;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Check if we already sent an approval notification to avoid duplicates
      // if the status is already in-progress
      if (newStatus === 'in-progress' && order.status === 'in-progress') {
        toast.info('تمت الموافقة على هذا الطلب مسبقاً');
        return;
      }

      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      const statusLabel = statusMap[newStatus].label;
      let notificationBody = `تم تغيير حالة طلبك (${order.serviceTitle}) إلى: ${statusLabel}`;
      
      if (newStatus === 'in-progress') {
        notificationBody = `تمت الموافقة على طلبك لخدمة (${order.serviceTitle}). سيتم التواصل معك قريباً.`;
      } else if (newStatus === 'cancelled') {
        notificationBody = `نعتذر، تم رفض طلبك لخدمة (${order.serviceTitle}).`;
      } else if (newStatus === 'completed') {
        notificationBody = `تم إتمام طلبك لخدمة (${order.serviceTitle}) بنجاح. شكراً لتعاملك معنا!`;
      }

      await createNotification(
        order.userId,
        'تحديث حالة الطلب',
        notificationBody,
        'status_update',
        orderId
      );
      
      toast.success(`تم تحديث الحالة إلى: ${statusLabel}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success('تم حذف الطلب بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const handleSendWorker = async () => {
    if (!sendingWorker) return;
    setIsSendingWorker(true);
    try {
      const workerData = workerForm.name && workerForm.phone ? {
        name: workerForm.name,
        phone: workerForm.phone
      } : null;

      await updateDoc(doc(db, 'orders', sendingWorker.id), {
        workerInfo: workerData,
        status: 'in-progress' // Ensure it's in progress
      });

      let notificationBody = 'تم إرسال العامل للموقع المطلوب';
      if (workerData) {
        notificationBody = `تم إرسال العامل للموقع للتواصل مع العامل عبر الرقم التالي: ${workerData.phone} (${workerData.name})`;
      }

      await createNotification(
        sendingWorker.userId,
        'تم إرسال العامل',
        notificationBody,
        'status_update',
        sendingWorker.id
      );

      toast.success('تم إرسال الإشعار للعميل بنجاح');
      setSendingWorker(null);
      setWorkerForm({ name: '', phone: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${sendingWorker.id}`);
    } finally {
      setIsSendingWorker(false);
    }
  };

  const seedServices = async () => {
    try {
      for (const s of INITIAL_SERVICES) {
        await setDoc(doc(db, 'services', s.id), {
          id: s.id,
          title: s.title,
          description: s.description,
          icon: s.icon,
          color: s.color,
          subServices: s.subServices
        });
      }
      toast.success('تم استيراد الخدمات بنجاح');
    } catch (error) {
      console.error('Error seeding services:', error);
      toast.error('حدث خطأ أثناء استيراد الخدمات');
    }
  };

  const handleSaveService = async (service: Partial<Service>) => {
    try {
      const serviceData = {
        ...service,
        subServices: service.subServices || []
      };

      if (service.id) {
        await updateDoc(doc(db, 'services', service.id), serviceData);
      } else {
        const newId = service.title?.toLowerCase().replace(/\s+/g, '-') || Date.now().toString();
        await setDoc(doc(db, 'services', newId), { ...serviceData, id: newId });
      }
      setEditingService(null);
      setIsAddingService(false);
      setServiceForm({ title: '', description: '', icon: 'Wrench', subServices: [] });
      toast.success('تم حفظ الخدمة بنجاح');
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('حدث خطأ أثناء حفظ الخدمة');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('تم حذف الخدمة بنجاح');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('حدث خطأ أثناء حذف الخدمة');
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.displayName) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    // Check if user already exists in Firestore
    const existingUser = allUsers.find(u => u.email.toLowerCase() === newAdmin.email.toLowerCase());
    if (existingUser) {
      if (existingUser.role === 'admin') {
        toast.error('هذا المستخدم هو أدمن بالفعل.');
        setIsAddingAdmin(false);
        return;
      }
      if (confirm('هذا المستخدم مسجل بالفعل في النظام. هل تريد ترقيته إلى "أدمن" بدلاً من إنشاء حساب جديد؟')) {
        await handlePromoteUser(existingUser.uid);
        setIsAddingAdmin(false);
        return;
      }
      return;
    }

    setAdminCreating(true);
    try {
      // Use secondary app to create user without logging out current admin
      const secondaryApp = getApps().length > 1 
        ? getApp('Secondary') 
        : initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newAdmin.email, 
        newAdmin.password
      );
      
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: newAdmin.email,
        displayName: newAdmin.displayName,
        phone: newAdmin.phone,
        role: 'admin',
        createdAt: serverTimestamp()
      });

      // Sign out from secondary auth to avoid conflicts
      await secondaryAuth.signOut();
      
      toast.success('تم إنشاء حساب الأدمن بنجاح');
      setIsAddingAdmin(false);
      setNewAdmin({ displayName: '', email: '', phone: '', password: '' });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('خطأ: يجب تفعيل خاصية "Email/Password" في مشروع Firebase الخاص بك.');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('هذا البريد الإلكتروني مسجل بالفعل كمستخدم في النظام.');
      } else {
        toast.error(`حدث خطأ: ${error.message}`);
      }
    } finally {
      setAdminCreating(false);
    }
  };

  // Fetch Settings
  useEffect(() => {
    if (activeTab === 'settings') {
      const fetchSettings = async () => {
        setSettingsLoading(true);
        try {
          const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
          if (settingsDoc.exists()) {
            setAppSettings(settingsDoc.data() as AppSettings);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        } finally {
          setSettingsLoading(false);
        }
      };
      fetchSettings();
    }
  }, [activeTab]);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), appSettings);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app');
    } finally {
      setSettingsLoading(false);
    }
  };
  const handlePromoteUser = async (uid: string) => {
    if (!confirm('هل أنت متأكد من ترقية هذا المستخدم إلى أدمن؟')) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: 'admin' });
      toast.success('تمت ترقية المستخدم بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      toast.error('لا يمكنك حذف حسابك الحالي');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  if (ordersLoading && activeTab === 'orders') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>
        <div className="flex gap-2">
          {activeTab === 'services' && services.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedServices} className="gap-2 text-xs">
              استيراد البيانات الأولية
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            تصفية
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === 'orders' ? "bg-white text-gold shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Clock className="w-4 h-4" />
          الطلبات
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === 'services' ? "bg-white text-gold shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Layers className="w-4 h-4" />
          الخدمات
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === 'users' ? "bg-white text-gold shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className="w-4 h-4" />
          المستخدمين
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            activeTab === 'settings' ? "bg-white text-gold shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Settings className="w-4 h-4" />
          الإعدادات
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-black text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gold/10 rounded-full blur-xl" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">جديدة</p>
                <p className="text-2xl font-bold text-gold">{orders.filter(o => o.status === 'pending').length}</p>
              </Card>
              <Card className="p-4 bg-blue-600 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-1">قيد التنفيذ</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'in-progress').length}</p>
              </Card>
              <Card className="p-4 bg-green-600 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider mb-1">منتهية</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
              </Card>
              <Card className="p-4 bg-red-600 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <p className="text-[10px] text-red-100 font-bold uppercase tracking-wider mb-1">مرفوضة</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'cancelled').length}</p>
              </Card>
            </div>

            {/* Order Status Tabs */}
            <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-200/50">
              {[
                { id: 'new', label: 'طلبات جديدة', icon: Plus, status: 'pending' },
                { id: 'approved', label: 'تم الموافقة', icon: Check, status: 'in-progress' },
                { id: 'rejected', label: 'مرفوضة', icon: XCircle, status: 'cancelled' },
                { id: 'finished', label: 'منتهية', icon: History, status: 'completed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-[10px] font-bold transition-all relative",
                    orderTab === tab.id ? "bg-white text-gold shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", orderTab === tab.id ? "text-gold" : "text-gray-400")} />
                  {tab.label}
                  {orders.filter(o => o.status === tab.status).length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-black text-[8px] flex items-center justify-center rounded-full border-2 border-white">
                      {orders.filter(o => o.status === tab.status).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {orders
                .filter(o => {
                  if (orderTab === 'new') return o.status === 'pending';
                  if (orderTab === 'approved') return o.status === 'in-progress';
                  if (orderTab === 'rejected') return o.status === 'cancelled';
                  if (orderTab === 'finished') return o.status === 'completed';
                  return true;
                })
                .map((order, index) => {
                  const status = statusMap[order.status];
                  const StatusIcon = status.icon;
                  const customer = orderUsers[order.userId];
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-0 overflow-hidden border-gray-100 hover:border-gold/20 transition-all shadow-sm group">
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-black-soft">
                                  {order.subServiceTitle || order.serviceTitle}
                                </h3>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded-md uppercase tracking-tighter">
                                  ID: {order.id.slice(-6)}
                                </span>
                              </div>
                              {order.subServiceTitle && (
                                <p className="text-[10px] text-gold font-bold uppercase tracking-widest">{order.serviceTitle}</p>
                              )}
                            </div>
                            <div className={cn(
                              'px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5',
                              status.color
                            )}>
                              <StatusIcon className={cn('w-3 h-3', order.status === 'in-progress' && 'animate-spin')} />
                              {status.label}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <User className="w-4 h-4 text-gold" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 font-medium">العميل</p>
                                  <p className="font-bold">{customer ? customer.displayName : `عميل: ${order.userId.slice(0, 8)}`}</p>
                                  {customer?.phone && (
                                    <a href={`tel:${customer.phone}`} className="text-xs text-gold hover:underline mt-0.5 inline-block" onClick={(e) => e.stopPropagation()}>
                                      {customer.phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <Clock className="w-4 h-4 text-gold" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 font-medium">الموعد</p>
                                  <p className="font-bold">
                                    {order.scheduledTime && (order.scheduledTime as any).toDate ? (order.scheduledTime as any).toDate().toLocaleString('ar-EG') : new Date(order.scheduledTime).toLocaleString('ar-EG')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <MapPin className="w-4 h-4 text-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-gray-400 font-medium">الموقع</p>
                                  <p className="font-bold truncate">{order.location.address || 'تم تحديد الموقع عبر GPS'}</p>
                                </div>
                              </div>
                              {order.workerInfo && (
                                <div className="flex items-center gap-3 text-xs text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <Truck className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-green-400 font-medium">العامل المرسل</p>
                                    <p className="font-bold">{order.workerInfo.name} ({order.workerInfo.phone})</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {order.details && (
                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-3 h-3 text-gold" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">تفاصيل إضافية</span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{order.details}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 p-4 flex flex-wrap gap-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-10 rounded-xl font-bold bg-white border-gray-200 hover:border-gold hover:text-gold transition-all gap-2 text-xs"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            محادثة
                          </Button>

                          {order.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-bold shadow-lg shadow-blue-600/20 text-xs gap-2"
                                onClick={() => updateStatus(order.id, 'in-progress')}
                              >
                                <Check className="w-3.5 h-3.5" />
                                موافقة
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 border-red-200 text-red-500 hover:bg-red-50 h-10 rounded-xl font-bold text-xs gap-2"
                                onClick={() => updateStatus(order.id, 'cancelled')}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                رفض
                              </Button>
                            </>
                          )}

                          {order.status === 'in-progress' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-gold hover:bg-gold-dark text-black h-10 rounded-xl font-bold shadow-lg shadow-gold/20 text-xs gap-2"
                                onClick={() => setSendingWorker(order)}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                إرسال عامل
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 rounded-xl font-bold shadow-lg shadow-green-600/20 text-xs gap-2"
                                onClick={() => updateStatus(order.id, 'completed')}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                إتمام
                              </Button>
                            </>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-10 h-10 rounded-xl font-bold border-gray-200 hover:border-red-500 hover:text-red-500 transition-all p-0"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              
              {orders.filter(o => {
                if (orderTab === 'new') return o.status === 'pending';
                if (orderTab === 'approved') return o.status === 'in-progress';
                if (orderTab === 'rejected') return o.status === 'cancelled';
                if (orderTab === 'finished') return o.status === 'completed';
                return true;
              }).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <Clock className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="font-bold text-sm">لا توجد طلبات في هذا القسم</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">إدارة الخدمات</h3>
              <Button size="sm" className="gap-2" onClick={() => {
                setServiceForm({ title: '', description: '', icon: 'Wrench', subServices: [] });
                setIsAddingService(true);
              }}>
                <Plus className="w-4 h-4" />
                إضافة خدمة
              </Button>
            </div>

            {servicesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="p-4 border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", service.color || "bg-gold/10 text-gold")}>
                          {(() => {
                            const Icon = iconMap[service.icon] || Wrench;
                            return <Icon className="w-6 h-6" />;
                          })()}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{service.title}</h4>
                          <p className="text-sm text-gray-500">{service.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {service.subServices?.map((sub) => (
                              <span key={sub.id} className="px-2 py-1 bg-gray-100 text-[10px] font-bold rounded-lg text-gray-600">
                                {sub.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => {
                          setServiceForm(service);
                          setEditingService(service);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">إدارة المستخدمين</h3>
                <Button size="sm" className="gap-2" onClick={() => setIsAddingAdmin(true)}>
                  <Plus className="w-4 h-4" />
                  إضافة أدمن
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="البحث بالاسم أو البريد الإلكتروني..." 
                  className="pr-12 h-12 rounded-2xl bg-gray-50 border-none"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allUsers
                  .filter(u => 
                    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((user) => (
                  <Card key={user.uid} className="p-4 border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{user.displayName}</h4>
                            {user.role === 'admin' && (
                              <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Shield className="w-2 h-2" />
                                أدمن
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-[10px] text-gray-400 mt-0.5">{user.phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-8 h-8 p-0 text-gold hover:text-gold-dark" 
                            onClick={() => handlePromoteUser(user.uid)}
                            title="ترقية إلى أدمن"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteUser(user.uid)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="p-8 space-y-6">
              <h3 className="text-xl font-bold border-b pb-4">إعدادات التطبيق</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رقم الواتساب</label>
                  <Input 
                    placeholder="966xxxxxxxx" 
                    value={appSettings.whatsapp}
                    onChange={(e) => setAppSettings({ ...appSettings, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رابط فيسبوك</label>
                  <Input 
                    placeholder="https://facebook.com/..." 
                    value={appSettings.facebook}
                    onChange={(e) => setAppSettings({ ...appSettings, facebook: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رابط انستاجرام</label>
                  <Input 
                    placeholder="https://instagram.com/..." 
                    value={appSettings.instagram}
                    onChange={(e) => setAppSettings({ ...appSettings, instagram: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رقم الهاتف للتواصل</label>
                  <Input 
                    placeholder="05xxxxxxxx" 
                    value={appSettings.phone}
                    onChange={(e) => setAppSettings({ ...appSettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-600">الموقع (العنوان)</label>
                  <Input 
                    placeholder="المدينة، الحي، الشارع..." 
                    value={appSettings.location}
                    onChange={(e) => setAppSettings({ ...appSettings, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-600">وصف التطبيق (من نحن)</label>
                  <textarea 
                    className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-gold outline-none min-h-[150px]"
                    placeholder="اكتب هنا نبذة عن التطبيق والخدمات المقدمة..."
                    value={appSettings.aboutText}
                    onChange={(e) => setAppSettings({ ...appSettings, aboutText: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-2xl font-bold gap-2" 
                onClick={handleSaveSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                حفظ الإعدادات
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {sendingWorker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">إرسال عامل للموقع</h3>
                <button onClick={() => setSendingWorker(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    يمكنك إدخال بيانات العامل لإرسالها للعميل، أو تركها فارغة لإرسال إشعار عام.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">اسم العامل (اختياري)</label>
                  <Input 
                    placeholder="مثال: محمد أحمد" 
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رقم هاتف العامل (اختياري)</label>
                  <Input 
                    placeholder="05xxxxxxxx" 
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                  />
                </div>

                <Button 
                  className="w-full h-14 rounded-2xl font-bold gap-2 bg-gold text-black hover:bg-gold-dark" 
                  onClick={handleSendWorker}
                  disabled={isSendingWorker}
                >
                  {isSendingWorker ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                  إرسال للعميل
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {(isAddingService || editingService) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingService ? 'تعديل خدمة' : 'إضافة خدمة جديدة'}</h3>
                <button onClick={() => { setIsAddingService(false); setEditingService(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">اسم الخدمة</label>
                  <Input 
                    placeholder="مثال: الخدمات المنزلية" 
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">الوصف</label>
                  <textarea 
                    className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-gold outline-none min-h-[100px]"
                    placeholder="وصف مختصر للخدمة..."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">الأيقونة</label>
                  <select 
                    className="w-full rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-gold outline-none"
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                  >
                    {Object.keys(iconMap).map(iconName => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-600">الخدمات الفرعية</label>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => {
                      const current = serviceForm.subServices || [];
                      setServiceForm({
                        ...serviceForm,
                        subServices: [...current, { id: Date.now().toString(), title: '', description: '' }]
                      });
                    }}>
                      إضافة خدمة فرعية
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(serviceForm.subServices || []).map((sub, idx) => (
                      <div key={sub.id} className="p-4 bg-gray-50 rounded-2xl space-y-2 relative">
                        <button 
                          className="absolute top-2 left-2 text-red-400 hover:text-red-600"
                          onClick={() => {
                            const subs = [...(serviceForm.subServices || [])];
                            subs.splice(idx, 1);
                            setServiceForm({ ...serviceForm, subServices: subs });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <Input 
                          placeholder="عنوان الخدمة الفرعية" 
                          className="bg-white"
                          value={sub.title}
                          onChange={(e) => {
                            const subs = [...(serviceForm.subServices || [])];
                            subs[idx].title = e.target.value;
                            setServiceForm({ ...serviceForm, subServices: subs });
                          }}
                        />
                        <Input 
                          placeholder="وصف الخدمة الفرعية" 
                          className="bg-white text-xs"
                          value={sub.description}
                          onChange={(e) => {
                            const subs = [...(serviceForm.subServices || [])];
                            subs[idx].description = e.target.value;
                            setServiceForm({ ...serviceForm, subServices: subs });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl font-bold gap-2" onClick={() => handleSaveService(serviceForm)}>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </Button>
            </motion.div>
          </div>
        )}

        {isAddingAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">إضافة أدمن جديد</h3>
                <button onClick={() => setIsAddingAdmin(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1">تنبيه هام:</p>
                    يجب تفعيل خاصية <b>Email/Password</b> في مشروع Firebase الخاص بك ليعمل هذا النموذج.
                    <br />
                    المسار: Authentication {'>'} Sign-in method {'>'} Email/Password
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">الاسم الكامل</label>
                  <Input 
                    placeholder="الاسم" 
                    value={newAdmin.displayName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">البريد الإلكتروني</label>
                  <Input 
                    type="email"
                    placeholder="email@example.com" 
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">رقم الهاتف</label>
                  <Input 
                    placeholder="05xxxxxxxx" 
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">كلمة المرور</label>
                  <Input 
                    type="password"
                    placeholder="********" 
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-2xl font-bold gap-2" 
                onClick={handleCreateAdmin}
                disabled={adminCreating}
              >
                {adminCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                إنشاء حساب أدمن
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
