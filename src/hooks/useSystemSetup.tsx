import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSystemSetup = () => {
  return useQuery({
    queryKey: ['system_setup'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('is_setup_completed')
          .maybeSingle();

        if (error) {
          // Fallback: consider setup completed to avoid blocking the app
          return { isSetupCompleted: true };
        }

        // If no settings exist, allow app to run with defaults
        if (!data) {
          return { isSetupCompleted: true };
        }

        return { isSetupCompleted: data.is_setup_completed ?? true };
      } catch {
        // Any unexpected error -> allow app to run
        return { isSetupCompleted: true };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0,
  });
};

export default useSystemSetup;
