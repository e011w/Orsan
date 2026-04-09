import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Service } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Wrench,
  PaintBucket,
  Layout,
  Building2,
  Car,
  Settings,
  Layers,
  Star,
  User,
  Loader2
} from 'lucide-react';
import { Card } from '../components/ui/Card';

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

export default function SubServices() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const docRef = doc(db, 'services', serviceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() } as Service);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-500">الخدمة غير موجودة</p>
        <button onClick={() => navigate('/')} className="text-gold font-bold">العودة للرئيسية</button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const Icon = iconMap[service.icon] || Wrench;

  return (
    <motion.div 
      className="space-y-10 pb-10 px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center gap-4" variants={itemVariants}>
        <button 
          onClick={() => navigate('/')} 
          className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-black-soft leading-tight">{service.title}</h2>
          <p className="text-gray-500 text-sm">{service.description}</p>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6" variants={containerVariants}>
        {service.subServices?.map((sub) => (
          <motion.div
            key={sub.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-500 border-gold/10 bg-white p-6 flex items-center justify-between rounded-[2rem] relative overflow-hidden group"
              onClick={() => navigate(`/booking/${service.id}?sub=${encodeURIComponent(sub.title)}`)}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl ${service.color || 'bg-gold/10 text-gold'} flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-sm`}>
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-black-soft group-hover:text-gold transition-colors">{sub.title}</h3>
                  <p className="text-sm text-gray-400 font-medium">{sub.description}</p>
                </div>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all duration-500 shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.section 
        variants={itemVariants}
        className="bg-gold/5 border border-gold/10 rounded-3xl p-8 text-center space-y-4"
      >
        <div className={`w-16 h-16 rounded-2xl ${service.color || 'bg-gold/10 text-gold'} flex items-center justify-center mx-auto shadow-sm`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-black-soft">ضمان الجودة والاحترافية</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">نضمن لك الحصول على أفضل خدمة ممكنة بأيدي فنيين متخصصين ومعتمدين</p>
        </div>
      </motion.section>
    </motion.div>
  );
}
