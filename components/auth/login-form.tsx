 "use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type LoginFormProps = {
  onSuggestRegister?: () => void;
};

export function LoginForm(props: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        const message = error.message || "Unable to sign in right now";
        toast.error(message);
        if (message.toLowerCase().includes("invalid login credentials")) {
          props.onSuggestRegister?.();
        }
        setLoading(false);
        return;
      }
      toast.success("Welcome back to TFT Bible Class");
      router.push("/student");
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
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Mail className="h-4 w-4" />
          </span>
          <Input
            id="email"
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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Lock className="h-4 w-4" />
          </span>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            className="pl-9"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
