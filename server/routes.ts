import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { initCronJobs } from "./cron";
import { setupWebSockets } from "./ws";
// import { sendNotificationEmail } from "./email";
import multer from "multer";
import { uploadAndParseCSV } from "../client/src/lib/csv-parser";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

// File upload configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSockets for real-time notifications (optional)
  // setupWebSockets(httpServer);
  
  // Initialize scheduled tasks for reminders
  initCronJobs();
  
  // Dashboard Data APIs
  app.get("/api/dashboard/balance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const balance = await storage.getDashboardBalance(req.user.id);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to get balance data" });
    }
  });
  
  app.get("/api/dashboard/spending-trends", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const timeRange = req.query.timeRange as string || "3M";
      let months = 3;
      
      if (timeRange === "6M") months = 6;
      else if (timeRange === "1Y") months = 12;
      
      const trends = await storage.getSpendingTrends(req.user.id, months);
      res.json({ trends });
    } catch (error) {
      res.status(500).json({ error: "Failed to get spending trends" });
    }
  });
  
  app.get("/api/dashboard/category-spending", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const categories = await storage.getCategorySpending(req.user.id);
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: "Failed to get category spending" });
    }
  });
  
  // Transaction APIs
  app.get("/api/transactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const filters = {
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        categoryId: req.query.category ? parseInt(req.query.category as string) : undefined,
        search: req.query.search as string
      };
      
      const transactions = await storage.getTransactions(req.user.id, filters);
      const categories = await storage.getCategories(req.user.id);
      
      res.json({ transactions, categories });
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });
  
  app.get("/api/transactions/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const transactions = await storage.getRecentTransactions(req.user.id, limit);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent transactions" });
    }
  });
  
  app.post("/api/transactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({
        ...transactionData,
        userId: req.user.id
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });
  
  app.post("/api/transactions/import", upload.single('file'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const csvFormat = req.body.csvFormat;
      const skipHeader = req.body.skipHeader === 'true';
      const categorize = req.body.categorize === 'true';
      
      // Read file as text
      const fileContent = req.file.buffer.toString('utf8');
      
      // Save CSV settings if needed
      await storage.saveCsvSettings(req.user.id, {
        userId: req.user.id,
        bankName: csvFormat,
        skipHeader
      });
      
      // Create a temporary file object to use with the parser
      const tmpFile = new File([req.file.buffer], req.file.originalname, { 
        type: 'text/csv' 
      });
      
      // Parse CSV
      const { transactions } = await uploadAndParseCSV(tmpFile);
      
      // Import transactions
      const importedCount = await storage.importTransactions(
        req.user.id,
        transactions
      );
      
      res.status(200).json({ 
        success: true,
        imported: importedCount,
        message: `Successfully imported ${importedCount} transactions` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        error: "Failed to import transactions",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Budget APIs
  app.get("/api/budgets", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const budgets = await storage.getBudgets(req.user.id);
      res.json({ budgets });
    } catch (error) {
      res.status(500).json({ error: "Failed to get budgets" });
    }
  });
  
  app.get("/api/budgets/overview", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const budgets = await storage.getBudgets(req.user.id);
      
      // Transform for the UI
      const formattedBudgets = budgets.map(budget => {
        // Get category information if categoryId is available
        let categoryName = 'Uncategorized';
        let categoryIcon = 'more_horiz';
        
        // Simple budget summary
        return {
          id: budget.id,
          category: categoryName,
          icon: categoryIcon,
          current: Number(budget.amount),
          max: Number(budget.amount),
          percentage: 100
        };
      });
      
      res.json({ budgets: formattedBudgets });
    } catch (error) {
      res.status(500).json({ error: "Failed to get budget overview" });
    }
  });
  
  // Goal APIs
  app.get("/api/goals", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const goals = await storage.getGoals(req.user.id);
      res.json({ goals });
    } catch (error) {
      res.status(500).json({ error: "Failed to get goals" });
    }
  });
  
  // Reminder APIs
  app.get("/api/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const reminders = await storage.getReminders(req.user.id);
      res.json({ reminders });
    } catch (error) {
      res.status(500).json({ error: "Failed to get reminders" });
    }
  });
  
  app.get("/api/reminders/upcoming", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const reminders = await storage.getUpcomingReminders(req.user.id, days);
      res.json({ reminders });
    } catch (error) {
      res.status(500).json({ error: "Failed to get upcoming reminders" });
    }
  });

  // User Settings API endpoints
  app.get("/api/user/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      if (!userSettings) {
        // If no settings exist yet, create default settings
        const newSettings = await storage.createUserSettings({
          userId: req.user.id,
          theme: 'light',
          highContrast: false,
          language: 'en'
        });
        return res.json(newSettings);
      }
      res.json(userSettings);
    } catch (error) {
      console.error("Error getting user settings:", error);
      res.status(500).json({ error: "Failed to get user settings" });
    }
  });
  
  app.patch("/api/user/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const { theme, highContrast, language } = req.body;
      
      const updatedSettings = await storage.updateUserSettings(req.user.id, {
        theme,
        highContrast,
        language
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });
  
  app.patch("/api/user/profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        email
      });
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  
  app.post("/api/user/change-password", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      const success = await storage.changeUserPassword(req.user.id, currentPassword, newPassword);
      
      if (!success) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
  // Configure profile picture upload
  const profilePictureUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads/profile-pictures');
        
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Use user ID and timestamp to create unique filenames
        const userId = req.user?.id;
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname).toLowerCase();
        cb(null, `user-${userId}-${timestamp}${fileExtension}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only images
      const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (mimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.') as any);
      }
    }
  });
  
  app.post("/api/user/profile-picture", profilePictureUpload.single('profilePicture'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get the relative path to the uploaded file
      const filePath = `/uploads/profile-pictures/${path.basename(req.file.path)}`;
      
      // Update user with the profile picture path
      const updatedUser = await storage.updateUser(req.user.id, {
        profilePicture: filePath,
      });
      
      res.json({
        success: true,
        imageUrl: filePath
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ 
        error: "Failed to upload profile picture",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return httpServer;
}
