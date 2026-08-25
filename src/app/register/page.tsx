"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  CreditCard,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { registerAction, type RegisterActionResult } from "@/app/actions/register";
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

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<
    RegisterActionResult | null,
    FormData
  >(registerAction, null);

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
            Create a new Student Library Account
          </p>
        </div>

        {/* Registration Card Form */}
        <Card className="border-zinc-200/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Register Account</CardTitle>
            <CardDescription>
              Enter your details below to create your student account
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Success Banner (e.g. Email confirmation required) */}
              {state?.successMessage && (
                <div
                  role="status"
                  className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    <span>Account Created</span>
                  </div>
                  <p className="text-xs leading-relaxed">{state.successMessage}</p>
                  <Link
                    href="/login"
                    className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-900 transition-colors"
                  >
                    Proceed to Sign In
                  </Link>
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

              {/* Full Name Input */}
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    required
                    disabled={isPending || !!state?.successMessage}
                    className="pl-9"
                    aria-describedby={
                      state?.fieldErrors?.fullName ? "fullName-error" : undefined
                    }
                  />
                </div>
                {state?.fieldErrors?.fullName && (
                  <p id="fullName-error" className="text-xs font-medium text-red-600">
                    {state.fieldErrors.fullName[0]}
                  </p>
                )}
              </div>

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
                    placeholder="jane.doe@school.edu"
                    autoComplete="email"
                    required
                    disabled={isPending || !!state?.successMessage}
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

              {/* Member Code / Student ID Input */}
              <div className="space-y-2">
                <label
                  htmlFor="memberCode"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Student ID / Member Code{" "}
                  <span className="text-xs text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="memberCode"
                    name="memberCode"
                    type="text"
                    placeholder="STU-123456 (Leave blank to auto-generate)"
                    disabled={isPending || !!state?.successMessage}
                    className="pl-9"
                    aria-describedby={
                      state?.fieldErrors?.memberCode ? "memberCode-error" : undefined
                    }
                  />
                </div>
                {state?.fieldErrors?.memberCode && (
                  <p id="memberCode-error" className="text-xs font-medium text-red-600">
                    {state.fieldErrors.memberCode[0]}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Password
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
                    disabled={isPending || !!state?.successMessage}
                    className="pl-9 pr-10"
                    aria-describedby={
                      state?.fieldErrors?.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending || !!state?.successMessage}
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
                  <p className="text-[11px] text-zinc-500">
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
                  Confirm Password
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
                    disabled={isPending || !!state?.successMessage}
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
                    disabled={isPending || !!state?.successMessage}
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
                disabled={isPending || !!state?.successMessage}
                className="w-full font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  "Create Student Account"
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Already have an account?{" "}
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

        {/* Security badge note */}
        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span>Server-assigned Student role & Active account status</span>
        </div>
      </div>
    </main>
  );
}
