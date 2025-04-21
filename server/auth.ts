import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage, sessionStore } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret =
    process.env.SESSION_SECRET || "budgetwise-secret-key-change-in-production";

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // REGISTER
  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("📥 Register Body:", req.body);

      const { username, password, email, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      console.log("🟡 Checking if user exists...");
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists." });
      }

      console.log("🟢 Hashing password...");
      const hashedPassword = await hashPassword(password);

      console.log("🟢 Creating user...");
      const user = await storage.createUser({
        username,
        email,
        firstName,
        lastName,
        password: hashedPassword,
      });

      console.log("🟢 Logging user in...");
      req.login(user, (err) => {
        if (err) {
          console.error("🚨 Error during req.login:", err);
          return next(err);
        }

        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("🔥 Error in /api/register:", error);
      console.error("🧩 Type:", typeof error);
      console.error("🧩 Constructor:", error?.constructor?.name);
      console.error("🧩 Keys:", Object.keys(error));
      console.error("🧩 Full dump:", error);
      console.error("🧩 Stringified:", JSON.stringify(error));
      console.error("🧩 Stack:", error?.stack);

      return res.status(500).json({
        error: "Registration failed",
        details: {
          type: typeof error,
          name: error?.constructor?.name,
          message: error?.message || "No message",
          stack: error?.stack || "No stack",
          stringified: JSON.stringify(error),
          keys: Object.keys(error),
        },
      });
    }
  });

  // LOGIN
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // LOGOUT
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // CURRENT USER
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
