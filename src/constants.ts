export const SERVICES = [
  { 
    id: 'home', 
    title: 'الخدمات المنزلية', 
    icon: 'Wrench', 
    color: 'bg-gold/10 text-gold',
    description: 'صيانة شاملة لمنزلك بأيدي خبراء',
    subServices: [
      { id: 'home-basic', title: 'سباكة، كهرباء، نجارة', description: 'حلول متكاملة للمشاكل المنزلية' },
      { id: 'appliances', title: 'صيانة الأجهزة المنزلية داخل الموقع', description: 'إصلاح سريع لجميع الأجهزة' },
      { id: 'maintenance', title: 'تركيب وصيانة عامة', description: 'خدمات تركيب وصيانة متنوعة' }
    ]
  },
  { 
    id: 'decor', 
    title: 'التجديد والديكور', 
    icon: 'Layout', 
    color: 'bg-gold/10 text-gold',
    description: 'لمسات فنية تجدد روح المكان',
    subServices: [
      { id: 'interior-low-cost', title: 'تحسين الشكل الداخلي بتكلفة منخفضة', description: 'تجديد عصري بميزانية محدودة' },
      { id: 'renovation', title: 'تجديد غرف وصالات ومطابخ', description: 'تحويل المساحات إلى أماكن مبهرة' },
      { id: 'furniture-repair', title: 'ترميم الأثاث', description: 'إعادة الحياة لقطع الأثاث القديمة' },
      { id: 'decor-supply', title: 'توريد وتركيب ديكورات', description: 'أحدث الديكورات العصرية' }
    ]
  },
  { 
    id: 'shop', 
    title: 'ديكور المحلات والمطاعم', 
    icon: 'Layers', 
    color: 'bg-gold/10 text-gold',
    description: 'تصميم واجهات وهوية بصرية مميزة',
    subServices: [
      { id: 'facades', title: 'تصميم وتنفيذ واجهات', description: 'واجهات تجذب الأنظار لعملك' },
      { id: 'visual-identity', title: 'تحسين الهوية البصرية', description: 'تعزيز العلامة التجارية في المساحة' },
      { id: 'fast-execution', title: 'تنفيذ سريع واقتصادي', description: 'حلول ذكية للمشاريع المستعجلة' }
    ]
  },
  { 
    id: 'contracting', 
    title: 'المقاولات العامة', 
    icon: 'Building2', 
    color: 'bg-gold/10 text-gold',
    description: 'بناء وتشطيب بأعلى المعايير',
    subServices: [
      { id: 'finishing', title: 'تشطيب شقق', description: 'تشطيبات راقية تناسب ذوقك' },
      { id: 'rehab', title: 'إعادة تأهيل', description: 'تجديد شامل للمباني' },
      { id: 'small-projects', title: 'تنفيذ مشاريع صغيرة ومتوسطة', description: 'إدارة وتنفيذ مشاريع بدقة' },
      { id: 'painting', title: 'أعمال الطلاء والرنج', description: 'ألوان تضفي جمالاً على جدرانك' }
    ]
  },
  { 
    id: 'vehicle', 
    title: 'خدمات المركبات', 
    icon: 'Car', 
    color: 'bg-gold/10 text-gold',
    description: 'مساعدة على الطريق في أي وقت',
    subServices: [
      { id: 'site-repair', title: 'إصلاح الأعطال البسيطة في الموقع', description: 'حلول سريعة للأعطال المفاجئة' },
      { id: 'car-electricity', title: 'كهرباء السيارات', description: 'صيانة كهربائية شاملة' },
      { id: 'battery', title: 'تشغيل البطارية', description: 'حلول لمشاكل البطارية' },
      { id: 'tires', title: 'تغيير الإطارات', description: 'تبديل الإطارات في الموقع' },
      { id: 'diagnosis', title: 'تشخيص الأعطال', description: 'فحص شامل للسيارة' },
      { id: 'towing', title: 'سحب المركبة عند الحاجة', description: 'خدمة سحب آمنة' }
    ]
  },
];
