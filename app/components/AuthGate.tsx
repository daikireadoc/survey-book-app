
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const PUBLIC_PATHS = ["/login", "/legal", "/signup"];

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const isPublicPage = useMemo(() => {
    return PUBLIC_PATHS.includes(pathname || "");
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (isPublicPage) {
        if (active) setChecking(false);
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    };

    run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!PUBLIC_PATHS.includes(pathname || "") && !session?.user) {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isPublicPage, pathname, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
          color: "var(--foreground)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        認証確認中...
      </div>
    );
  }

  return <>{children}</>;
}