const express = require("express");
const app = express();
const port = 4000;
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");
const cors = require("cors");
const Admin = require("./models/adminModel")
const User = require("./models/userModel")
// Add crypto module at the top with  other imports
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const session = require("express-session");
const MongoStore = require("connect-mongo");

//Routes
const blogCategoryRouter = require("./routes/blogCategoryRoutes")
const blogPostRouter = require("./routes/blogPostRoutes")
const promoCodeRouter = require("./routes/promoCodeRoutes")
const categoryRouter = require("./routes/categoryRoutes")
const productRouter = require("./routes/productRoutes")
const wishlistRouter = require("./routes/wishlistRoutes")
const newsletterRouter = require("./routes/newsletterRoutes")
const cartRouter = require("./routes/cartRoutes")
const contactRouter = require("./routes/contactRoutes")
const adminRouter = require("./routes/adminRoutes")
const checkoutRouter = require("./routes/checkoutRoutes")
const analyticsRouter = require("./routes/analyticsRoutes")
const orderRouter = require("./routes/orderRoutes")
const authRouter = require("./routes/authRoutes")
const uploadRouter = require("./routes/uploadRoutes")
// ============================================
// RBAC SYSTEM IMPORTS - Pink Dreams Store
// ============================================
const sqlite3 = require("sqlite3").verbose();
const {
  router: rbacRouter,
  initRBACTables,
  seedDefaultRoles,
  createDefaultSuperAdmin,
} = require("./routes/rbacRoutes");

// 1. FIRST: Configure trust proxy (IMPORTANT for correct IP detection)
app.set("trust proxy", 1); // Trust first proxy (essential for rate limiting)

app.use(express.json());
// Replace your CORS configuration with this
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://faysalpk26-pinkdreams-frontend.vercel.app",
      "https://pinkdreams-backend.onrender.com",

      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  exposedHeaders: ["set-cookie"],
};

// Remove the duplicate CORS lines and use only this:
app.use(cors(corsOptions));
console.log(
  "CORS origins configured:",
  [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pink-dreams-ikftech.vercel.app",
    "https://pink-dreams-ikftech.vercel.app/",

    process.env.FRONTEND_URL,
  ].filter(Boolean),
);

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ============================================
// SQLite Database for RBAC System
// ============================================

// Use absolute path for database
const DB_PATH = path.join(__dirname, "rbac_database.db");

const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("❌ SQLite connection error:", err);
    } else {
      console.log("✅ SQLite Database Connected (RBAC System)");
      console.log(`📁 Database location: ${DB_PATH}`);

      // Enable Write-Ahead Logging (WAL) mode
      db.run("PRAGMA journal_mode = WAL;", (err) => {
        if (err) {
          console.error("Error enabling WAL mode:", err);
        } else {
          console.log("✅ WAL mode enabled for database");
        }
      });

      // Enable foreign keys
      db.run("PRAGMA foreign_keys = ON;", (err) => {
        if (err) {
          console.error("Error enabling foreign keys:", err);
        } else {
          console.log("✅ Foreign keys enabled");
        }
      });

      // Set synchronous mode to NORMAL
      db.run("PRAGMA synchronous = NORMAL;", (err) => {
        if (err) {
          console.error("Error setting synchronous mode:", err);
        } else {
          console.log("✅ Synchronous mode set to NORMAL");
        }
      });
    }
  },
);

// Make database available to routes
app.locals.db = db;

// Initialize RBAC System
(async () => {
  try {
    console.log("");
    console.log("🔧 Initializing RBAC System...");

    await initRBACTables(db);
    console.log("✅ RBAC tables initialized successfully");

    await seedDefaultRoles(db);
    console.log("✅ Default roles seeded successfully");

    await createDefaultSuperAdmin(db);
    console.log("✅ Default super admin created successfully");

    console.log("");
    console.log("═══════════════════════════════════════════════════");
    console.log("🎉 RBAC System is ready!");
    console.log("═══════════════════════════════════════════════════");
    console.log("📝 Default Super Admin Login:");
    console.log("   🔑 Username: admin");
    console.log("   🔒 Password: admin123");
    console.log("   ⚠️  IMPORTANT: Change password after first login!");
    console.log("═══════════════════════════════════════════════════");
    console.log("");
  } catch (error) {
    console.error("❌ Error initializing RBAC system:", error);
  }
})();
// Add these endpoints to your existing index.js file

process.on("SIGINT", () => {
  console.log("\n⚠️  Shutting down gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err);
    } else {
      console.log("✅ Database connection closed");
    }
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM received, shutting down gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err);
    } else {
      console.log("✅ Database connection closed");
    }
    process.exit(0);
  });
});
// Create default admin if none exists
const createDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      console.log("Creating default admin...");

      const defaultPassword = "admin123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const defaultAdmin = new Admin({
        username: "admin",
        password: hashedPassword,
        name: "Administrator",
        role: "super_admin",
      });

      await defaultAdmin.save();

      console.log("✅ Default admin created:");
      console.log("   Username: admin");
      console.log("   Password: admin123");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Initialize default admin on server start
createDefaultAdmin();

app.use( session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // ✅ only from .env
      touchAfter: 24 * 3600, // lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ==============================================
// PASSPORT CONFIGURATION
// ==============================================

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==============================================
// GOOGLE OAUTH STRATEGY
// ==============================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:4000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(
          "🔍 Google OAuth - Processing user:",
          profile.emails[0].value,
        );

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("✅ Existing Google user found");
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails[0].value;
        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          console.log("🔗 Linking Google account to existing user");
          user.googleId = profile.id;
          user.avatar = user.avatar || profile.photos[0]?.value || "";
          await user.save();
          return done(null, user);
        }

        // Create new user
        console.log("👤 Creating new Google user");
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: email.toLowerCase(),
          avatar: profile.photos[0]?.value || "",
          emailVerified: true, // Google emails are pre-verified
          authProvider: "google",
          // Generate a random password for security (user won't use it)
          password: await bcrypt.hash(
            Math.random().toString(36).substring(2, 15),
            10,
          ),
        });

        await newUser.save();
        console.log("✅ New Google user created successfully");

        done(null, newUser);
      } catch (error) {
        console.error("❌ Google OAuth error:", error);
        done(error, null);
      }
    },
  ),
);

// ==============================================
// FACEBOOK OAUTH STRATEGY
// ==============================================

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        "http://localhost:4000/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(
          "🔍 Facebook OAuth - Processing user:",
          profile.emails?.[0]?.value || "No email",
        );

        // Check if user already exists with this Facebook ID
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          console.log("✅ Existing Facebook user found");
          return done(null, user);
        }

        // Check if user exists with the same email (if email is available)
        let email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });

          if (user) {
            // Link Facebook account to existing user
            console.log("🔗 Linking Facebook account to existing user");
            user.facebookId = profile.id;
            user.avatar = user.avatar || profile.photos[0]?.value || "";
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        console.log("👤 Creating new Facebook user");

        // If no email from Facebook, create a placeholder
        if (!email) {
          email = `${profile.id}@facebook.placeholder.com`;
        }

        const newUser = new User({
          facebookId: profile.id,
          name: profile.displayName,
          email: email.toLowerCase(),
          avatar: profile.photos[0]?.value || "",
          emailVerified: !!profile.emails?.[0]?.value, // Only verify if real email
          authProvider: "facebook",
          // Generate a random password for security
          password: await bcrypt.hash(
            Math.random().toString(36).substring(2, 15),
            10,
          ),
        });

        await newUser.save();
        console.log("✅ New Facebook user created successfully");

        done(null, newUser);
      } catch (error) {
        console.error("❌ Facebook OAuth error:", error);
        done(error, null);
      }
    },
  ),
);

// Add this before your existing static middleware
app.use(
  "/images",
  (req, res, next) => {
    console.log("Image request:", req.url);
    next();
  },
  express.static(path.join(__dirname, "upload/images")),
);
app.use("/images", express.static("upload/images"));
// Serve category images statically
app.use("/images/categories", express.static("./upload/categories"));
// Serve category images statically
app.use("/images/blog-categories", express.static("./upload/blog-categories"));
// Serve category images statically
app.use("/images/blog", express.static("./upload/blog"));

// API creation
app.get('/', (req, res) => {
    res.send('Hello World!')
})

//Routers

 app.use("/" , blogCategoryRouter)
 app.use("/" , blogPostRouter)
 app.use("/api" , promoCodeRouter)
 app.use("/" , categoryRouter)
 app.use("/" , productRouter)
 app.use("/" , wishlistRouter)
 app.use("/" , newsletterRouter)
 app.use("/" , cartRouter)
 app.use("/" , contactRouter)
 app.use("/" , adminRouter)
 app.use("/" , checkoutRouter)
 app.use("/" , analyticsRouter)
 app.use("/" , orderRouter)
 app.use("/" , authRouter)
 app.use("/" , uploadRouter)


// =============================================
// END OF BLOG CATEGORY IMAGE UPLOAD
// =============================================

app.listen(port, (error) => {
  if (!error) {
    console.log(`Enhanced E-commerce Server running on port ${port}`);
  } else {
    console.log("Error: " + error);
  }
});
