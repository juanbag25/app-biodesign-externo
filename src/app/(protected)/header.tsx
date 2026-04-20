"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header({ labName }: { labName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-gray-900">
            Biodesign
          </h1>
          <span className="hidden sm:inline text-sm text-gray-500">|</span>
          <span className="hidden sm:inline text-sm text-gray-600">
            {labName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="sm:hidden text-sm text-gray-600">{labName}</span>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
