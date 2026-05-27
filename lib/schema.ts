import {
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  book: varchar("book", { length: 255 }).notNull(),
  author: varchar("author", { length: 128 }).notNull().default("Виктор Пелевин"),
  language: varchar("language", { length: 32 }).notNull().default("Russian"),
  category: varchar("category", { length: 64 }),
  length: integer("length"),
});

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
