import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAuditLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['audit_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateAuditLog = () => {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (log: {
      action: string;
      table_name?: string;
      record_id?: string;
      old_data?: any;
      new_data?: any;
      details?: string;
    }) => {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          ...log,
          user_id: user?.id,
        }]);
      
      if (error) throw error;
    },
  });
};

export default useAuditLogs;
