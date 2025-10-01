import { createServiceClient } from '@/lib/supabase/server';

export interface PublicEventRow { id: string; name: string | null; enable?: boolean | null; category?: string | null; slug?: string | null; description?: string | null }

// Fetch events regardless of enable, caller decides how to label disabled.
export async function fetchAllEventsForPublic() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('Events')
    .select('id, name, enable, category, slug, description');
  if (error) return { ok:false as const, error: error.message };
  return { ok:true as const, data: (data || []) as PublicEventRow[] };
}
