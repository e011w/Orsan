import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Loader2,
  Camera,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Service } from '../types';

const steps = [
  { id: 'details', title: 'تفاصيل الخدمة', icon: FileText },
  { id: 'location', title: 'الموقع', icon: MapPin },
  { id: 'time', title: 'الموعد', icon: Calendar },
  { id: 'confirm', title: 'تأكيد', icon: CheckCircle2 },
];

export default function Booking() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const subServiceTitle = searchParams.get('sub');
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    details: '',
    location: { lat: 0, lng: 0, address: '' },
    scheduledTime: '',
    images: [] as string[],
  });
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId || serviceId === 'emergency') return;
      try {
        const docSnap = await getDoc(doc(db, 'services', serviceId));
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() } as Service);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      }
    };
    fetchService();
  }, [serviceId]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'تم تحديد الموقع عبر GPS',
            },
          });
          setLoading(false);
          nextStep();
        },
        (error) => {
          console.error(error);
          setLoading(false);
          alert('تعذر تحديد الموقع. يرجى إدخال العنوان يدوياً.');
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const orderData = {
        userId: auth.currentUser.uid,
        serviceId: serviceId || 'general',
        serviceTitle: service?.title || (serviceId === 'emergency' ? 'مساعدة طارئة' : 'خدمة عامة'),
        subServiceTitle: subServiceTitle || '',
        status: 'pending',
        details: formData.details,
        location: formData.location,
        scheduledTime: Timestamp.fromDate(new Date(formData.scheduledTime)),
        createdAt: serverTimestamp(),
        images: formData.images,
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // Notify admins about new order
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminsSnapshot = await getDocs(adminsQuery);
      
      const notificationPromises = adminsSnapshot.docs.map(adminDoc => 
        createNotification(
          adminDoc.id,
          'طلب جديد',
          `تم استلام طلب جديد لخدمة: ${orderData.subServiceTitle || orderData.serviceTitle}`,
          'new_order',
          docRef.id
        )
      );
      
      await Promise.all(notificationPromises);

      navigate('/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const mainServiceTitle = service?.title || (serviceId === 'emergency' ? 'مساعدة طارئة' : 'خدمة عامة');

  return (
    <div className="space-y-8 pb-12 px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">{mainServiceTitle}</h2>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between items-center px-2 relative">
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-200 -z-10 mx-10" />
        <motion.div 
          className="absolute top-5 right-0 h-[2px] bg-gold -z-10 origin-right mx-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: currentStep / (steps.length - 1) }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ width: 'calc(100% - 80px)' }}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative">
              <motion.div 
                initial={false}
                animate={{ 
                  backgroundColor: isActive ? '#FFB347' : '#E5E7EB',
                  scale: isCurrent ? 1.2 : 1,
                  boxShadow: isCurrent ? '0 0 20px rgba(255, 179, 71, 0.4)' : 'none'
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-400'}`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <motion.span 
                animate={{ 
                  color: isActive ? '#FFB347' : '#9CA3AF',
                  fontWeight: isCurrent ? 700 : 500
                }}
                className="text-[10px]"
              >
                {step.title}
              </motion.span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait" custom={currentStep}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="min-h-[300px]"
        >
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-bold text-lg">صف لنا ما تحتاجه بالتفصيل</label>
                <textarea
                  className="w-full h-40 rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-gold outline-none transition-all"
                  placeholder="مثال: أحتاج لتركيب 3 مكيفات جديدة في الصالة..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-lg">إضافة صور (اختياري)</label>
                <div className="flex flex-wrap gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gold/20 shadow-sm">
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 3 && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-gold hover:text-gold transition-all cursor-pointer bg-white">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px]">إضافة</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, images: [...formData.images, reader.result as string] });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">يمكنك إضافة حتى 3 صور لتوضيح الطلب</p>
              </div>
              <Button className="w-full py-4" onClick={nextStep} disabled={!formData.details}>
                التالي
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="font-bold text-lg">أين موقعك؟</label>
                <Button variant="outline" className="w-full py-8 flex gap-3" onClick={handleLocation} disabled={loading}>
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapPin className="w-6 h-6" />}
                  {formData.location.lat ? 'تم تحديد الموقع بنجاح' : 'تحديد موقعي الحالي (GPS)'}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-500">أو أدخل العنوان يدوياً</span></div>
                </div>
                <Input 
                  placeholder="اسم الحي، الشارع، رقم المنزل" 
                  value={formData.location.address}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                />
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={prevStep}>السابق</Button>
                <Button className="flex-[2]" onClick={nextStep} disabled={!formData.location.address}>التالي</Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="font-bold text-lg">متى تفضل الموعد؟</label>
                <div className="space-y-4">
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
                    <Input 
                      type="datetime-local" 
                      className="pr-12"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['في أقرب وقت', 'غداً صباحاً', 'غداً مساءً', 'نهاية الأسبوع'].map((time) => (
                      <button 
                        key={time}
                        className="p-4 rounded-xl border border-gray-200 text-sm font-medium hover:border-gold hover:bg-gold/5 transition-all text-center"
                        onClick={() => {
                          // Mock setting a time for demo
                          const now = new Date();
                          now.setHours(now.getHours() + 2);
                          setFormData({ ...formData, scheduledTime: now.toISOString().slice(0, 16) });
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={prevStep}>السابق</Button>
                <Button className="flex-[2]" onClick={nextStep} disabled={!formData.scheduledTime}>التالي</Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-black-soft">مراجعة الطلب</h3>
                <p className="text-gray-500 text-sm">تأكد من صحة البيانات قبل إرسال الطلب النهائي</p>
              </div>

              <div className="grid gap-4">
                {/* Service & Time Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-5 border-gold/10 bg-white shadow-sm flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6 text-gold group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">الخدمة المطلوبة</p>
                      <p className="font-bold text-black-soft">{subServiceTitle || mainServiceTitle}</p>
                      {subServiceTitle && (
                        <p className="text-[10px] text-gold font-bold">{mainServiceTitle}</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-5 border-gold/10 bg-white shadow-sm flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-white transition-colors">
                      <Calendar className="w-6 h-6 text-gold group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">الموعد المختار</p>
                      <p className="font-bold text-black-soft">
                        {formData.scheduledTime ? new Date(formData.scheduledTime).toLocaleString('ar-EG', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'لم يتم التحديد'}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Location Section */}
                <Card className="p-5 border-gold/10 bg-white shadow-sm flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-white transition-colors">
                    <MapPin className="w-6 h-6 text-gold group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">موقع الخدمة</p>
                    <p className="font-bold text-black-soft leading-tight">{formData.location.address}</p>
                  </div>
                </Card>

                {/* Details Section */}
                <Card className="p-6 border-gold/10 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-gold">
                    <Info className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">تفاصيل إضافية</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                    "{formData.details}"
                  </p>
                </Card>

                {/* Images Section */}
                {formData.images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gold px-1">
                      <Camera className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">الصور المرفقة</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((img, i) => (
                        <motion.div 
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 p-5 bg-gold/5 rounded-[2rem] border border-gold/10 shadow-inner">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="confirm-check"
                    className="w-6 h-6 rounded-lg border-gold/30 text-gold focus:ring-gold cursor-pointer appearance-none checked:bg-gold checked:border-transparent transition-all border-2"
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <CheckCircle2 className={cn(
                    "absolute left-1 w-4 h-4 text-white pointer-events-none transition-opacity",
                    confirmed ? "opacity-100" : "opacity-0"
                  )} />
                </div>
                <label htmlFor="confirm-check" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  أؤكد صحة البيانات وأرغب في إرسال الطلب
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={prevStep}>السابق</Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl gold-gradient text-black font-bold shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all" 
                  onClick={handleSubmit} 
                  disabled={loading || !confirmed}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد وإرسال الطلب'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
