import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Order } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  MessageSquare, 
  Star,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const statusMap = {
  pending: { label: 'قيد الانتظار', color: 'text-orange-500 bg-orange-50 border-orange-100', icon: Clock },
  'in-progress': { label: 'جاري التنفيذ', color: 'text-blue-500 bg-blue-50 border-blue-100', icon: Loader2 },
  completed: { label: 'تم الانتهاء', color: 'text-green-500 bg-green-50 border-green-100', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'text-red-500 bg-red-50 border-red-100', icon: AlertCircle },
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = 'orders';
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black-soft">طلباتي</h2>
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-gold" />
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-dashed border-2 border-gray-200 bg-transparent">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">لا توجد طلبات حالياً</h3>
            <p className="text-gray-500 text-sm">اطلب خدمتك الأولى الآن وسنكون في خدمتك</p>
          </div>
          <Button variant="secondary" className="px-8" onClick={() => window.location.href = '/'}>
            اطلب خدمة
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const status = statusMap[order.status];
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="p-6 space-y-4 hover:shadow-xl transition-all duration-300 cursor-pointer group border-gold/5 bg-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-black-soft group-hover:text-gold transition-colors">
                        {order.subServiceTitle || order.serviceTitle}
                      </h3>
                      {order.subServiceTitle && (
                        <p className="text-[10px] text-gold font-bold uppercase tracking-widest">{order.serviceTitle}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">ID: {order.id.slice(0, 8)}</p>
                    </div>
                    <div className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-2',
                      status.color
                    )}>
                      <StatusIcon className={cn('w-4 h-4', order.status === 'in-progress' && 'animate-spin')} />
                      {status.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 py-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <Clock className="w-4 h-4 text-gold" />
                      <span className="font-medium">
                        {order.scheduledTime && (order.scheduledTime as any).toDate ? (order.scheduledTime as any).toDate().toLocaleString('ar-EG', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : new Date(order.scheduledTime).toLocaleString('ar-EG', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {order.details && (
                      <div className="flex items-start gap-3 text-sm text-gray-500 px-3">
                        <MessageSquare className="w-4 h-4 text-gold/50 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed">{order.details}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-4 gap-2 border-gray-200 hover:border-gold hover:text-gold transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        محادثة
                      </Button>
                      {order.status === 'completed' && (
                        <Button variant="outline" size="sm" className="h-10 px-4 gap-2 border-gold/30 text-gold bg-gold/5 hover:bg-gold hover:text-white">
                          <Star className="w-4 h-4" />
                          تقييم الخدمة
                        </Button>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-gold transition-colors" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
