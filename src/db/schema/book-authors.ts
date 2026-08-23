import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { books } from "./books";
import { authors } from "./authors";

export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.authorId] }),
  ]
);
