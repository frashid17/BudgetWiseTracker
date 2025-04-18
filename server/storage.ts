import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  transactions, type Transaction, type InsertTransaction, type TransactionWithCategory,
  budgets, type Budget, type InsertBudget,
  goals, type Goal, type InsertGoal,
  reminders, type Reminder, type InsertReminder,
  csvSettings, type CsvSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, and, between, like, gte, desc, sql } from "drizzle-orm";

// Storage interface for all database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  changeUserPassword(id: number, currentPassword: string, newPassword: string): Promise<boolean>;
  
  // User Settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: { userId: number, theme?: string, highContrast?: boolean, language?: string }): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings>;
  
  // Category operations
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Transaction operations
  getTransactions(userId: number, filters?: {
    fromDate?: string;
    toDate?: string;
    categoryId?: number;
    search?: string;
  }): Promise<TransactionWithCategory[]>;
  getRecentTransactions(userId: number, limit?: number): Promise<TransactionWithCategory[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  importTransactions(userId: number, transactionsData: Partial<InsertTransaction>[]): Promise<number>;
  
  // Budget operations
  getBudgets(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  
  // Reminder operations
  getReminders(userId: number): Promise<Reminder[]>;
  getUpcomingReminders(userId: number, days?: number): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;
  
  // Dashboard data
  getDashboardBalance(userId: number): Promise<{
    currentBalance: number;
    income: number;
    expenses: number;
  }>;
  getSpendingTrends(userId: number, months: number): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]>;
  getCategorySpending(userId: number): Promise<{
    name: string;
    value: number;
    color: string;
  }[]>;
  
  // CSV settings
  getCsvSettings(userId: number): Promise<CsvSetting | undefined>;
  saveCsvSettings(userId: number, settings: Partial<CsvSetting>): Promise<CsvSetting>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private userSettingsMap: Map<number, UserSettings>;
  private categoriesMap: Map<number, Category>;
  private transactionsMap: Map<number, Transaction>;
  private budgetsMap: Map<number, Budget>;
  private goalsMap: Map<number, Goal>;
  private remindersMap: Map<number, Reminder>;
  private csvSettingsMap: Map<number, CsvSetting>;
  private nextId: { [key: string]: number };

  constructor() {
    this.usersMap = new Map();
    this.userSettingsMap = new Map();
    this.categoriesMap = new Map();
    this.transactionsMap = new Map();
    this.budgetsMap = new Map();
    this.goalsMap = new Map();
    this.remindersMap = new Map();
    this.csvSettingsMap = new Map();
    
    this.nextId = {
      users: 1,
      userSettings: 1,
      categories: 1,
      transactions: 1,
      budgets: 1,
      goals: 1,
      reminders: 1,
      csvSettings: 1
    };
    
    // Create default categories when initialized
    this.createDefaultCategories();
  }

  // Initialize with some default categories
  private async createDefaultCategories() {
    const defaultCategories = [
      { name: 'Income', icon: 'trending_up', color: '#66BB6A', isIncome: true },
      { name: 'Groceries', icon: 'shopping_bag', color: '#42A5F5' },
      { name: 'Dining', icon: 'restaurant', color: '#AB47BC' },
      { name: 'Transportation', icon: 'directions_car', color: '#FFA726' },
      { name: 'Housing', icon: 'home', color: '#1976D2' },
      { name: 'Utilities', icon: 'power', color: '#EF5350' },
      { name: 'Entertainment', icon: 'local_movies', color: '#EC407A' },
      { name: 'Shopping', icon: 'shopping_cart', color: '#7E57C2' },
      { name: 'Health', icon: 'favorite', color: '#26A69A' },
      { name: 'Other', icon: 'more_horiz', color: '#78909C' }
    ];
    
    for (const category of defaultCategories) {
      const id = this.nextId.categories++;
      const newCategory: Category = {
        id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isIncome: category.isIncome || false,
        userId: null // These are system categories without a user
      };
      this.categoriesMap.set(id, newCategory);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      profilePicture: null,
      createdAt: now 
    };
    this.usersMap.set(id, user);
    
    // Create personal categories for the user by copying defaults
    const defaultCategories = Array.from(this.categoriesMap.values())
      .filter(cat => cat.userId === null);
    
    for (const category of defaultCategories) {
      await this.createCategory({
        name: category.name,
        icon: category.icon,
        color: category.color,
        isIncome: category.isIncome,
        userId: id
      });
    }
    
    // Create default user settings
    await this.createUserSettings({
      userId: id,
      theme: 'light',
      highContrast: false,
      language: 'en'
    });
    
    return user;
  }

  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categoriesMap.values()).filter(
      (category) => category.userId === userId || category.userId === null
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoriesMap.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.nextId.categories++;
    const newCategory: Category = { ...category, id };
    this.categoriesMap.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const existingCategory = this.categoriesMap.get(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categoriesMap.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categoriesMap.delete(id);
  }

  // Transaction operations
  async getTransactions(userId: number, filters?: {
    fromDate?: string;
    toDate?: string;
    categoryId?: number;
    search?: string;
  }): Promise<TransactionWithCategory[]> {
    let filtered = Array.from(this.transactionsMap.values()).filter(
      (transaction) => transaction.userId === userId
    );
    
    if (filters?.fromDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.fromDate!));
    }
    
    if (filters?.toDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.toDate!));
    }
    
    if (filters?.categoryId) {
      filtered = filtered.filter(t => t.categoryId === filters.categoryId);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(search)
      );
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Add category information
    return filtered.map(transaction => {
      const category = transaction.categoryId 
        ? this.categoriesMap.get(transaction.categoryId) 
        : undefined;
      
      return {
        ...transaction,
        categoryName: category?.name,
        categoryColor: category?.color,
        categoryIcon: category?.icon
      };
    });
  }

  async getRecentTransactions(userId: number, limit = 5): Promise<TransactionWithCategory[]> {
    const transactions = await this.getTransactions(userId);
    return transactions.slice(0, limit);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsMap.get(id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.nextId.transactions++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactionsMap.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const existingTransaction = this.transactionsMap.get(id);
    if (!existingTransaction) {
      throw new Error("Transaction not found");
    }
    
    const updatedTransaction = { ...existingTransaction, ...transaction };
    this.transactionsMap.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    this.transactionsMap.delete(id);
  }

  async importTransactions(userId: number, transactionsData: Partial<InsertTransaction>[]): Promise<number> {
    let importedCount = 0;
    
    for (const transactionData of transactionsData) {
      // Try to auto-categorize based on description
      let categoryId: number | null = null;
      
      if (transactionData.description) {
        const description = transactionData.description.toLowerCase();
        const categories = await this.getCategories(userId);
        
        // Simple keyword matching for categories
        const categoryKeywords: { [key: string]: string[] } = {
          'groceries': ['grocery', 'supermarket', 'food', 'market', 'walmart', 'kroger', 'target', 'costco', 'aldi'],
          'dining': ['restaurant', 'cafe', 'coffee', 'burger', 'pizza', 'grill', 'starbucks', 'mcdonald'],
          'transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'transit', 'train', 'bus', 'subway', 'parking'],
          'utilities': ['utility', 'electric', 'water', 'gas', 'power', 'internet', 'bill', 'phone', 'cable'],
          'entertainment': ['movie', 'theater', 'netflix', 'spotify', 'disney', 'amazon prime', 'hulu', 'ticket'],
          'shopping': ['amazon', 'store', 'mall', 'shop', 'online', 'retail', 'purchase'],
          'health': ['doctor', 'pharmacy', 'medical', 'clinic', 'hospital', 'dental', 'healthcare'],
          'housing': ['rent', 'mortgage', 'apartment', 'home', 'lease', 'property']
        };
        
        // Check if it's income (positive amount)
        if (transactionData.isIncome) {
          const incomeCategory = categories.find(c => c.isIncome);
          if (incomeCategory) categoryId = incomeCategory.id;
        } else {
          // Try to match category by keywords
          for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => description.includes(keyword))) {
              const matchedCategory = categories.find(c => 
                c.name.toLowerCase() === categoryName.toLowerCase()
              );
              if (matchedCategory) {
                categoryId = matchedCategory.id;
                break;
              }
            }
          }
        }
      }
      
      // Create the transaction
      const transaction: InsertTransaction = {
        userId,
        categoryId,
        amount: transactionData.amount!,
        description: transactionData.description || 'Imported transaction',
        date: transactionData.date!,
        isIncome: transactionData.isIncome || false
      };
      
      await this.createTransaction(transaction);
      importedCount++;
    }
    
    return importedCount;
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    const budgets = Array.from(this.budgetsMap.values()).filter(
      (budget) => budget.userId === userId
    );
    
    // Enrich with current spending
    return await Promise.all(budgets.map(async (budget) => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get transactions for this category in current period
      const periodTransactions = await this.getTransactions(userId, {
        fromDate: firstDay.toISOString().split('T')[0],
        toDate: lastDay.toISOString().split('T')[0],
        categoryId: budget.categoryId || undefined
      });
      
      // Calculate sum of transactions
      const spent = periodTransactions.reduce((sum, transaction) => 
        sum + Number(transaction.amount), 0);
      
      return budget;
    }));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgetsMap.get(id);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = this.nextId.budgets++;
    const newBudget: Budget = { ...budget, id };
    this.budgetsMap.set(id, newBudget);
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget> {
    const existingBudget = this.budgetsMap.get(id);
    if (!existingBudget) {
      throw new Error("Budget not found");
    }
    
    const updatedBudget = { ...existingBudget, ...budget };
    this.budgetsMap.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<void> {
    this.budgetsMap.delete(id);
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goalsMap.values()).filter(
      (goal) => goal.userId === userId
    );
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goalsMap.get(id);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.nextId.goals++;
    const newGoal: Goal = { ...goal, id };
    this.goalsMap.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal> {
    const existingGoal = this.goalsMap.get(id);
    if (!existingGoal) {
      throw new Error("Goal not found");
    }
    
    const updatedGoal = { ...existingGoal, ...goal };
    this.goalsMap.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    this.goalsMap.delete(id);
  }

  // Reminder operations
  async getReminders(userId: number): Promise<Reminder[]> {
    return Array.from(this.remindersMap.values()).filter(
      (reminder) => reminder.userId === userId
    );
  }

  async getUpcomingReminders(userId: number, days = 7): Promise<Reminder[]> {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    
    return Array.from(this.remindersMap.values()).filter(reminder => 
      reminder.userId === userId && 
      new Date(reminder.dueDate) >= now &&
      new Date(reminder.dueDate) <= cutoff
    );
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.remindersMap.get(id);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const id = this.nextId.reminders++;
    const newReminder: Reminder = { ...reminder, id };
    this.remindersMap.set(id, newReminder);
    return newReminder;
  }

  async updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder> {
    const existingReminder = this.remindersMap.get(id);
    if (!existingReminder) {
      throw new Error("Reminder not found");
    }
    
    const updatedReminder = { ...existingReminder, ...reminder };
    this.remindersMap.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<void> {
    this.remindersMap.delete(id);
  }

  // User Settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettingsMap.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createUserSettings(settings: { userId: number, theme?: string, highContrast?: boolean, language?: string }): Promise<UserSettings> {
    const id = this.nextId.userSettings++;
    const now = new Date();
    
    const newSettings: UserSettings = {
      id,
      userId: settings.userId,
      theme: settings.theme || 'light',
      highContrast: settings.highContrast || false,
      language: settings.language || 'en',
      createdAt: now,
      updatedAt: now
    };
    
    this.userSettingsMap.set(id, newSettings);
    return newSettings;
  }

  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    let userSettings = await this.getUserSettings(userId);
    
    if (!userSettings) {
      // Create settings if they don't exist
      userSettings = await this.createUserSettings({
        userId, 
        theme: settings.theme,
        highContrast: settings.highContrast,
        language: settings.language
      });
      return userSettings;
    }
    
    // Update existing settings
    const updatedSettings: UserSettings = {
      ...userSettings,
      ...settings,
      updatedAt: new Date()
    };
    
    this.userSettingsMap.set(userSettings.id, updatedSettings);
    return updatedSettings;
  }

  // User update/password operations
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async changeUserPassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.usersMap.get(id);
    if (!user || user.password !== currentPassword) {
      return false;
    }
    
    user.password = newPassword;
    this.usersMap.set(id, user);
    return true;
  }

  // Dashboard data
  async getDashboardBalance(userId: number): Promise<{
    currentBalance: number;
    income: number;
    expenses: number;
  }> {
    // Get all transactions for this user
    const allTransactions = Array.from(this.transactionsMap.values()).filter(
      transaction => transaction.userId === userId
    );
    
    // Calculate balance (all transactions)
    let balance = 0;
    for (const transaction of allTransactions) {
      if (transaction.isIncome) {
        balance += Number(transaction.amount);
      } else {
        balance -= Number(transaction.amount);
      }
    }
    
    // Calculate monthly income/expenses
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter transactions for current month
    const monthlyTransactions = allTransactions.filter(transaction => 
      new Date(transaction.date) >= firstDayOfMonth
    );
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    for (const transaction of monthlyTransactions) {
      if (transaction.isIncome) {
        monthlyIncome += Number(transaction.amount);
      } else {
        monthlyExpenses += Number(transaction.amount);
      }
    }
    
    return {
      currentBalance: balance,
      income: monthlyIncome,
      expenses: monthlyExpenses
    };
  }

  async getSpendingTrends(userId: number, months: number): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]> {
    const results: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();
    
    // Get all transactions
    const allTransactions = Array.from(this.transactionsMap.values()).filter(
      transaction => transaction.userId === userId
    );
    
    // Generate data for each month
    for (let i = 0; i < months; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Filter transactions for this month
      const monthTransactions = allTransactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date >= month && date <= monthEnd;
      });
      
      let income = 0;
      let expenses = 0;
      
      for (const transaction of monthTransactions) {
        if (transaction.isIncome) {
          income += Number(transaction.amount);
        } else {
          expenses += Number(transaction.amount);
        }
      }
      
      results.unshift({
        month: month.toLocaleString('default', { month: 'short' }),
        income,
        expenses
      });
    }
    
    return results;
  }

  async getCategorySpending(userId: number): Promise<{
    name: string;
    value: number;
    color: string;
  }[]> {
    // Get all expense categories
    const categories = (await this.getCategories(userId))
      .filter(category => !category.isIncome);
    
    // Get all expense transactions
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expenseTransactions = Array.from(this.transactionsMap.values()).filter(
      transaction => 
        transaction.userId === userId && 
        !transaction.isIncome &&
        new Date(transaction.date) >= firstDayOfMonth
    );
    
    // Calculate total expenses
    const totalExpense = expenseTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount), 0
    );
    
    if (totalExpense === 0) {
      return categories.map(category => ({
        name: category.name,
        value: 0,
        color: category.color
      }));
    }
    
    // Group by category
    const categoryTotals = new Map<number, number>();
    let uncategorizedTotal = 0;
    
    for (const transaction of expenseTransactions) {
      if (transaction.categoryId) {
        const current = categoryTotals.get(transaction.categoryId) || 0;
        categoryTotals.set(transaction.categoryId, current + Number(transaction.amount));
      } else {
        uncategorizedTotal += Number(transaction.amount);
      }
    }
    
    // Convert to percentage and format for chart
    const results = categories
      .filter(category => categoryTotals.has(category.id))
      .map(category => ({
        name: category.name,
        value: Math.round((categoryTotals.get(category.id)! / totalExpense) * 100),
        color: category.color
      }));
    
    // Add uncategorized if needed
    if (uncategorizedTotal > 0) {
      results.push({
        name: 'Other',
        value: Math.round((uncategorizedTotal / totalExpense) * 100),
        color: '#78909C'
      });
    }
    
    return results;
  }

  // CSV settings
  async getCsvSettings(userId: number): Promise<CsvSetting | undefined> {
    const setting = Array.from(this.csvSettingsMap.values()).find(
      setting => setting.userId === userId
    );
    return setting;
  }

  async saveCsvSettings(userId: number, settings: Partial<CsvSetting>): Promise<CsvSetting> {
    let existingSetting = await this.getCsvSettings(userId);
    
    if (existingSetting) {
      const updatedSetting = { ...existingSetting, ...settings };
      this.csvSettingsMap.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    } else {
      const id = this.nextId.csvSettings++;
      const newSetting: CsvSetting = { 
        id, 
        userId, 
        skipHeader: true,
        ...settings 
      };
      this.csvSettingsMap.set(id, newSetting);
      return newSetting;
    }
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async changeUserPassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    
    // Get the user
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return false;
    
    // Compare passwords (this would use scrypt in the real implementation)
    // TODO: Replace with actual password hashing
    if (user.password !== currentPassword) return false;
    
    // Update the password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id));
    
    return true;
  }
  
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    if (!db) return undefined;
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }
  
  async createUserSettings(settings: { userId: number, theme?: string, highContrast?: boolean, language?: string }): Promise<UserSettings> {
    if (!db) throw new Error("Database not initialized");
    const [newSettings] = await db.insert(userSettings).values({
      userId: settings.userId,
      theme: settings.theme || 'light',
      highContrast: settings.highContrast || false,
      language: settings.language || 'en'
    }).returning();
    return newSettings;
  }
  
  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    if (!db) throw new Error("Database not initialized");
    
    // Check if settings exist
    const existingSettings = await this.getUserSettings(userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.userId, userId))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      return this.createUserSettings({
        userId,
        theme: settings.theme,
        highContrast: settings.highContrast,
        language: settings.language
      });
    }
  }

  async getCategories(userId: number): Promise<Category[]> {
    if (!db) return [];
    return db.select().from(categories).where(
      sql`${categories.userId} = ${userId} OR ${categories.userId} IS NULL`
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    if (!db) return undefined;
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    if (!db) throw new Error("Database not initialized");
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    if (!db) throw new Error("Database not initialized");
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getTransactions(userId: number, filters?: {
    fromDate?: string;
    toDate?: string;
    categoryId?: number;
    search?: string;
  }): Promise<TransactionWithCategory[]> {
    if (!db) return [];
    
    let query = db
      .select({
        ...transactions,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId));
    
    if (filters?.fromDate) {
      query = query.where(gte(transactions.date, filters.fromDate));
    }
    
    if (filters?.toDate) {
      query = query.where(gte(filters.toDate, transactions.date));
    }
    
    if (filters?.categoryId) {
      query = query.where(eq(transactions.categoryId, filters.categoryId));
    }
    
    if (filters?.search) {
      query = query.where(like(transactions.description, `%${filters.search}%`));
    }
    
    const results = await query.orderBy(desc(transactions.date));
    return results;
  }

  async getRecentTransactions(userId: number, limit = 5): Promise<TransactionWithCategory[]> {
    if (!db) return [];
    
    const results = await db
      .select({
        ...transactions,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
    
    return results;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    if (!db) return undefined;
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    if (!db) throw new Error("Database not initialized");
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    if (!db) throw new Error("Database not initialized");
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async importTransactions(userId: number, transactionsData: Partial<InsertTransaction>[]): Promise<number> {
    if (!db) throw new Error("Database not initialized");
    
    let importedCount = 0;
    
    for (const transactionData of transactionsData) {
      // Try to auto-categorize based on description
      let categoryId: number | null = null;
      
      if (transactionData.description) {
        const description = transactionData.description.toLowerCase();
        const categories = await this.getCategories(userId);
        
        // Simple keyword matching for categories
        const categoryKeywords: { [key: string]: string[] } = {
          'groceries': ['grocery', 'supermarket', 'food', 'market', 'walmart', 'kroger', 'target', 'costco', 'aldi'],
          'dining': ['restaurant', 'cafe', 'coffee', 'burger', 'pizza', 'grill', 'starbucks', 'mcdonald'],
          'transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'transit', 'train', 'bus', 'subway', 'parking'],
          'utilities': ['utility', 'electric', 'water', 'gas', 'power', 'internet', 'bill', 'phone', 'cable'],
          'entertainment': ['movie', 'theater', 'netflix', 'spotify', 'disney', 'amazon prime', 'hulu', 'ticket'],
          'shopping': ['amazon', 'store', 'mall', 'shop', 'online', 'retail', 'purchase'],
          'health': ['doctor', 'pharmacy', 'medical', 'clinic', 'hospital', 'dental', 'healthcare'],
          'housing': ['rent', 'mortgage', 'apartment', 'home', 'lease', 'property']
        };
        
        // Check if it's income (positive amount)
        if (transactionData.isIncome) {
          const incomeCategory = categories.find(c => c.isIncome);
          if (incomeCategory) categoryId = incomeCategory.id;
        } else {
          // Try to match category by keywords
          for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => description.includes(keyword))) {
              const matchedCategory = categories.find(c => 
                c.name.toLowerCase() === categoryName.toLowerCase()
              );
              if (matchedCategory) {
                categoryId = matchedCategory.id;
                break;
              }
            }
          }
        }
      }
      
      // Create the transaction
      const transaction: InsertTransaction = {
        userId,
        categoryId,
        amount: transactionData.amount!,
        description: transactionData.description || 'Imported transaction',
        date: transactionData.date!,
        isIncome: transactionData.isIncome || false
      };
      
      await this.createTransaction(transaction);
      importedCount++;
    }
    
    return importedCount;
  }

  async getBudgets(userId: number): Promise<Budget[]> {
    if (!db) return [];
    
    // Get budgets
    const dbBudgets = await db
      .select({
        ...budgets,
        categoryName: categories.name,
        categoryIcon: categories.icon
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId));
    
    // Calculate current spending for each budget
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const result = [];
    
    for (const budget of dbBudgets) {
      // Get current spending
      const spendingQuery = db
        .select({
          total: sql`SUM(${transactions.amount})`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, budget.categoryId),
            gte(transactions.date, firstDay),
            gte(lastDay, transactions.date),
            eq(transactions.isIncome, false)
          )
        );
      
      const [spending] = await spendingQuery;
      const current = Number(spending?.total || 0);
      const max = Number(budget.amount);
      const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
      
      result.push({
        ...budget,
        current,
        max,
        percentage
      });
    }
    
    return result;
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    if (!db) return undefined;
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    if (!db) throw new Error("Database not initialized");
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget> {
    if (!db) throw new Error("Database not initialized");
    const [updatedBudget] = await db
      .update(budgets)
      .set(budget)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getGoals(userId: number): Promise<Goal[]> {
    if (!db) return [];
    
    const dbGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));
    
    return dbGoals.map(goal => {
      const currentAmount = Number(goal.currentAmount);
      const targetAmount = Number(goal.targetAmount);
      const percentage = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;
      
      return {
        ...goal,
        percentage
      };
    });
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    if (!db) return undefined;
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    if (!db) throw new Error("Database not initialized");
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal> {
    if (!db) throw new Error("Database not initialized");
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(goals).where(eq(goals.id, id));
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    if (!db) return [];
    return db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(reminders.dueDate);
  }

  async getUpcomingReminders(userId: number, days = 7): Promise<Reminder[]> {
    if (!db) return [];
    
    const now = new Date().toISOString().split('T')[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffDate = cutoff.toISOString().split('T')[0];
    
    return db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          gte(reminders.dueDate, now),
          gte(cutoffDate, reminders.dueDate)
        )
      )
      .orderBy(reminders.dueDate);
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    if (!db) return undefined;
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    if (!db) throw new Error("Database not initialized");
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder> {
    if (!db) throw new Error("Database not initialized");
    const [updatedReminder] = await db
      .update(reminders)
      .set(reminder)
      .where(eq(reminders.id, id))
      .returning();
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async getDashboardBalance(userId: number): Promise<{
    currentBalance: number;
    income: number;
    expenses: number;
  }> {
    if (!db) {
      return { currentBalance: 0, income: 0, expenses: 0 };
    }
    
    // Calculate overall balance
    const balanceQuery = db
      .select({
        balance: sql`SUM(CASE WHEN ${transactions.isIncome} THEN ${transactions.amount} ELSE -${transactions.amount} END)`
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    const [balanceResult] = await balanceQuery;
    const currentBalance = Number(balanceResult?.balance || 0);
    
    // Calculate monthly income/expenses
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const incomeQuery = db
      .select({
        total: sql`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isIncome, true),
          gte(transactions.date, firstDayOfMonth)
        )
      );
    
    const expenseQuery = db
      .select({
        total: sql`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isIncome, false),
          gte(transactions.date, firstDayOfMonth)
        )
      );
    
    const [incomeResult] = await incomeQuery;
    const [expenseResult] = await expenseQuery;
    
    return {
      currentBalance,
      income: Number(incomeResult?.total || 0),
      expenses: Number(expenseResult?.total || 0)
    };
  }

  async getSpendingTrends(userId: number, months: number): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]> {
    if (!db) return [];
    
    const results: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const firstDay = month.toISOString().split('T')[0];
      const lastDay = monthEnd.toISOString().split('T')[0];
      
      const incomeQuery = db
        .select({
          total: sql`SUM(${transactions.amount})`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.isIncome, true),
            gte(transactions.date, firstDay),
            gte(lastDay, transactions.date)
          )
        );
      
      const expenseQuery = db
        .select({
          total: sql`SUM(${transactions.amount})`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.isIncome, false),
            gte(transactions.date, firstDay),
            gte(lastDay, transactions.date)
          )
        );
      
      const [incomeResult] = await incomeQuery;
      const [expenseResult] = await expenseQuery;
      
      results.unshift({
        month: month.toLocaleString('default', { month: 'short' }),
        income: Number(incomeResult?.total || 0),
        expenses: Number(expenseResult?.total || 0)
      });
    }
    
    return results;
  }

  async getCategorySpending(userId: number): Promise<{
    name: string;
    value: number;
    color: string;
  }[]> {
    if (!db) return [];
    
    // Get all expense categories
    const categoriesList = await db
      .select()
      .from(categories)
      .where(
        and(
          sql`${categories.userId} = ${userId} OR ${categories.userId} IS NULL`,
          eq(categories.isIncome, false)
        )
      );
    
    // Get current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    // Get total expenses for this month
    const totalExpenseQuery = db
      .select({
        total: sql`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isIncome, false),
          gte(transactions.date, firstDayOfMonth)
        )
      );
    
    const [totalExpenseResult] = await totalExpenseQuery;
    const totalExpense = Number(totalExpenseResult?.total || 0);
    
    if (totalExpense === 0) {
      return categoriesList.map(category => ({
        name: category.name,
        value: 0,
        color: category.color
      }));
    }
    
    // Get spending by category
    const results = [];
    
    for (const category of categoriesList) {
      const query = db
        .select({
          total: sql`SUM(${transactions.amount})`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, category.id),
            eq(transactions.isIncome, false),
            gte(transactions.date, firstDayOfMonth)
          )
        );
      
      const [result] = await query;
      const categoryTotal = Number(result?.total || 0);
      
      if (categoryTotal > 0) {
        results.push({
          name: category.name,
          value: Math.round((categoryTotal / totalExpense) * 100),
          color: category.color
        });
      }
    }
    
    // Get uncategorized spending
    const uncategorizedQuery = db
      .select({
        total: sql`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.categoryId} IS NULL`,
          eq(transactions.isIncome, false),
          gte(transactions.date, firstDayOfMonth)
        )
      );
    
    const [uncategorizedResult] = await uncategorizedQuery;
    const uncategorizedTotal = Number(uncategorizedResult?.total || 0);
    
    if (uncategorizedTotal > 0) {
      results.push({
        name: 'Other',
        value: Math.round((uncategorizedTotal / totalExpense) * 100),
        color: '#78909C'
      });
    }
    
    return results;
  }

  async getCsvSettings(userId: number): Promise<CsvSetting | undefined> {
    if (!db) return undefined;
    const [setting] = await db
      .select()
      .from(csvSettings)
      .where(eq(csvSettings.userId, userId));
    return setting;
  }

  async saveCsvSettings(userId: number, settings: Partial<CsvSetting>): Promise<CsvSetting> {
    if (!db) throw new Error("Database not initialized");
    
    const existing = await this.getCsvSettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(csvSettings)
        .set(settings)
        .where(eq(csvSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db
        .insert(csvSettings)
        .values({
          userId,
          skipHeader: true,
          ...settings
        })
        .returning();
      return newSetting;
    }
  }
}

// Use DatabaseStorage if database is available, otherwise fallback to MemStorage
// Always use DatabaseStorage now that we have a PostgreSQL database
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from './db';

const PostgresSessionStore = connectPg(session);
export const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

export const storage = new DatabaseStorage();
