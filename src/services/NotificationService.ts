import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

    // 2. حفظ الإشعار في قاعدة البيانات ليبقى في السجل
    try {
      // إذا لم يتم تحديد مستخدم، نحاول إرساله للمستخدم الحالي أو جعله عاماً (حسب منطق التطبيق)
      // هنا سنفترض أننا نريد تخزينه، وإذا كان عاماً قد نتركه بدون user_id أو نرسله للأدمن
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type,
          user_id: userId || (await supabase.auth.getUser()).data.user?.id,
          is_read: false
        });

      if (error) {
        console.error("Failed to save notification:", error);
      }
    } catch (err) {
      console.error("Error in notification service:", err);
    }
  },

  /**
   * جلب الإشعارات غير المقروءة
   */
  getUnreadCount: async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
      
    if (error) return 0;
    return count || 0;
  },

  /**
   * تحديد الكل كمقروء
   */
  markAllAsRead: async () => {
     const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
      
     return !error;
  }
};
