import { createClient } from "@/lib/supabase/server";
import type { Lab } from "@/lib/types";

export async function getCurrentLab(): Promise<Lab> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: lab, error } = await supabase
    .from("labs")
    .select("id, name, email, auth_user_id, created_at")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !lab) {
    throw new Error("Lab not found for current user");
  }

  return lab as Lab;
}
