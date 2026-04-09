import { db } from '../firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const services = [
  { id: 'home', title: 'خدمات منزلية', category: 'home', description: 'سباكة، كهرباء، نجارة، وصيانة عامة', icon: 'Wrench' },
  { id: 'paint', title: 'طلاء ورنج', category: 'paint', description: 'أعمال الطلاء والدهانات الداخلية والخارجية', icon: 'PaintBucket' },
  { id: 'decor', title: 'تجديد وديكور', category: 'decor', description: 'تحسين الشكل الداخلي وتجديد الغرف', icon: 'Layout' },
  { id: 'contracting', title: 'مقاولات عامة', category: 'contracting', description: 'تشطيب شقق وإعادة تأهيل ومشاريع صغيرة', icon: 'Building2' },
  { id: 'vehicle', title: 'خدمات المركبات', category: 'vehicle', description: 'إصلاح أعطال، كهرباء سيارات، وسحب مركبات', icon: 'Car' },
];

export async function seedServices() {
  const path = 'services';
  try {
    const servicesCol = collection(db, path);
    const snapshot = await getDocs(servicesCol);
    
    if (snapshot.empty) {
      console.log('Seeding services...');
      for (const service of services) {
        await setDoc(doc(db, path, service.id), service);
      }
      console.log('Services seeded successfully.');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
