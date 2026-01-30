import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, Mail, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import shieldLogo from "@/assets/shield-logo.svg";
import nameLogo from "@/assets/name-logo.svg";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create your account"), [mode]);
  const description = useMemo(
    () => (mode === "login" ? "Sign in to access your client data." : "Sign up to start tracking client anniversaries."),
    [mode]
  );

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You're now signed in." });
        navigate("/", { replace: true });
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Check your email to verify your account, then sign in.",
      });
      setMode("login");
    } catch (e: any) {
      let errorMessage = e?.message ?? "Something went wrong. Please try again.";
      
      // Handle common auth errors with friendly messages
      if (e?.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (e?.message?.includes("User already registered")) {
        errorMessage = "This email is already registered. Try signing in instead.";
      } else if (e?.message?.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before signing in.";
      }

      toast({
        title: "Authentication error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src={shieldLogo} alt="KeyKeep" className="w-12 h-12" />
        <img src={nameLogo} alt="KeyKeep" className="h-8 dark:invert" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@company.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          placeholder="••••••••"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline underline-offset-4"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline underline-offset-4"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
        Your data is stored locally on your device and works offline. 
        Sign in to enable cloud backup for cross-device sync.
      </p>
    </div>
  );
}
