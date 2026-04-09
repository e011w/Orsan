import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Service } from '../types';
import { 
  ArrowLeft,
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
import { Button } from '../components/ui/Button';

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

export default function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching services:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-10 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.section className="space-y-3" variants={itemVariants}>
        <h2 className="text-4xl font-bold text-black-soft leading-tight tracking-tight">
          كل خدماتك <br />
          <span className="gold-text-gradient">في مكان واحد</span>
        </h2>
        <p className="text-gray-500 text-lg max-w-md">اختر الخدمة التي تحتاجها وسنصلك في أسرع وقت بأعلى جودة واحترافية</p>
      </motion.section>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants}>
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Wrench;
          return (
            <motion.div
              key={service.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Card 
                className="h-full cursor-pointer hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-500 border-gold/10 bg-white p-8 flex flex-col gap-6 rounded-[3rem] relative overflow-hidden group"
                onClick={() => navigate(`/services/${service.id}`)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-700 group-hover:scale-150" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className={`w-16 h-16 rounded-2xl ${service.color || 'bg-gold/10 text-gold'} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all duration-500 shadow-sm">
                    <ArrowLeft className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="space-y-2 relative z-10">
                  <h3 className="font-bold text-2xl text-black-soft group-hover:text-gold transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">{service.description}</p>
                </div>

                <div className="space-y-3 relative z-10 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-widest opacity-60">
                    <span className="w-4 h-[1px] bg-gold" />
                    تشمل الخدمة
                  </div>
                  <ul className="grid grid-cols-1 gap-2">
                    {service.subServices?.slice(0, 3).map((sub, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-black transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                        {sub.title}
                      </li>
                    ))}
                    {service.subServices?.length > 3 && (
                      <li className="text-xs text-gold font-bold pr-3.5">+{service.subServices.length - 3} خدمات أخرى</li>
                    )}
                  </ul>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.section 
        variants={itemVariants}
        className="bg-black rounded-3xl p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-bold">هل تحتاج لمساعدة فورية؟</h3>
          <p className="text-gray-400 text-sm">نحن هنا لخدمتك على مدار الساعة في جميع أنحاء المدينة</p>
          <Button 
            variant="secondary" 
            className="w-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            onClick={() => navigate('/booking/emergency')}
          >
            اطلب خدمة الآن
          </Button>
        </div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -right-10 -bottom-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl"
        />
      </motion.section>
    </motion.div>
  );
}
