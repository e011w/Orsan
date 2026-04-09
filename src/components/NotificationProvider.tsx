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
  notifications: AppNotification[];
  unreadCount: number;
  createNotification: (userId: string, title: string, body: string, type: AppNotification['type'], orderId?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listener if it exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Request browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'default') {
          window.Notification.requestPermission();
        }
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);

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
        if (error.code !== 'cancelled' && error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
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

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, createNotification, markAsRead, markAllAsRead }}>
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
