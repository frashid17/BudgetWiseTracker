import { pgTable, text, serial, integer, boolean, date, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: text("theme").default("light"),
  highContrast: boolean("high_contrast").default(false),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  goals: many(goals),
  reminders: many(reminders),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isIncome: boolean("is_income").default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions)
}));

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  isIncome: boolean("is_income").default(false),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // monthly, weekly, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // Optional
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

// Savings Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 10, scale: 2 }).default("0"),
  dueDate: date("due_date"),
  isCompleted: boolean("is_completed").default(false),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  dueDate: date("due_date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  frequency: text("frequency"), // monthly, weekly, etc.
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  notificationSent: boolean("notification_sent").default(false),
});

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [reminders.categoryId],
    references: [categories.id],
  }),
}));

// CSV Import Settings
export const csvSettings = pgTable("csv_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: text("bank_name"),
  columnMapping: jsonb("column_mapping"), // JSON mapping of CSV columns
  skipHeader: boolean("skip_header").default(true),
  autoCategories: jsonb("auto_categories"), // Rules for auto-categorization
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertCategorySchema = createInsertSchema(categories);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertBudgetSchema = createInsertSchema(budgets);
export const insertGoalSchema = createInsertSchema(goals);
export const insertReminderSchema = createInsertSchema(reminders);

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type CsvSetting = typeof csvSettings.$inferSelect;

// CSV Upload types
export type CsvRow = {
  date: string;
  description: string;
  amount: string;
  category?: string;
  [key: string]: string | undefined;
};

// Transaction with category name
export type TransactionWithCategory = Transaction & {
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
};
