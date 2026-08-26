"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  resetPasswordAction,
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

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<
    RecoveryActionResult | null,
    FormData
  >(resetPasswordAction, null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            Set a new password for your account
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="border-zinc-200/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="size-5 text-zinc-700" />
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it meets the security
              requirements.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Success Banner — shown briefly before redirect */}
              {state?.successMessage && (
                <div
                  role="status"
                  className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    <span>Password Updated</span>
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

              {/* New Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isPending}
                    className="pl-9 pr-10"
                    aria-describedby={
                      state?.fieldErrors?.password
                        ? "password-error"
                        : "password-hint"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state?.fieldErrors?.password ? (
                  <p id="password-error" className="text-xs font-medium text-red-600">
                    {state.fieldErrors.password[0]}
                  </p>
                ) : (
                  <p id="password-hint" className="text-[11px] text-zinc-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isPending}
                    className="pl-9 pr-10"
                    aria-describedby={
                      state?.fieldErrors?.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state?.fieldErrors?.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-xs font-medium text-red-600"
                  >
                    {state.fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500">
                <Link
                  href="/login"
                  className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
                >
                  Return to Sign In
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
