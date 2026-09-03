// src/components/settings/policy-settings-form.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Sliders, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePoliciesAction } from "@/app/actions/settings";
import { LibraryPolicy } from "@/config/site";

interface PolicySettingsFormProps {
  policies: {
    student: LibraryPolicy;
    staff: LibraryPolicy;
  };
}

export function PolicySettingsForm({ policies }: PolicySettingsFormProps) {
  const [student, setStudent] = useState(policies.student);
  const [staff, setStaff] = useState(policies.staff);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("student_maxActiveLoans", student.maxActiveLoans.toString());
      formData.set("student_loanDurationDays", student.loanDurationDays.toString());
      formData.set("student_maxRenewals", student.maxRenewals.toString());
      formData.set("student_finePerDay", (student.finePerDayCents / 100).toFixed(2));
      formData.set("student_gracePeriodDays", student.gracePeriodDays.toString());

      formData.set("staff_maxActiveLoans", staff.maxActiveLoans.toString());
      formData.set("staff_loanDurationDays", staff.loanDurationDays.toString());
      formData.set("staff_maxRenewals", staff.maxRenewals.toString());
      formData.set("staff_finePerDay", (staff.finePerDayCents / 100).toFixed(2));
      formData.set("staff_gracePeriodDays", staff.gracePeriodDays.toString());

      const res = await updatePoliciesAction(null, formData);
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: res.message || "Policies saved successfully!", type: "success" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Borrowing Policies & Fines Rules
          </CardTitle>
          <CardDescription>
            Configure checkout durations, loan limits, renewal caps, and late fee rates per role.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-center gap-2 animate-in fade-in ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Student Policy Block */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Student Role Policies
              </h4>
              <span className="text-xs text-zinc-500">Applies to all student borrowers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Max Active Loans</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={student.maxActiveLoans}
                  onChange={(e) =>
                    setStudent({ ...student, maxActiveLoans: parseInt(e.target.value) || 1 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Loan Duration (Days)</label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={student.loanDurationDays}
                  onChange={(e) =>
                    setStudent({ ...student, loanDurationDays: parseInt(e.target.value) || 1 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Max Renewals</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.maxRenewals}
                  onChange={(e) =>
                    setStudent({ ...student, maxRenewals: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Fine / Day ($)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.00"
                  max="10.00"
                  value={(student.finePerDayCents / 100).toFixed(2)}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      finePerDayCents: Math.round(parseFloat(e.target.value || "0") * 100),
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Grace Period (Days)</label>
                <Input
                  type="number"
                  min="0"
                  max="14"
                  value={student.gracePeriodDays}
                  onChange={(e) =>
                    setStudent({ ...student, gracePeriodDays: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Staff Policy Block */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Staff & Faculty Policies
              </h4>
              <span className="text-xs text-zinc-500">Applies to teachers, instructors, and staff</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Max Active Loans</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={staff.maxActiveLoans}
                  onChange={(e) =>
                    setStaff({ ...staff, maxActiveLoans: parseInt(e.target.value) || 1 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Loan Duration (Days)</label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={staff.loanDurationDays}
                  onChange={(e) =>
                    setStaff({ ...staff, loanDurationDays: parseInt(e.target.value) || 1 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Max Renewals</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={staff.maxRenewals}
                  onChange={(e) =>
                    setStaff({ ...staff, maxRenewals: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Fine / Day ($)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.00"
                  max="10.00"
                  value={(staff.finePerDayCents / 100).toFixed(2)}
                  onChange={(e) =>
                    setStaff({
                      ...staff,
                      finePerDayCents: Math.round(parseFloat(e.target.value || "0") * 100),
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Grace Period (Days)</label>
                <Input
                  type="number"
                  min="0"
                  max="14"
                  value={staff.gracePeriodDays}
                  onChange={(e) =>
                    setStaff({ ...staff, gracePeriodDays: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 p-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving Policies...
              </>
            ) : (
              "Save Policy Rules"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
