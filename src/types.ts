export type ServiceCategory = 'home' | 'decor' | 'shop' | 'contracting' | 'vehicle';

export interface SubService {
  id: string;
  title: string;
  description: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  subServices: SubService[];
}

export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  serviceTitle: string;
  subServiceTitle?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  details: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  scheduledTime: any;
  createdAt: any;
  images?: string[];
  rating?: number;
  review?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin' | 'technician';
  phone?: string;
  createdAt?: any;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  createdAt: any;
  readBy?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  orderId?: string;
  type: 'status_update' | 'new_message' | 'new_order';
  read: boolean;
  createdAt: any;
}
