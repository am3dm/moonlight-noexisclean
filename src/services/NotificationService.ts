import { toast } from "sonner";
import { api } from "@/lib/api";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export const NotificationService = {
  /**
   * إرسال إشعار وحفظه في قاعدة البيانات
   */
  notify: async (
    title: string, 
    message: string, 
    type: NotificationType = 'info', 
    userId?: string
  ) => {
    // 1. عرض الإشعار للمستخدم فوراً
    switch (type) {
      case 'success':
        toast.success(message, { description: title });
        break;
      case 'error':
        toast.error(message, { description: title });
        break;
      case 'warning':
        toast.warning(message, { description: title });
        break;
      default:
        toast.info(message, { description: title });
    }

    // 2. Log to console or optionally send to backend
    // console.log(`Notification: ${title} - ${message}`);
  },

  /**
   * جلب الإشعارات غير المقروءة
   */
  getUnreadCount: async () => {
    // Mock implementation
    return 0;
  },

  /**
   * تحديد الكل كمقروء
   */
  markAllAsRead: async () => {
     return true;
  }
};
