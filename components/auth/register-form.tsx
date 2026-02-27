 "use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type RegisterFormProps = {
  onAccountExists?: () => void;
};

export function RegisterForm(props: RegisterFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim()
          }
        }
      });
      if (error) {
        const message = error.message || "Unable to create an account right now";
        toast.error(message);
        if (message.toLowerCase().includes("already registered")) {
          props.onAccountExists?.();
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const trimmedName = fullName.trim();
        const metaFullName =
          (data.user.user_metadata?.full_name as string | undefined) ||
          (data.user.user_metadata?.name as string | undefined) ||
          null;

        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            full_name: trimmedName || metaFullName,
            role: "student"
          },
          { onConflict: "id" }
        );
      }

      const needsEmailConfirmation = !data.session;
      if (needsEmailConfirmation) {
        toast.success("Account created. Please check your email to confirm.");
        router.push("/auth/login");
      } else {
        toast.success("Account created. Welcome!");
        router.push("/student");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create an account right now";
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <User className="h-4 w-4" />
          </span>
          <Input
            id="fullName"
            autoComplete="name"
            required
            className="pl-9"
            value={fullName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFullName(event.target.value)
            }
          />
        </div>
      </div>
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
            autoComplete="new-password"
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
        Create account
      </Button>
    </form>
  );
}
