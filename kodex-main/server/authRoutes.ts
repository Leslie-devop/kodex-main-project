import type { Express } from "express";
import passport from "passport";
import { authService } from "./auth";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { isAuthenticated, requireRole } from "./localAuth";
import bcrypt from "bcryptjs";

export function registerAuthRoutes(app: Express) {
  // Registration route - only for students
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = registerUserSchema.parse(req.body);
      
      const user = await authService.register(username, email, password);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({ 
          message: "Registration successful", 
          user: { ...user, password: undefined } 
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Registration failed" });
      }
    }
  });

  // Login route
  app.post('/api/login', (req, res, next) => {
    try {
      const { username, password } = loginUserSchema.parse(req.body);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Authentication error" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ 
            message: "Login successful", 
            user: { ...user, password: undefined } 
          });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update current user profile
  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { firstName, lastName, password } = req.body;
      const updateData: any = {};
      
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json({ message: "Profile updated successfully", user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Admin-only route to update user roles
  app.put('/api/admin/users/:userId/role', requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ 
        message: "User role updated successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin-only route to get all users
  app.get('/api/admin/users', requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post('/api/admin/users', requireRole(['admin']), async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await authService.register(username, email, password, firstName, lastName, role);
      // user already has password excluded from authService.register
      const userWithoutPassword = user;
      
      res.status(201).json({ 
        message: "User created successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account consent'
  }));

  app.get('/api/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', { failureRedirect: '/login' }, (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.redirect('/login');
      
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // If it's a new user, redirect them to role selection page
        if (info && info.isNewUser) {
          (req as any).session.isNewOAuthUser = true;
          req.session.save(() => {
            res.redirect('/onboarding');
          });
        } else {
          res.redirect('/');
        }
      });
    })(req, res, next);
  });

  // Role selection for new OAuth users
  app.put('/api/auth/role', isAuthenticated, async (req: any, res) => {
    if (!(req as any).session?.isNewOAuthUser) {
      return res.status(403).json({ message: "Only new OAuth users can set their role once" });
    }
    const { role } = req.body;
    if (!['student', 'teacher'].includes(role)) {
       return res.status(400).json({ message: "Invalid role" });
    }
    try {
      const updatedUser = await storage.updateUserRole(req.user.id, role);
      (req as any).session.isNewOAuthUser = false; // Mark as done
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Role updated", user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to set role" });
    }
  });
}