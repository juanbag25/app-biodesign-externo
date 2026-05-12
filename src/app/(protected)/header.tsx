"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/lib/theme";

export const HOME_RESET_EVENT = "biodesign:home-reset";

export default function Header({ labName }: { labName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleLogoClick(e: React.MouseEvent) {
    // If already on home, dispatch event to reset state (Link won't re-render)
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new Event(HOME_RESET_EVENT));
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-header backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 rounded-lg -mx-1 px-1 hover:opacity-80 transition-opacity"
          aria-label="Ir al inicio"
        >
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
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
