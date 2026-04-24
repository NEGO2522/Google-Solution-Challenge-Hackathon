import { createClient } from "@supabase/supabase-js";
import { mockSupabase } from "./mockSupabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env variables. " +
    "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file."
  );
}

export const realSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabase = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    if (localStorage.getItem("DEMO_MODE") === "true") {
      if (prop === "from") return mockSupabase.from;
      if (prop === "rpc") return mockSupabase.rpc;
      if (prop === "channel") return mockSupabase.channel;
      if (prop === "removeChannel") return mockSupabase.removeChannel;
    }
    return Reflect.get(target, prop, receiver);
  }
});
