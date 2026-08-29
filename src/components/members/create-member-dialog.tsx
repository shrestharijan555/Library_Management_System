"use client";

import React, { useState, useTransition } from "react";
import { UserPlus, Loader2, AlertCircle, User, Mail, CreditCard, Phone, Building } from "lucide-react";
import { createMemberAction, type MemberActionResult } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateMemberDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [role, setRole] = useState("student");
  const [status, setStatus] = useState("active");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [gradeClass, setGradeClass] = useState("");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MemberActionResult | null>(null);

  const handleOpen = () => {
    setFullName("");
    setEmail("");
    setMemberCode("");
    setRole("student");
    setStatus("active");
    setPhone("");
    setDepartment("");
    setGradeClass("");
    setState(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("email", email);
    formData.set("memberCode", memberCode);
    formData.set("role", role);
    formData.set("status", status);
    formData.set("phone", phone);
    formData.set("department", department);
    formData.set("gradeClass", gradeClass);

    startTransition(async () => {
      const res = await createMemberAction(null, formData);
      if (res?.error || res?.fieldErrors) {
        setState(res);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 shadow-xs"
      >
        <UserPlus className="size-3.5" />
        <span>Add Member</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-member-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isPending && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
                    <UserPlus className="size-3.5" />
                  </div>
                  <h3 id="create-member-title" className="text-base font-bold text-zinc-900">
                    Register Library Member
                  </h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Add a student, faculty staff, or librarian account into the institution database.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Global Error Banner */}
              {state?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-zinc-900">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    disabled={isPending}
                    required
                    className="pl-8 text-xs"
                  />
                </div>
                {state?.fieldErrors?.fullName && (
                  <p className="text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-zinc-900">
                  Institutional Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. eleanor@institution.edu"
                    disabled={isPending}
                    required
                    className="pl-8 text-xs"
                  />
                </div>
                {state?.fieldErrors?.email && (
                  <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Role & Status Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Role */}
                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-xs font-semibold text-zinc-900">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="student">Student (3 Loans / 14 Days)</option>
                    <option value="staff">Staff / Faculty (10 Loans / 30 Days)</option>
                    <option value="librarian">Librarian (Staff Admin)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                {/* Account Status */}
                <div className="space-y-1.5">
                  <label htmlFor="status" className="text-xs font-semibold text-zinc-900">
                    Account Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active (Full Borrowing Rights)</option>
                    <option value="suspended">Suspended (Borrowing Blocked)</option>
                    <option value="inactive">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              {/* Member Code (Optional) & Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Member Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="memberCode" className="text-xs font-semibold text-zinc-900">
                      Member ID / Code
                    </label>
                    <span className="text-[10px] text-zinc-400">Auto if blank</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="memberCode"
                      name="memberCode"
                      value={memberCode}
                      onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STU-2026-001"
                      disabled={isPending}
                      className="pl-8 font-mono text-xs"
                    />
                  </div>
                  {state?.fieldErrors?.memberCode && (
                    <p className="text-xs text-red-600">{state.fieldErrors.memberCode[0]}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-zinc-900">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      disabled={isPending}
                      className="pl-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Department & Grade / Class */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="department" className="text-xs font-semibold text-zinc-900">
                    Department / Faculty
                  </label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="department"
                      name="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      disabled={isPending}
                      className="pl-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gradeClass" className="text-xs font-semibold text-zinc-900">
                    Grade / Section / Class
                  </label>
                  <Input
                    id="gradeClass"
                    name="gradeClass"
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder="e.g. Year 2 / Section B"
                    disabled={isPending}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      <span>Register Member</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
