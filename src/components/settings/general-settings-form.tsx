// src/components/settings/general-settings-form.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGeneralSettingsAction } from "@/app/actions/settings";

interface GeneralSettings {
  institutionName: string;
  contactEmail: string;
  contactPhone: string;
  operatingHours: string;
  address: string;
}

interface GeneralSettingsFormProps {
  initialData: GeneralSettings;
}

export function GeneralSettingsForm({ initialData }: GeneralSettingsFormProps) {
  const [data, setData] = useState<GeneralSettings>(initialData);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("institutionName", data.institutionName);
      formData.set("contactEmail", data.contactEmail);
      formData.set("contactPhone", data.contactPhone);
      formData.set("operatingHours", data.operatingHours);
      formData.set("address", data.address);

      const res = await updateGeneralSettingsAction(null, formData);
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: res.message || "General settings saved!", type: "success" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Library Profile & Operating Information
          </CardTitle>
          <CardDescription>
            Institutional branding, official contact emails, and physical location details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Library / Institution Name
              </label>
              <Input
                value={data.institutionName}
                onChange={(e) => setData({ ...data, institutionName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Official Contact Email
              </label>
              <Input
                type="email"
                value={data.contactEmail}
                onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Contact Phone
              </label>
              <Input
                value={data.contactPhone}
                onChange={(e) => setData({ ...data, contactPhone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Operating Hours
              </label>
              <Input
                value={data.operatingHours}
                onChange={(e) => setData({ ...data, operatingHours: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Physical Campus Address
              </label>
              <Input
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
              />
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
                Saving...
              </>
            ) : (
              "Save Institutional Info"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
