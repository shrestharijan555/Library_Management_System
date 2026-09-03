// scripts/seed-db.ts
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "../src/db/schema";
import { DEMO_ACCOUNTS } from "../src/config/demo-accounts";
import { DEFAULT_LIBRARY_POLICIES } from "../src/config/site";

async function main() {
  console.log("🌱 Starting EduLibrary Database Seed...");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is missing!");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: isLocal ? false : "require",
    connect_timeout: 10,
  });
  const db = drizzle(client, { schema });

  let adminSupabase: ReturnType<typeof createClient> | null = null;
  if (supabaseUrl && serviceRoleKey) {
    adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // 1. Seed Demo Users in Supabase Auth & PostgreSQL
  console.log("👤 Seeding demo users in Supabase Auth & PostgreSQL...");
  const seededUsers: Record<string, string> = {};

  for (const acc of DEMO_ACCOUNTS) {
    let authUserId: string = "";

    if (adminSupabase) {
      try {
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.fullName },
        });

        if (authData?.user) {
          authUserId = authData.user.id;
        } else if (authError) {
          const { data: listData } = await adminSupabase.auth.admin.listUsers();
          const existing = listData?.users?.find(
            (u) => u.email?.toLowerCase() === acc.email.toLowerCase()
          );
          if (existing) {
            authUserId = existing.id;
            await adminSupabase.auth.admin.updateUserById(existing.id, {
              password: acc.password,
              email_confirm: true,
            });
          }
        }
      } catch (err) {
        console.warn(`Supabase Auth creation warning for ${acc.email}:`, err);
      }
    }

    if (!authUserId) {
      authUserId = crypto.randomUUID();
    }

    const existingDbUser = await db.query.users.findFirst({
      where: eq(schema.users.email, acc.email),
    });

    if (!existingDbUser) {
      const [inserted] = await db
        .insert(schema.users)
        .values({
          supabaseAuthId: authUserId,
          email: acc.email,
          fullName: acc.fullName,
          memberCode: acc.memberCode,
          role: acc.role,
          status: "active",
          department: "department" in acc ? acc.department : null,
          gradeLevel: "gradeLevel" in acc ? acc.gradeLevel : null,
        })
        .returning();
      seededUsers[acc.role] = inserted.id;
    } else {
      await db
        .update(schema.users)
        .set({
          supabaseAuthId: authUserId,
          role: acc.role,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingDbUser.id));
      seededUsers[acc.role] = existingDbUser.id;
    }
  }
  console.log("✅ Seeded demo accounts:", Object.keys(seededUsers));

  // 2. Seed System Settings & Policies
  console.log("⚙️ Seeding system policies and institutional settings...");
  await db
    .insert(schema.systemSettings)
    .values([
      {
        key: "library_policies",
        value: JSON.stringify(DEFAULT_LIBRARY_POLICIES),
      },
      {
        key: "general_info",
        value: JSON.stringify({
          libraryName: "Central Academy Library",
          contactEmail: "library@centralacademy.edu",
          contactPhone: "+1 (555) 234-5678",
          operatingHours: "Mon - Fri: 8:00 AM - 8:00 PM, Sat: 9:00 AM - 4:00 PM",
          address: "Building B, Central Campus, 100 University Ave",
        }),
      },
    ])
    .onConflictDoNothing();

  // 3. Seed Categories
  console.log("🏷️ Seeding categories...");
  const categoryData = [
    { name: "Computer Science & Engineering", slug: "computer-science", description: "Software architecture, algorithms, AI, and systems programming." },
    { name: "Mathematics & Statistics", slug: "mathematics", description: "Calculus, linear algebra, discrete math, and probability." },
    { name: "Literature & Fiction", slug: "literature-fiction", description: "Classic novels, contemporary fiction, poetry, and world literature." },
    { name: "Science & Physics", slug: "science-physics", description: "Physics, astronomy, biology, and chemistry research." },
    { name: "History & Social Sciences", slug: "history-social-sciences", description: "World history, economics, philosophy, and political sciences." },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, cat.slug),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.categories).values(cat).returning();
      categoryMap[cat.slug] = inserted.id;
    } else {
      categoryMap[cat.slug] = existing.id;
    }
  }

  // 4. Seed Authors
  console.log("✍️ Seeding authors...");
  const authorData = [
    { name: "Robert C. Martin", bio: "Software engineer and author of clean code principles." },
    { name: "Martin Fowler", bio: "Software developer, author, and international speaker on enterprise software design." },
    { name: "Donald E. Knuth", bio: "Computer scientist, mathematician, and professor emeritus at Stanford University." },
    { name: "Yuval Noah Harari", bio: "Historian, philosopher, and bestselling author of Sapiens." },
    { name: "F. Scott Fitzgerald", bio: "American novelist and short story writer widely regarded as one of the greatest writers of the 20th century." },
    { name: "Richard P. Feynman", bio: "Theoretical physicist known for quantum electrodynamics and Feynman lectures on physics." },
  ];

  const authorMap: Record<string, string> = {};
  for (const auth of authorData) {
    const existing = await db.query.authors.findFirst({
      where: eq(schema.authors.name, auth.name),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.authors).values(auth).returning();
      authorMap[auth.name] = inserted.id;
    } else {
      authorMap[auth.name] = existing.id;
    }
  }

  // 5. Seed Publishers
  console.log("🏢 Seeding publishers...");
  const publisherData = [
    { name: "Prentice Hall", website: "https://www.pearson.com" },
    { name: "Addison-Wesley Professional", website: "https://www.informit.com" },
    { name: "Harper & Brothers", website: "https://www.harpercollins.com" },
    { name: "Charles Scribner's Sons", website: "https://www.simonandschuster.com" },
    { name: "Basic Books", website: "https://www.basicbooks.com" },
  ];

  const publisherMap: Record<string, string> = {};
  for (const pub of publisherData) {
    const existing = await db.query.publishers.findFirst({
      where: eq(schema.publishers.name, pub.name),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.publishers).values(pub).returning();
      publisherMap[pub.name] = inserted.id;
    } else {
      publisherMap[pub.name] = existing.id;
    }
  }

  // 6. Seed Books & Physical Copies
  console.log("📚 Seeding books and physical copies...");
  const booksToSeed = [
    {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      subtitle: "Writing Clean, Maintainable, and Agile Code",
      isbn: "9780132350884",
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
      coverImageUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?w=500&auto=format&fit=crop&q=60",
      publishYear: 2008,
      pages: 464,
      language: "English",
      categorySlug: "computer-science",
      authorName: "Robert C. Martin",
      publisherName: "Prentice Hall",
      callNumber: "QA76.76.C54 M37 2008",
      barcodes: ["BC-1001", "BC-1002", "BC-1003"],
      shelf: "Stack A - Shelf 01",
    },
    {
      title: "Refactoring: Improving the Design of Existing Code",
      subtitle: "Second Edition",
      isbn: "9780134757599",
      description: "For more than twenty years, experienced programmers worldwide have relied on Martin Fowler's Refactoring to improve the design of existing code.",
      coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
      publishYear: 2018,
      pages: 448,
      language: "English",
      categorySlug: "computer-science",
      authorName: "Martin Fowler",
      publisherName: "Addison-Wesley Professional",
      callNumber: "QA76.76.R42 F69 2018",
      barcodes: ["BC-2001", "BC-2002"],
      shelf: "Stack A - Shelf 02",
    },
    {
      title: "The Art of Computer Programming, Vol 1: Fundamental Algorithms",
      subtitle: "Third Edition",
      isbn: "9780201896831",
      description: "The bible of fundamental algorithms and computing science.",
      coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60",
      publishYear: 1997,
      pages: 672,
      language: "English",
      categorySlug: "computer-science",
      authorName: "Donald E. Knuth",
      publisherName: "Addison-Wesley Professional",
      callNumber: "QA76.6.K64 1997",
      barcodes: ["BC-3001", "BC-3002"],
      shelf: "Stack A - Shelf 03",
    },
    {
      title: "Sapiens: A Brief History of Humankind",
      subtitle: "From Animals into Gods",
      isbn: "9780062316097",
      description: "100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens.",
      coverImageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=60",
      publishYear: 2014,
      pages: 443,
      language: "English",
      categorySlug: "history-social-sciences",
      authorName: "Yuval Noah Harari",
      publisherName: "Harper & Brothers",
      callNumber: "CB113.H37 2014",
      barcodes: ["BC-4001", "BC-4002", "BC-4003"],
      shelf: "Stack C - Shelf 01",
    },
    {
      title: "The Great Gatsby",
      subtitle: "The Original 1925 Classic",
      isbn: "9780743273565",
      description: "The exemplary novel of the Jazz Age, capturing the romantic passion and disillusionment of the 1920s.",
      coverImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60",
      publishYear: 1925,
      pages: 180,
      language: "English",
      categorySlug: "literature-fiction",
      authorName: "F. Scott Fitzgerald",
      publisherName: "Charles Scribner's Sons",
      callNumber: "PS3511.I9 G7 1925",
      barcodes: ["BC-5001", "BC-5002"],
      shelf: "Stack D - Shelf 01",
    },
    {
      title: "Six Easy Pieces: Essentials of Physics Explained by Its Most Brilliant Teacher",
      subtitle: "Originally prepared for publication by Robert B. Leighton and Matthew Sands",
      isbn: "9780465025275",
      description: "Six accessible and revolutionary physics lectures by Nobel laureate Richard Feynman.",
      coverImageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&auto=format&fit=crop&q=60",
      publishYear: 1995,
      pages: 176,
      language: "English",
      categorySlug: "science-physics",
      authorName: "Richard P. Feynman",
      publisherName: "Basic Books",
      callNumber: "QC21.2.F49 1995",
      barcodes: ["BC-6001", "BC-6002"],
      shelf: "Stack B - Shelf 01",
    },
  ];

  for (const b of booksToSeed) {
    let book = await db.query.books.findFirst({
      where: eq(schema.books.isbn, b.isbn),
    });

    if (!book) {
      const [newBook] = await db
        .insert(schema.books)
        .values({
          title: b.title,
          subtitle: b.subtitle,
          isbn: b.isbn,
          description: b.description,
          coverImageUrl: b.coverImageUrl,
          publishYear: b.publishYear,
          pages: b.pages,
          language: b.language,
          categoryId: categoryMap[b.categorySlug],
          publisherId: publisherMap[b.publisherName],
          callNumber: b.callNumber,
          totalCopies: b.barcodes.length,
          availableCopies: b.barcodes.length,
        })
        .returning();
      book = newBook;

      // Link author
      if (authorMap[b.authorName]) {
        await db
          .insert(schema.bookAuthors)
          .values({
            bookId: book.id,
            authorId: authorMap[b.authorName],
          })
          .onConflictDoNothing();
      }

      // Create physical copies
      for (const barcode of b.barcodes) {
        await db
          .insert(schema.bookCopies)
          .values({
            bookId: book.id,
            barcode,
            shelfLocation: b.shelf,
            status: "available",
            conditionNotes: "Brand new acquisition in pristine condition.",
          })
          .onConflictDoNothing();
      }
    }
  }

  // 7. Seed Sample Active Loan & Reservation for Demonstration
  if (seededUsers.student) {
    const sampleCopy = await db.query.bookCopies.findFirst({
      where: eq(schema.bookCopies.barcode, "BC-1001"),
    });

    if (sampleCopy && sampleCopy.status === "available") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await db.insert(schema.loans).values({
        bookId: sampleCopy.bookId,
        copyId: sampleCopy.id,
        userId: seededUsers.student,
        issuedBy: seededUsers.librarian || seededUsers.admin || seededUsers.student,
        status: "active",
        dueDate,
      });

      await db
        .update(schema.bookCopies)
        .set({ status: "borrowed" })
        .where(eq(schema.bookCopies.id, sampleCopy.id));

      await db
        .update(schema.books)
        .set({ availableCopies: 2 })
        .where(eq(schema.books.id, sampleCopy.bookId));
      
      console.log("📖 Created sample active loan for student with copy BC-1001");
    }
  }

  console.log("🎉 Database seed completed successfully!");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed with error:", err);
  process.exit(1);
});
