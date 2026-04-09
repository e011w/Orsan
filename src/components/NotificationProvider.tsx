import React, { createContext, useContext, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  doc, 
  updateDoc,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { AppNotification } from '../types';
import { toast } from 'sonner';
import { Bell, MessageSquare, Package, CheckCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface NotificationContextType {
  createNotification: (userId: string, title: string, body: string, type: AppNotification['type'], orderId?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // Request browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'default') {
          window.Notification.requestPermission();
        }
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() } as AppNotification;
            
            // Only show if it's new (within last 10 seconds to avoid old unread ones on login)
            const createdAt = (notification.createdAt as any)?.toDate ? (notification.createdAt as any).toDate().getTime() : new Date(notification.createdAt).getTime();
            const now = new Date().getTime();
            if (now - createdAt < 10000) {
              showNotification(notification);
            }
          }
        });
      }, (error) => {
        // Only log if it's not a cancelled error (happens on logout)
        if (error.code !== 'cancelled') {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const showNotification = (notification: AppNotification) => {
    const Icon = notification.type === 'new_message' ? MessageSquare : 
                 notification.type === 'new_order' ? Package : CheckCircle;

    // In-app toast
    toast(notification.title, {
      description: notification.body,
      icon: <Icon className="w-4 h-4 text-gold" />,
      action: notification.orderId ? {
        label: 'عرض',
        onClick: () => window.location.href = `/orders/${notification.orderId}`
      } : undefined,
    });

    // Browser push if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico' // Default icon
      });
    }
  };

  const createNotification = async (
    userId: string, 
    title: string, 
    body: string, 
    type: AppNotification['type'], 
    orderId?: string
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        type,
        orderId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{ createNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
