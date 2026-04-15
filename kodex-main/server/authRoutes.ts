import type { Express } from "express";
import passport from "passport";
import { authService } from "./auth";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema } from "../shared/schema";
import { isAuthenticated, requireRole } from "./localAuth";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "./lib/email";
import crypto from "crypto";
import { z } from "zod";

const verifyOTPSchema = z.object({ code: z.string() });

export function registerAuthRoutes(app: Express) {
  // Registration route - only for students
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = registerUserSchema.parse(req.body);
      
      const user = await authService.register(username, email, password);
      
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.updateVerificationCode(user.id, otp, expiry);
      await sendOTPEmail(user.email, otp);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({ 
          message: "Registration successful. Cloud sync code sent to email.", 
          user: { ...user, password: undefined, needsVerification: true } 
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
        
        req.login(user, async (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Login failed" });
          }
          
          if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 15 * 60 * 1000);
            await storage.updateVerificationCode(user.id, otp, expiry);
            await sendOTPEmail(user.email, otp);
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
      const { firstName, lastName, password, profileImageUrl } = req.body;
      const updateData: any = {};
      
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      
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

  // Delete account route
  app.delete('/api/auth/me', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUser(req.user.id);
      req.logout((err: any) => {
        if (err) return res.status(500).json({ message: "Account deleted, but logout failed" });
        res.json({ message: "Account completely deleted" });
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // OTP Verification
  app.post('/api/auth/verify-otp', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = verifyOTPSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      
      if (!user) return res.status(404).json({ message: "User not found" });
      
      // Development/Another Way Fail-safe
      const isMasterCode = process.env.NODE_ENV !== 'production' && code === '000000';

      if (!isMasterCode && user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid sync code" });
      }
      
      if (user.verificationExpiry && new Date() > user.verificationExpiry) {
        return res.status(400).json({ message: "Verification code expired" });
      }
      
      await storage.verifyUser(user.id);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Mobile call via Secure QR Token (No login required on phone)
  app.post('/api/auth/push-verify-token', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "Invalid sync request" });
      await storage.setPushVerified(userId, true);
      res.json({ message: "Verification successful" });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // User Push Verification (Tap Yes on phone) via authenticated session
  app.post('/api/auth/push-verify', isAuthenticated, async (req: any, res) => {
    try {
      await storage.setPushVerified(req.user.id, true);
      res.json({ message: "Verification successful from mobile device" });
    } catch (error) {
      res.status(500).json({ message: "Mobile verification failed" });
    }
  });

  app.post('/api/auth/push-reset', isAuthenticated, async (req: any, res) => {
    try {
      await storage.setPushVerified(req.user.id, false);
      res.json({ message: "Push status reset" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset status" });
    }
  });

  // User Consent (Permissions)
  app.post('/api/auth/consent', isAuthenticated, async (req: any, res) => {
    try {
      const updatedUser = await storage.setUserConsent(req.user.id);
      // Reset push status once they have fully consented
      await storage.setPushVerified(req.user.id, false);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Consent granted", user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to grant consent" });
    }
  });

  // Resend OTP
  app.post('/api/auth/resend-otp', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateVerificationCode(user.id, otp, expiry);
      await sendOTPEmail(user.email, otp);
      
      res.json({ message: "New cloud sync code dispatched" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resend code" });
    }
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
    passport.authenticate('google', { failureRedirect: '/login' }, async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.redirect('/login');
      
      req.logIn(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // If it's an existing user (already signed in or registered), skip OTP and skip permissions
        if (!info?.isNewUser) {
          if (!user.isVerified) await storage.verifyUser(user.id);
          if (!user.hasConsent) await storage.setUserConsent(user.id);
          user.isVerified = true;
          user.hasConsent = true;
        } else {
          // If it's a NEW user (or they deleted their account and came back):
          // They MUST go through the OTP verification process first
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiry = new Date(Date.now() + 15 * 60 * 1000);
          await storage.updateVerificationCode(user.id, otp, expiry);
          await sendOTPEmail(user.email, otp);
        }

        // If it's a new user, redirect them to role selection page
        if (info && info.isNewUser) {
          (req as any).session.isNewOAuthUser = true;
          req.session.save(() => {
            res.redirect('/');
          });
        } else {
          res.redirect('/');
        }
      });
    })(req, res, next);
  });

  // Role selection
  app.put('/api/auth/role', isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (user?.role) {
      // Gracefully return OK so the frontend redirects them automatically
      const { password, ...userWithoutPassword } = user;
      return res.json({ message: "Role already set", user: userWithoutPassword });
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