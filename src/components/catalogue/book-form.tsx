"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Bookmark,
  Users,
  Building,
  Layers,
  ArrowLeft,
} from "lucide-react";
import {
  createBookAction,
  updateBookAction,
  type CatalogueActionResult,
} from "@/app/actions/catalogue";
import type { Category, Author, Publisher, BookWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookFormProps {
  mode: "create" | "edit";
  initialData?: BookWithRelations;
  categories: Category[];
  authors: Author[];
  publishers: Publisher[];
}

export function BookForm({
  mode,
  initialData,
  categories,
  authors,
  publishers,
}: BookFormProps) {
  // Select active action handler
  const actionHandler =
    mode === "create"
      ? createBookAction
      : updateBookAction.bind(null, initialData?.id || "");

  const [state, formAction, isPending] = useActionState<
    CatalogueActionResult | null,
    FormData
  >(actionHandler, null);

  // Selected author IDs state for interactive toggling
  const initialAuthorIds =
    initialData?.authors?.map((a) => a.id) ||
    (initialData?.id ? [] : authors.length > 0 ? [authors[0].id] : []);

  const [selectedAuthorIds, setSelectedAuthorIds] =
    useState<string[]>(initialAuthorIds);

  // Inline dynamic creation inputs
  const [showNewAuthorInput, setShowNewAuthorInput] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showNewPublisherInput, setShowNewPublisherInput] = useState(false);
  const [newPublisherName, setNewPublisherName] = useState("");

  const toggleAuthor = (id: string) => {
    if (selectedAuthorIds.includes(id)) {
      setSelectedAuthorIds(selectedAuthorIds.filter((item) => item !== id));
    } else {
      setSelectedAuthorIds([...selectedAuthorIds, id]);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={initialData ? `/catalogue/${initialData.id}` : "/catalogue"}
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              {mode === "create" ? "Add New Catalogue Title" : "Edit Catalogue Title"}
            </h1>
            <p className="text-xs text-zinc-500">
              {mode === "create"
                ? "Register a new book record and optional initial physical copies."
                : `Update metadata for "${initialData?.title}".`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={initialData ? `/catalogue/${initialData.id}` : "/catalogue"}
          >
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : mode === "create" ? (
              <>
                <Plus className="size-3.5" />
                <span>Save Book</span>
              </>
            ) : (
              <span>Update Book</span>
            )}
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-800"
        >
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Core Book Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Information Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-zinc-700" />
                General Information
              </CardTitle>
              <CardDescription>
                Essential title, subtitle, and description fields
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="title"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Book Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={initialData?.title || ""}
                  placeholder="e.g. Introduction to Algorithms"
                  required
                  disabled={isPending}
                  aria-describedby={
                    state?.fieldErrors?.title ? "title-error" : undefined
                  }
                />
                {state?.fieldErrors?.title && (
                  <p id="title-error" className="text-xs text-red-600">
                    {state.fieldErrors.title[0]}
                  </p>
                )}
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subtitle"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Subtitle (Optional)
                </label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  defaultValue={initialData?.subtitle || ""}
                  placeholder="e.g. Fourth Edition"
                  disabled={isPending}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="description"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Book Synopsis / Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={initialData?.description || ""}
                  placeholder="Enter a brief summary or table of contents..."
                  disabled={isPending}
                  className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Authors Selection Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4 text-zinc-700" />
                  Authors & Contributors <span className="text-red-500">*</span>
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewAuthorInput(!showNewAuthorInput)}
                  className="h-7 text-xs gap-1"
                >
                  {showNewAuthorInput ? <X className="size-3" /> : <Plus className="size-3" />}
                  <span>{showNewAuthorInput ? "Cancel" : "New Author"}</span>
                </Button>
              </div>
              <CardDescription>
                Select one or more authors or register a new one
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Hidden Inputs for selected author IDs */}
              {selectedAuthorIds.map((id) => (
                <input key={id} type="hidden" name="authorIds" value={id} />
              ))}

              {/* On-the-fly Author Input */}
              {showNewAuthorInput && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                  <label
                    htmlFor="newAuthorName"
                    className="text-xs font-semibold text-amber-900"
                  >
                    Quick Add Author Name
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="newAuthorName"
                      name="newAuthorName"
                      value={newAuthorName}
                      onChange={(e) => setNewAuthorName(e.target.value)}
                      placeholder="e.g. Donald E. Knuth"
                      className="bg-white text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-amber-700">
                    This author will be automatically created and assigned to this book.
                  </p>
                </div>
              )}

              {/* Author Chips / Checkbox List */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-600">
                  Select from existing authors:
                </div>

                {authors.length === 0 && !showNewAuthorInput ? (
                  <p className="text-xs text-zinc-400 italic">
                    No authors in database yet. Use &ldquo;New Author&rdquo; above.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {authors.map((author) => {
                      const isSelected = selectedAuthorIds.includes(author.id);
                      return (
                        <button
                          key={author.id}
                          type="button"
                          onClick={() => toggleAuthor(author.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "border-zinc-900 bg-zinc-900 text-zinc-50 shadow-xs"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <span>{author.name}</span>
                          {isSelected && <X className="size-3 text-zinc-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {state?.fieldErrors?.authorIds && (
                  <p className="text-xs text-red-600">
                    {state.fieldErrors.authorIds[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publishing & Classification Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="size-4 text-zinc-700" />
                Publication & Classification
              </CardTitle>
              <CardDescription>
                Category, publisher, language, pages, and call number
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="categoryId"
                      className="text-xs font-semibold text-zinc-900"
                    >
                      Category / Genre
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 underline"
                    >
                      {showNewCategoryInput ? "Choose Existing" : "+ New Category"}
                    </button>
                  </div>

                  {showNewCategoryInput ? (
                    <Input
                      id="newCategoryName"
                      name="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="text-xs"
                    />
                  ) : (
                    <select
                      id="categoryId"
                      name="categoryId"
                      defaultValue={initialData?.categoryId || ""}
                      disabled={isPending}
                      className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Publisher Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="publisherId"
                      className="text-xs font-semibold text-zinc-900"
                    >
                      Publisher
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPublisherInput(!showNewPublisherInput)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 underline"
                    >
                      {showNewPublisherInput ? "Choose Existing" : "+ New Publisher"}
                    </button>
                  </div>

                  {showNewPublisherInput ? (
                    <Input
                      id="newPublisherName"
                      name="newPublisherName"
                      value={newPublisherName}
                      onChange={(e) => setNewPublisherName(e.target.value)}
                      placeholder="e.g. MIT Press"
                      className="text-xs"
                    />
                  ) : (
                    <select
                      id="publisherId"
                      name="publisherId"
                      defaultValue={initialData?.publisherId || ""}
                      disabled={isPending}
                      className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Publisher --</option>
                      {publishers.map((pub) => (
                        <option key={pub.id} value={pub.id}>
                          {pub.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Publish Year */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="publishYear"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Publication Year
                  </label>
                  <Input
                    id="publishYear"
                    name="publishYear"
                    type="number"
                    min={1000}
                    max={new Date().getFullYear() + 1}
                    defaultValue={initialData?.publishYear || ""}
                    placeholder="e.g. 2022"
                    disabled={isPending}
                  />
                  {state?.fieldErrors?.publishYear && (
                    <p className="text-xs text-red-600">
                      {state.fieldErrors.publishYear[0]}
                    </p>
                  )}
                </div>

                {/* Edition */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="edition"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Edition
                  </label>
                  <Input
                    id="edition"
                    name="edition"
                    defaultValue={initialData?.edition || ""}
                    placeholder="e.g. 3rd Edition"
                    disabled={isPending}
                  />
                </div>

                {/* Pages */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="pages"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Number of Pages
                  </label>
                  <Input
                    id="pages"
                    name="pages"
                    type="number"
                    min={1}
                    defaultValue={initialData?.pages || ""}
                    placeholder="e.g. 1312"
                    disabled={isPending}
                  />
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="language"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Language
                  </label>
                  <Input
                    id="language"
                    name="language"
                    defaultValue={initialData?.language || "English"}
                    placeholder="e.g. English"
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Identification & Initial Copies */}
        <div className="space-y-6">
          {/* Identifiers Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bookmark className="size-4 text-zinc-700" />
                Identifiers & Codes
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* ISBN */}
              <div className="space-y-1.5">
                <label
                  htmlFor="isbn"
                  className="text-xs font-semibold text-zinc-900"
                >
                  ISBN-10 / ISBN-13 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="isbn"
                  name="isbn"
                  defaultValue={initialData?.isbn || ""}
                  placeholder="978-0262033848"
                  required
                  disabled={isPending}
                  aria-describedby={
                    state?.fieldErrors?.isbn ? "isbn-error" : undefined
                  }
                />
                {state?.fieldErrors?.isbn && (
                  <p id="isbn-error" className="text-xs text-red-600">
                    {state.fieldErrors.isbn[0]}
                  </p>
                )}
              </div>

              {/* Call Number */}
              <div className="space-y-1.5">
                <label
                  htmlFor="callNumber"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Classification / Call Number
                </label>
                <Input
                  id="callNumber"
                  name="callNumber"
                  defaultValue={initialData?.callNumber || ""}
                  placeholder="QA76.6 .C66 2009"
                  disabled={isPending}
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="coverImageUrl"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Cover Image URL
                </label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
                  defaultValue={initialData?.coverImageUrl || ""}
                  placeholder="https://images.example.com/cover.jpg"
                  disabled={isPending}
                />
                {state?.fieldErrors?.coverImageUrl && (
                  <p className="text-xs text-red-600">
                    {state.fieldErrors.coverImageUrl[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Initial Inventory Copies Card (only shown when creating) */}
          {mode === "create" && (
            <Card className="border-zinc-200 shadow-sm bg-zinc-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="size-4 text-zinc-700" />
                  Initial Copies Inventory
                </CardTitle>
                <CardDescription>
                  Automatically generate barcodes and physical copy items
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="initialCopies"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Number of Copies to Add
                  </label>
                  <Input
                    id="initialCopies"
                    name="initialCopies"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={1}
                    disabled={isPending}
                    className="bg-white"
                  />
                  {state?.fieldErrors?.initialCopies && (
                    <p className="text-xs text-red-600">
                      {state.fieldErrors.initialCopies[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="shelfLocation"
                    className="text-xs font-semibold text-zinc-900"
                  >
                    Default Shelf Location
                  </label>
                  <Input
                    id="shelfLocation"
                    name="shelfLocation"
                    defaultValue="General Stacks - Shelf A1"
                    placeholder="e.g. Fiction Section A-3"
                    disabled={isPending}
                    className="bg-white"
                  />
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-3 text-[11px] text-zinc-500 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-zinc-700">
                    <Badge variant="outline" className="text-[10px]">
                      Auto-Barcode
                    </Badge>
                  </div>
                  <p>
                    Physical copies will be assigned unique tracked barcodes like{" "}
                    <code className="font-mono text-zinc-700">BC-ISBN-1-XXXX</code>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
