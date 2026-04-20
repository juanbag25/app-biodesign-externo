"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/lib/theme";

export default function Header({ labName }: { labName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-header backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Biodesign"
            width={88}
            height={26}
            className="hidden dark:block opacity-80"
          />
          <Image
            src="/logooscuro.png"
            alt="Biodesign"
            width={88}
            height={26}
            className="block dark:hidden opacity-70"
          />
          <span className="hidden sm:inline text-text-muted">|</span>
          <span className="hidden sm:inline text-sm text-text-secondary">
            {labName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/cambiar-contrasena"
            className="hidden sm:inline-block rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface transition-colors"
          >
            Contraseña
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
