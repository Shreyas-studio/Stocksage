// Replit Auth: Authentication system using OpenID Connect
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Check if Replit auth is configured (optional for Railway deployment)
const isReplitAuthConfigured = () => {
  return !!(process.env.REPLIT_DOMAINS && process.env.REPL_ID);
};

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up Google OAuth if configured (for Railway deployment)
  const isGoogleAuthConfigured = () => {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  };

  if (isGoogleAuthConfigured()) {
    console.log("Setting up Google OAuth authentication");
    
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.RAILWAY_STATIC_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const userId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profileImageUrl = profile.photos?.[0]?.value;

          // Save or update user in database
          await storage.upsertUser({
            id: userId,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // Create user object for session
          const user = {
            claims: {
              sub: userId,
              email,
              first_name: firstName,
              last_name: lastName,
            },
            expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
          };

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    ));
  }

  // Only set up Replit auth if configured (for Railway, this will be skipped)
  if (!isReplitAuthConfigured()) {
    console.log("Replit auth not configured - using Google OAuth or fallback");
    // Set up basic passport serialization
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    
    // Set up Google OAuth routes if configured
    if (isGoogleAuthConfigured()) {
      app.get("/api/login", (req, res) => {
        // Redirect to Google OAuth
        passport.authenticate("google", {
          scope: ["profile", "email"],
        })(req, res);
      });

      app.get("/api/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/" }),
        (req, res) => {
          // Successful authentication, redirect to home
          res.redirect("/");
        }
      );
    } else {
      // Fallback routes for Railway deployment (so login buttons work)
      app.get("/api/login", async (req, res) => {
        try {
          // Create a mock user session for Railway
          const userId = 'railway-user-1';
          const mockUser = { 
            claims: { 
              sub: userId, 
              email: 'user@railway.app',
              first_name: 'Railway',
              last_name: 'User'
            },
            expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
          };
          
          // Ensure user exists in storage
          await storage.upsertUser({
            id: userId,
            email: 'user@railway.app',
            firstName: 'Railway',
            lastName: 'User',
            profileImageUrl: undefined,
          });
          
          req.login(mockUser, (err) => {
            if (err) {
              console.error("Login error:", err);
              return res.redirect("/");
            }
            res.redirect("/");
          });
        } catch (error) {
          console.error("Error setting up Railway user:", error);
          res.redirect("/");
        }
      });
    }
    
    app.get("/api/callback", (req, res) => {
      // Redirect to home (for compatibility)
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    // Don't return here - continue to set up Replit auth if configured
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If Replit auth is not configured, check for Google OAuth or fallback
  if (!isReplitAuthConfigured()) {
    // If user is authenticated via Google OAuth, allow through
    if (req.isAuthenticated() && req.user) {
      return next();
    }
    
    // If Google OAuth is not configured, use fallback (for development)
    const isGoogleAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if (!isGoogleAuthConfigured) {
      // Create a mock user for Railway deployment (fallback)
      if (!req.user) {
        (req as any).user = { claims: { sub: 'railway-user-1' } };
      }
      return next();
    }
    
    // Google OAuth is configured but user is not authenticated
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
