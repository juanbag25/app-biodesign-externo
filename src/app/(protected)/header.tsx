"use client";

import Image from "next/image";
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
    <header className="sticky top-0 z-10 border-b border-border bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Biodesign"
            width={88}
            height={26}
            className="opacity-80"
          />
          <span className="text-neutral-600">|</span>
          <span className="text-sm text-neutral-400">{labName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cambiar-contrasena"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-hover hover:text-neutral-200 active:bg-surface transition-colors"
          >
            <span className="hidden sm:inline">Cambiar contraseña</span>
            <span className="sm:hidden">Contraseña</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-hover hover:text-neutral-200 active:bg-surface transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
