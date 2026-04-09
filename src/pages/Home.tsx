import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Service } from '../types';
import { cn } from '../lib/utils';
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
  Loader2,
  Search,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.subServices?.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <p className="text-gray-500 text-lg max-w-md">اختر الخدمة التي تحتاجها وسنصلك في أسرع وقت بأعلى جودة وااحترافية</p>
      </motion.section>

      <motion.div variants={itemVariants} className="relative group">
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400 group-focus-within:text-gold transition-colors" />
        </div>
        <Input
          type="text"
          placeholder="ابحث عن خدمة (مثلاً: دهانات، سباكة، كهرباء...)"
          className="pr-12 h-14 bg-white border-gold/10 rounded-2xl shadow-sm focus:ring-gold/20 focus:border-gold transition-all text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-4 flex items-center text-gray-400 hover:text-gold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-4 md:gap-8" variants={containerVariants}>
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const Icon = iconMap[service.icon] || Wrench;
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
              >
                {/* Premium Shadow Effect */}
                <div className="absolute inset-4 bg-gold/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                
                <Card 
                  className="h-full cursor-pointer bg-gold border-none shadow-[0_15px_35px_rgba(212,175,55,0.25)] hover:shadow-[0_25px_50px_rgba(212,175,55,0.4)] transition-all duration-500 p-0 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden flex flex-col group"
                  onClick={() => navigate(`/services/${service.id}`)}
                >
                  {/* Atmospheric Pattern Overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-700" />
                  
                  {/* Content Container */}
                  <div className="p-5 md:p-8 flex flex-col h-full relative z-10">
                    {/* Header: Icon & Arrow */}
                    <div className="flex items-start justify-between mb-4 md:mb-8">
                      <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-black/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
                        <Icon className="w-6 h-6 md:w-10 md:h-10 text-black" />
                      </div>
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-gold transition-all duration-500">
                        <ArrowLeft className="w-4 h-4 md:w-6 md:h-6" />
                      </div>
                    </div>
                    
                    {/* Text Info */}
                    <div className="space-y-2 md:space-y-4 flex-1">
                      <h3 className="font-black text-lg md:text-3xl text-black leading-tight tracking-tight">
                        {service.title}
                      </h3>
                      <p className="text-black/60 text-[10px] md:text-sm font-bold leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* Footer: Sub-services count or preview */}
                    <div className="mt-4 md:mt-8 pt-4 border-t border-black/5 flex items-center justify-between">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-5 h-5 md:w-8 md:h-8 rounded-full border-2 border-gold bg-black/10 backdrop-blur-sm" />
                        ))}
                      </div>
                      <span className="text-[9px] md:text-xs font-black text-black/40 uppercase tracking-tighter">
                        {service.subServices?.length || 0} خيارات
                      </span>
                    </div>
                  </div>

                  {/* Interactive Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </Card>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            variants={itemVariants}
            className="col-span-full py-20 text-center space-y-4"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-black-soft">لا توجد نتائج للبحث</h3>
              <p className="text-gray-400">جرب البحث بكلمات أخرى أو تصفح جميع الخدمات</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="rounded-xl"
            >
              إعادة تعيين البحث
            </Button>
          </motion.div>
        )}
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
