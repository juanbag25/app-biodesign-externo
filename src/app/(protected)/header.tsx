"use client";

import Link from "next/link";
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
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">B</span>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-2.5">
            <span className="font-semibold text-gray-900">Biodesign</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600">{labName}</span>
          </div>
          <span className="sm:hidden text-sm font-medium text-gray-700">
            {labName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cambiar-contrasena"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 transition-colors"
          >
            <span className="hidden sm:inline">Cambiar contraseña</span>
            <span className="sm:hidden">Contraseña</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
