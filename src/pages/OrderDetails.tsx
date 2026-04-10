import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Order, Message, UserProfile } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../components/NotificationProvider';
import { toast } from 'sonner';
import { Input } from '../components/ui/Input';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowRight, 
  Send, 
  Clock, 
  MapPin, 
  MessageSquare, 
  User as UserIcon,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  CheckCheck,
  Info,
  MoreVertical,
  Calendar,
  Image as ImageIcon,
  ChevronDown,
  Share2,
  ExternalLink
} from 'lucide-react';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const statusMap = {
  pending: { label: 'قيد الانتظار', color: 'text-orange-500 bg-orange-50 border-orange-100', icon: Clock, step: 0 },
  'in-progress': { label: 'جاري التنفيذ', color: 'text-blue-500 bg-blue-50 border-blue-100', icon: Loader2, step: 1 },
  completed: { label: 'تم الانتهاء', color: 'text-green-500 bg-green-50 border-green-100', icon: CheckCircle2, step: 2 },
  cancelled: { label: 'ملغي', color: 'text-red-500 bg-red-50 border-red-100', icon: AlertCircle, step: -1 },
};

const formatMessageTime = (dateInput: any) => {
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
};

const getDayLabel = (dateInput: any) => {
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'اليوم';
  if (date.toDateString() === yesterday.toDateString()) return 'أمس';
  return date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [order, setOrder] = useState<Order | null>(null);
  const [requester, setRequester] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderId || !auth.currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch current user profile for role check
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (currentUserDoc.exists()) {
          setCurrentUserProfile(currentUserDoc.data() as UserProfile);
        }

        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
          setOrder(orderData);
          
          // Fetch requester profile
          const userDoc = await getDoc(doc(db, 'users', orderData.userId));
          if (userDoc.exists()) {
            setRequester(userDoc.data() as UserProfile);
          }
        } else {
          navigate('/orders');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Messages listener
    const q = query(
      collection(db, 'messages'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);

      // Mark unread messages as read
      msgs.forEach(async (msg) => {
        if (msg.senderId !== auth.currentUser?.uid && (!msg.readBy || !msg.readBy.includes(auth.currentUser!.uid))) {
          try {
            await updateDoc(doc(db, 'messages', msg.id), {
              readBy: arrayUnion(auth.currentUser!.uid)
            });
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });

    // Typing indicator listener
    const typingQuery = query(
      collection(db, 'typing'),
      where('orderId', '==', orderId),
      where('userId', '!=', auth.currentUser.uid)
    );

    const unsubscribeTyping = onSnapshot(typingQuery, (snapshot) => {
      const typing = snapshot.docs.some(doc => doc.data().isTyping);
      setOtherTyping(typing);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [orderId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !orderId || !auth.currentUser || !order) return;

    const text = newMessage.trim();
    setNewMessage('');
    stopTyping();

    try {
      await addDoc(collection(db, 'messages'), {
        orderId,
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp(),
        readBy: [auth.currentUser.uid]
      });

      // Notify the other party
      const isCustomer = auth.currentUser.uid === order.userId;
      if (isCustomer) {
        // Notify all admins
        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminsSnapshot = await getDocs(adminsQuery);
        
        const notificationPromises = adminsSnapshot.docs.map(adminDoc => 
          createNotification(
            adminDoc.id,
            'رسالة جديدة من عميل',
            text.length > 50 ? text.substring(0, 50) + '...' : text,
            'new_message',
            orderId
          )
        );
        await Promise.all(notificationPromises);
      } else {
        await createNotification(
          order.userId,
          'رسالة جديدة من الفني',
          text.length > 50 ? text.substring(0, 50) + '...' : text,
          'new_message',
          orderId
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const startTyping = () => {
    if (!isTyping && orderId && auth.currentUser) {
      setIsTyping(true);
      setDoc(doc(db, 'typing', `${orderId}_${auth.currentUser.uid}`), {
        isTyping: true,
        userId: auth.currentUser.uid,
        orderId,
        updatedAt: serverTimestamp()
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 3000);
  };

  const stopTyping = () => {
    if (isTyping && orderId && auth.currentUser) {
      setIsTyping(false);
      setDoc(doc(db, 'typing', `${orderId}_${auth.currentUser.uid}`), {
        isTyping: false,
        userId: auth.currentUser.uid,
        orderId,
        updatedAt: serverTimestamp()
      });
    }
  };

  const updateStatus = async (newStatus: Order['status']) => {
    if (!orderId || !order) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrder({ ...order, status: newStatus });
      
      const statusLabel = statusMap[newStatus].label;
      await createNotification(
        order.userId,
        'تحديث حالة الطلب',
        `تم تغيير حالة طلبك (${order.serviceTitle}) إلى: ${statusLabel}`,
        'status_update',
        orderId
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const shareLocation = () => {
    if (order?.location) {
      const url = `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`;
      if (navigator.share) {
        navigator.share({
          title: 'موقع الطلب',
          text: `موقع طلب خدمة ${order.subServiceTitle || order.serviceTitle}`,
          url: url,
        });
      } else {
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ رابط الموقع');
      }
    }
  };

  const openInMaps = () => {
    if (order?.location) {
      window.open(`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!order) return null;

  const status = statusMap[order.status];
  const StatusIcon = status.icon;
  const isAdmin = currentUserProfile?.role === 'admin';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
        </div>
        
        {isAdmin && requester?.phone && (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 border-gold/20 text-gold hover:bg-gold hover:text-black"
            onClick={() => window.location.href = `tel:${requester.phone}`}
          >
            <Phone className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white p-6 rounded-[2rem] border border-gold/10 shadow-sm">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 -z-10 mx-6" />
            <div 
              className="absolute top-1/2 right-0 h-0.5 bg-gold -translate-y-1/2 -z-10 origin-right mx-6 transition-all duration-500"
              style={{ width: `${(status.step / 2) * 100}%` }}
            />
            
            {[
              { id: 'pending', label: 'انتظار', icon: Clock },
              { id: 'in-progress', label: 'تنفيذ', icon: Loader2 },
              { id: 'completed', label: 'اكتمال', icon: CheckCircle2 }
            ].map((s, i) => {
              const isActive = i <= status.step;
              const isCurrent = i === status.step;
              const Icon = s.icon;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-gold text-black" : "bg-gray-100 text-gray-400",
                    isCurrent && "ring-4 ring-gold/20 scale-110"
                  )}>
                    <Icon className={cn("w-5 h-5", isCurrent && i === 1 && "animate-spin")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "text-gold" : "text-gray-400"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Info Card */}
      <Card className="p-6 space-y-6 border-gold/10 bg-white shadow-sm relative overflow-hidden rounded-[2.5rem]">
        <div className="absolute top-0 right-0 w-1.5 h-full bg-gold" />
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="space-y-0.5">
                <h3 className="font-bold text-2xl text-black-soft">{order.subServiceTitle || order.serviceTitle}</h3>
                {order.subServiceTitle && (
                  <p className="text-xs font-bold text-gold uppercase tracking-widest">{order.serviceTitle}</p>
                )}
              </div>
              {isAdmin && (
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                    {Object.entries(statusMap).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => updateStatus(key as Order['status'])}
                        className={cn(
                          "w-full text-right px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                          order.status === key ? "bg-gold/10 text-gold" : "hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">رقم الطلب: {order.id.slice(0, 8)}</p>
          </div>
          <div className={cn(
            'px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-2',
            status.color
          )}>
            <StatusIcon className={cn('w-4 h-4', order.status === 'in-progress' && 'animate-spin')} />
            {status.label}
          </div>
        </div>

        {/* Customer Info for Admins */}
        {requester && (
          <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gold">
                <UserIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">العميل</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                {requester.role === 'customer' ? 'عميل بريميوم' : 'مسؤول'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <UserIcon className="w-7 h-7 text-gold/40" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-black-soft">{requester.displayName}</p>
                <div className="flex items-center gap-3 mt-1">
                  {requester.phone && (
                    <a href={`tel:${requester.phone}`} className="flex items-center gap-1.5 text-xs text-gold hover:underline font-medium">
                      <Phone className="w-3 h-3" />
                      {requester.phone}
                    </a>
                  )}
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-xs text-gray-400">{requester.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worker Info */}
        {order.workerInfo && (
          <div className="bg-green-50/50 rounded-3xl p-5 border border-green-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <UserIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">العامل المرسل</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-green-100">
                <UserIcon className="w-7 h-7 text-green-600/40" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-black-soft">{order.workerInfo.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  {order.workerInfo.phone && (
                    <a href={`tel:${order.workerInfo.phone}`} className="flex items-center gap-1.5 text-xs text-green-600 hover:underline font-medium">
                      <Phone className="w-3 h-3" />
                      {order.workerInfo.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">الموعد</p>
              <p className="font-bold text-black-soft">
                {order.scheduledTime && (order.scheduledTime as any).toDate ? (order.scheduledTime as any).toDate().toLocaleString('ar-EG', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : new Date(order.scheduledTime).toLocaleString('ar-EG', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">الموقع</p>
                  <p className="font-bold text-black-soft line-clamp-1">{order.location.address}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-xl border-gray-200" onClick={shareLocation}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-xl border-gray-200" onClick={openInMaps}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {order.location.lat !== 0 && (
              <div className="h-48 rounded-3xl overflow-hidden border border-gray-100 shadow-inner relative z-0">
                <MapContainer 
                  center={[order.location.lat, order.location.lng]} 
                  zoom={15} 
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[order.location.lat, order.location.lng]}>
                    <Popup>
                      موقع الخدمة
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        </div>

        {order.details && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400 px-1">
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">وصف المشكلة</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50/50 p-5 rounded-3xl border border-gray-100/50 italic">
              "{order.details}"
            </p>
          </div>
        )}

        {order.images && order.images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400 px-1">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">الصور المرفقة</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {order.images.map((img, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Chat Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold" />
            <h3 className="font-bold text-lg">المحادثة المباشرة</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">متصل الآن</span>
          </div>
        </div>

        <Card className="h-[500px] flex flex-col border-gold/10 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-black-soft">لا توجد رسائل بعد</p>
                  <p className="text-xs text-gray-400">ابدأ المحادثة مع الفني لمناقشة تفاصيل الطلب</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                const isRead = msg.readBy && msg.readBy.length > 0 && msg.readBy.some(uid => uid !== msg.senderId);
                const showDate = index === 0 || getDayLabel(messages[index-1].createdAt) !== getDayLabel(msg.createdAt);
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="px-4 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {getDayLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        isMe ? "mr-auto items-end" : "ml-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-[1.5rem] text-sm font-medium shadow-sm relative group transition-all",
                        isMe 
                          ? "bg-gold text-black rounded-tr-none shadow-gold/10" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 mt-1.5 px-1",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {isMe && (
                          <div className="flex items-center">
                            {isRead ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <AnimatePresence>
            {otherTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-8 py-2 text-[10px] text-gold font-bold flex items-center gap-2 bg-white/80 backdrop-blur-sm"
              >
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-gold rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                {isAdmin ? 'العميل يكتب الآن...' : 'الفني يكتب الآن...'}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 flex gap-3">
            <div className="flex-1 relative">
              <Input 
                placeholder="اكتب رسالتك هنا..."
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-gold/30 rounded-2xl h-14 pr-4 pl-12 transition-all"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  startTyping();
                }}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-14 h-14 rounded-2xl gold-gradient text-black flex items-center justify-center shadow-lg shadow-gold/20 active:scale-90 transition-transform"
              disabled={!newMessage.trim()}
            >
              <Send className="w-6 h-6" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
