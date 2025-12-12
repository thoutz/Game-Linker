import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import SteamStrategy from "passport-steam";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

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
      secure: true,
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

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    username: claims["email"]?.split("@")[0] || `user_${claims["sub"]}`,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

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

  const registeredStrategies = new Map<string, string>();

  const ensureStrategy = (req: any) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const callbackURL = `${protocol}://${host}/api/callback`;
    const strategyKey = `${protocol}://${host}`;
    const strategyName = `replitauth:${strategyKey}`;
    
    if (!registeredStrategies.has(strategyKey)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.set(strategyKey, strategyName);
    }
    return registeredStrategies.get(strategyKey)!;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategyName = ensureStrategy(req);
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = ensureStrategy(req);
    passport.authenticate(strategyName, {
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

  // Steam Authentication
  if (process.env.STEAM_API_KEY) {
    const steamStrategies = new Map<string, string>();
    
    const ensureSteamStrategy = (req: any) => {
      const protocol = req.protocol;
      const host = req.get("host");
      const strategyKey = `${protocol}://${host}`;
      const strategyName = `steam:${strategyKey}`;
      
      if (!steamStrategies.has(strategyKey)) {
        passport.use(strategyName, new SteamStrategy.Strategy({
            returnURL: `${protocol}://${host}/api/auth/steam/return`,
            realm: `${protocol}://${host}/`,
            apiKey: process.env.STEAM_API_KEY!,
            passReqToCallback: true
          },
          async function(req: any, identifier: string, profile: any, done: any) {
            try {
              const steamId = profile.id;
              const existingUser = req.user as any;
              
              if (existingUser && existingUser.claims?.sub) {
                await storage.updateUser(existingUser.claims.sub, {
                  steamId: steamId,
                  steamProfileUrl: profile._json?.profileurl || null,
                  avatar: existingUser.claims.profile_image_url || profile.photos?.[2]?.value || profile.photos?.[0]?.value,
                });
                return done(null, existingUser);
              } else {
                let user = await storage.getUserBySteamId(steamId);
                if (!user) {
                  user = await storage.createSteamUser({
                    steamId: steamId,
                    username: profile.displayName || `steam_${steamId}`,
                    avatar: profile.photos?.[2]?.value || profile.photos?.[0]?.value,
                    profileImageUrl: profile.photos?.[2]?.value || profile.photos?.[0]?.value,
                    steamProfileUrl: profile._json?.profileurl,
                  });
                }
                const sessionUser = {
                  claims: {
                    sub: user.id,
                    email: user.email,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    profile_image_url: user.profileImageUrl,
                  },
                  expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
                };
                return done(null, sessionUser);
              }
            } catch (error) {
              console.error("Steam auth error:", error);
              return done(error);
            }
          }
        ));
        steamStrategies.set(strategyKey, strategyName);
      }
      return steamStrategies.get(strategyKey)!;
    };

    app.get("/api/auth/steam", (req, res, next) => {
      const strategyName = ensureSteamStrategy(req);
      passport.authenticate(strategyName)(req, res, next);
    });

    app.get("/api/auth/steam/return", (req, res, next) => {
      const strategyName = ensureSteamStrategy(req);
      passport.authenticate(strategyName, { failureRedirect: "/" })(req, res, () => {
        res.redirect("/");
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
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
