import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";

export function setupGoogleAuth(app: Express) {
  // If no credentials, we skip setting up Google strategy 
  // (but user is instructed to add them to .env)
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found. Google OAuth will not work. Please add them to .env and restart server.");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
        callbackURL: "/api/auth/google/callback",
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(null, false, { message: "Google account does not have an email." });
          }

          // Check if user exists by email
          let user = await storage.getUserByUsernameOrEmail(email, email);

          if (!user) {
            // New user via Google OAuth
            // Create dummy password and username based on email
            const dummyPassword = crypto.randomBytes(32).toString('hex');
            const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
            
            user = await storage.createUser({
              username,
              email,
              password: dummyPassword,
              firstName: profile.name?.givenName || username,
              lastName: profile.name?.familyName || '',
              role: null as any, // force onboarding
              isVerified: false,
              hasConsent: false,
            });
            
            return done(null, user, { isNewUser: true } as any);
          } else {
             return done(null, user, { isNewUser: false } as any);
          }
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}
