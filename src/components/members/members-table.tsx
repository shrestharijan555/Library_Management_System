"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  CreditCard,
  Building,
  CheckCircle2,
  AlertOctagon,
  UserX,
  BookMarked,
  Receipt,
  Eye,
} from "lucide-react";
import type { User as MemberUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditMemberDialog } from "./edit-member-dialog";

export interface EnrichedMemberItem extends MemberUser {
  activeLoansCount: number;
  unpaidFinesCents: number;
}

interface MembersTableProps {
  members: EnrichedMemberItem[];
  currentUser: MemberUser;
  canEdit: boolean;
}

export function MembersTable({ members, currentUser, canEdit }: MembersTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "librarian":
        return "default" as const;
      case "staff":
        return "info" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="size-3" />
            <span>Active</span>
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertOctagon className="size-3" />
            <span>Suspended</span>
          </Badge>
        );
      case "inactive":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] text-zinc-600">
            <UserX className="size-3" />
            <span>Inactive</span>
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-3.5 pl-4 pr-3 sm:pl-6">Member</th>
              <th className="px-3 py-3.5">Member ID</th>
              <th className="px-3 py-3.5">Role</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Department / Class</th>
              <th className="px-3 py-3.5 text-center">Active Loans</th>
              <th className="px-3 py-3.5 text-center">Fines Balance</th>
              <th className="px-3 py-3.5">Joined</th>
              <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {members.map((member) => {
              const isSelf = member.id === currentUser.id;
              return (
                <tr key={member.id} className="hover:bg-zinc-50/70 transition-colors">
                  {/* Member Name + Email + Avatar */}
                  <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-bold text-zinc-50 text-[11px]">
                        {getInitials(member.fullName)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/members/${member.id}`}
                          className="font-bold text-zinc-900 hover:underline hover:text-zinc-950 truncate block"
                        >
                          {member.fullName}
                          {isSelf && (
                            <span className="ml-1.5 rounded bg-zinc-100 px-1 py-0.2 text-[9px] font-semibold text-zinc-600">
                              You
                            </span>
                          )}
                        </Link>
                        <span className="text-[11px] text-zinc-400 truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Member Code */}
                  <td className="px-3 py-3.5">
                    <div className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                      <CreditCard className="size-3 text-zinc-400" />
                      <span>{member.memberCode}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-3 py-3.5">
                    <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize text-[10px]">
                      <Shield className="mr-1 size-2.5 inline" />
                      {member.role}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    {getStatusBadge(member.status)}
                  </td>

                  {/* Department / Class */}
                  <td className="px-3 py-3.5 text-zinc-600">
                    <div className="flex items-center gap-1">
                      <Building className="size-3 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {member.department || member.gradeClass || "General"}
                      </span>
                    </div>
                  </td>

                  {/* Active Loans */}
                  <td className="px-3 py-3.5 text-center">
                    {member.activeLoansCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                        <BookMarked className="size-3 text-zinc-600" />
                        <span>{member.activeLoansCount}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Fines */}
                  <td className="px-3 py-3.5 text-center">
                    {member.unpaidFinesCents > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                        <Receipt className="size-3" />
                        <span>${(member.unpaidFinesCents / 100).toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium text-[11px]">$0.00</span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-3 py-3.5 text-zinc-500 whitespace-nowrap text-[11px]">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                          <Eye className="size-3" />
                          <span>View</span>
                        </Button>
                      </Link>

                      {canEdit && (
                        <EditMemberDialog member={member} variant="icon" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
