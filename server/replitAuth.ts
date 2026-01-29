// Authentication: Google OAuth + fallback (Replit code removed for Railway deployment)
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types package
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

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
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function isGoogleAuthConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (isGoogleAuthConfigured()) {
    console.log("Setting up Google OAuth authentication");
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.RAILWAY_STATIC_URL || "http://localhost:5000"}/api/auth/google/callback`;

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL,
        },
        async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
          try {
            const userId = profile.id;
            const email = profile.emails?.[0]?.value || "";
            const firstName = profile.name?.givenName || "";
            const lastName = profile.name?.familyName || "";
            const profileImageUrl = profile.photos?.[0]?.value;

            await storage.upsertUser({
              id: userId,
              email,
              firstName,
              lastName,
              profileImageUrl,
            });

            const user = {
              claims: {
                sub: userId,
                email,
                first_name: firstName,
                last_name: lastName,
              },
              expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            };
            return done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
            return done(error, null);
          }
        }
      )
    );

    app.get("/api/login", (req, res) => {
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
    });

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  } else {
    console.log("Google OAuth not configured - using fallback login");
    app.get("/api/login", async (req, res) => {
      try {
        const userId = "railway-user-1";
        const mockUser = {
          claims: {
            sub: userId,
            email: "user@railway.app",
            first_name: "Railway",
            last_name: "User",
          },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        };
        await storage.upsertUser({
          id: userId,
          email: "user@railway.app",
          firstName: "Railway",
          lastName: "User",
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
        console.error("Error setting up fallback user:", error);
        res.redirect("/");
      }
    });
  }

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  if (!isGoogleAuthConfigured()) {
    if (!req.user) {
      (req as any).user = { claims: { sub: "railway-user-1" } };
    }
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
