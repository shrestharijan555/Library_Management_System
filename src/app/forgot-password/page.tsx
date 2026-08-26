"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import {
  forgotPasswordAction,
  type RecoveryActionResult,
} from "@/app/actions/recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<
    RecoveryActionResult | null,
    FormData
  >(forgotPasswordAction, null);

  const [emailValue, setEmailValue] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 shadow-md">
            <BookOpen className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Reset your account password
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-zinc-200/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <KeyRound className="size-5 text-zinc-700" />
              Forgot Password
            </CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Success Banner */}
              {state?.successMessage && (
                <div
                  role="status"
                  className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    <span>Reset Link Sent</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {state.successMessage}
                  </p>
                </div>
              )}

              {/* Global Error Banner */}
              {state?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-800"
                >
                  <AlertCircle className="size-5 shrink-0 text-red-600" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@school.edu"
                    autoComplete="email"
                    required
                    disabled={isPending || !!state?.successMessage}
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="pl-9"
                    aria-describedby={
                      state?.fieldErrors?.email ? "email-error" : undefined
                    }
                  />
                </div>
                {state?.fieldErrors?.email && (
                  <p id="email-error" className="text-xs font-medium text-red-600">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending || !!state?.successMessage}
                className="w-full font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  "Send Password Reset Link"
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
                >
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400">
          EduLibrary Management System &bull; Secure Authentication
        </p>
      </div>
    </main>
  );
}
