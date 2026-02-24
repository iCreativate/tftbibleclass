 "use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Mail, Lock, KeyRound, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const codeResponse = await fetch("/api/admin-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ adminCode })
      });

      if (!codeResponse.ok) {
        const data = await codeResponse.json().catch(() => null);
        const message =
          data?.error || "Invalid admin access code. Please try again.";
        toast.error(message);
        setLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        const message = error.message || "Unable to sign in right now";
        toast.error(message);
        setLoading(false);
        return;
      }
      toast.success("Welcome back");
      await new Promise((r) => setTimeout(r, 400));
      window.location.href = "/admin";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in right now";
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Admin email</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Mail className="h-4 w-4" />
          </span>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            className="pl-9"
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Lock className="h-4 w-4" />
          </span>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            className="pl-9"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-code">Admin access code</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <Input
            id="admin-code"
            type="password"
            autoComplete="off"
            required
            minLength={6}
            className="pl-9"
            value={adminCode}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setAdminCode(event.target.value)
            }
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in to admin
      </Button>
    </form>
  );
}
