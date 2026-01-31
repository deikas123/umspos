import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  supabaseClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return supabaseClient;
}

/**
 * Subscribe to new notifications using Supabase realtime.
 * Kept client-side to avoid serializing Supabase channel instances through RSC.
 */
export async function subscribeToNotifications(
  callback: (notification: any) => void,
) {
  const supabase = getSupabaseClient();

  return supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();
}

export async function unsubscribeFromNotifications(channel: unknown) {
  const supabase = getSupabaseClient();

  if (!channel) return;

  await supabase.removeChannel(channel as any);
}
