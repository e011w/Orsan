import { db } from '../firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { SERVICES } from '../constants';

export async function seedServices() {
  const path = 'services';
  try {
    console.log('Seeding services...');
    for (const service of SERVICES) {
      await setDoc(doc(db, path, service.id), service);
    }
    console.log('Services seeded successfully.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
