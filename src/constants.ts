export const SERVICES = [
  { 
    id: 'home', 
    title: 'الخدمات المنزلية', 
    icon: 'Wrench', 
    color: 'bg-gold/10 text-gold',
    description: 'صيانة شاملة لمنزلك بأيدي خبراء',
    subServices: [
      { id: 'plumbing', title: 'سباكة، كهرباء، نجارة', description: 'حلول متكاملة للمشاكل المنزلية' },
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
      { id: 'furniture', title: 'ترميم الأثاث وتوريد الديكورات', description: 'إعادة الحياة لقطع الأثاث القديمة' }
    ]
  },
  { 
    id: 'shop', 
    title: 'ديكور المحلات والمطاعم', 
    icon: 'PaintBucket', 
    color: 'bg-gold/10 text-gold',
    description: 'تصميم واجهات وهوية بصرية مميزة',
    subServices: [
      { id: 'facades', title: 'تصميم وتنفيذ واجهات احترافية', description: 'واجهات تجذب الأنظار لعملك' },
      { id: 'visual-identity', title: 'تحسين الهوية البصرية للمكان', description: 'تعزيز العلامة التجارية في المساحة' },
      { id: 'fast-execution', title: 'تنفيذ سريع واقتصادي للمشاريع', description: 'حلول ذكية للمشاريع المستعجلة' }
    ]
  },
  { 
    id: 'contracting', 
    title: 'المقاولات العامة', 
    icon: 'Building2', 
    color: 'bg-gold/10 text-gold',
    description: 'بناء وتشطيب بأعلى المعايير',
    subServices: [
      { id: 'finishing', title: 'تشطيب شقق وإعادة تأهيل', description: 'تشطيبات راقية تناسب ذوقك' },
      { id: 'small-projects', title: 'تنفيذ مشاريع صغيرة ومتوسطة', description: 'إدارة وتنفيذ مشاريع بدقة' },
      { id: 'painting', title: 'أعمال الطلاء والرنج الاحترافية', description: 'ألوان تضفي جمالاً على جدرانك' }
    ]
  },
  { 
    id: 'vehicle', 
    title: 'خدمات المركبات (Road Assistance)', 
    icon: 'Car', 
    color: 'bg-gold/10 text-gold',
    description: 'مساعدة على الطريق في أي وقت',
    subServices: [
      { id: 'site-repair', title: 'إصلاح الأعطال البسيطة في الموقع', description: 'حلول سريعة للأعطال المفاجئة' },
      { id: 'car-electricity', title: 'كهرباء السيارات وتشغيل البطارية', description: 'صيانة كهربائية شاملة' },
      { id: 'towing', title: 'تغيير الإطارات وسحب المركبة', description: 'مساعدة فورية في حالات الطوارئ' }
    ]
  },
];
