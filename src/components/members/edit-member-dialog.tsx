"use client";

import React, { useState, useTransition } from "react";
import { Edit2, Loader2, AlertCircle, User, Phone, Building } from "lucide-react";
import { updateMemberAction, type MemberActionResult } from "@/app/actions/members";
import type { User as MemberUser, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditMemberDialogProps {
  member: MemberUser;
  variant?: "button" | "icon";
}

export function EditMemberDialog({ member, variant = "button" }: EditMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(member.fullName);
  const [role, setRole] = useState(member.role);
  const [phone, setPhone] = useState(member.phone || "");
  const [department, setDepartment] = useState(member.department || "");
  const [gradeClass, setGradeClass] = useState(member.gradeClass || "");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MemberActionResult | null>(null);

  const handleOpen = () => {
    setFullName(member.fullName);
    setRole(member.role);
    setPhone(member.phone || "");
    setDepartment(member.department || "");
    setGradeClass(member.gradeClass || "");
    setState(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("role", role);
    formData.set("phone", phone);
    formData.set("department", department);
    formData.set("gradeClass", gradeClass);

    startTransition(async () => {
      const res = await updateMemberAction(member.id, null, formData);
      if (res?.error || res?.fieldErrors) {
        setState(res);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Edit ${member.fullName}`}
          title="Edit Member"
          className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
        >
          <Edit2 className="size-3" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="gap-1.5 shadow-xs"
        >
          <Edit2 className="size-3.5" />
          <span>Edit Profile</span>
        </Button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-member-title"
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
                    <Edit2 className="size-3.5" />
                  </div>
                  <h3 id="edit-member-title" className="text-base font-bold text-zinc-900">
                    Edit Member Profile
                  </h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Updating institutional details for <strong className="text-zinc-800">{member.fullName}</strong> ({member.memberCode}).
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
                <label htmlFor="editFullName" className="text-xs font-semibold text-zinc-900">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="editFullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending}
                    required
                    className="pl-8 text-xs"
                  />
                </div>
                {state?.fieldErrors?.fullName && (
                  <p className="text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
                )}
              </div>

              {/* Role & Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="editRole" className="text-xs font-semibold text-zinc-900">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="editRole"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="student">Student (3 Loans / 14 Days)</option>
                    <option value="staff">Staff / Faculty (10 Loans / 30 Days)</option>
                    <option value="librarian">Librarian (Staff Admin)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="editPhone" className="text-xs font-semibold text-zinc-900">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="editPhone"
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
                  <label htmlFor="editDepartment" className="text-xs font-semibold text-zinc-900">
                    Department / Faculty
                  </label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="editDepartment"
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
                  <label htmlFor="editGradeClass" className="text-xs font-semibold text-zinc-900">
                    Grade / Section / Class
                  </label>
                  <Input
                    id="editGradeClass"
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
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
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
