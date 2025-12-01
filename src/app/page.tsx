"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      setRole(session.user.role);
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!session?.user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Logged in as&nbsp;
          <code className="font-mono font-bold">{session.user.name || session.user.email}</code>
          {role && <span className="ml-2">({role})</span>}
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <Button onClick={handleSignOut} variant="destructive">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={() => router.push("/repair/history")}>
          My Repairs
        </Button>
        {["manager", "finance"].includes(role || "") && (
          <Button onClick={() => router.push("/manager/board")} variant="secondary">
            Manager Board
          </Button>
        )}
      </div>
    </div>
  );
}
