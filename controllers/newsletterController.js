const Newsletter = require("../models/newsletterModel");

// Newsletter subscription endpoint
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email, name = "", source = "website" } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check if already subscribed
    const existingSubscriber = await Newsletter.findOne({
      email: email.toLowerCase(),
    });

    if (existingSubscriber) {
      if (existingSubscriber.status === "active") {
        return res.json({
          success: true,
          message: "You are already subscribed to our newsletter!",
          alreadySubscribed: true,
        });
      } else if (existingSubscriber.status === "unsubscribed") {
        // Resubscribe
        existingSubscriber.status = "active";
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = undefined;
        if (name) existingSubscriber.name = name;
        await existingSubscriber.save();

        return res.json({
          success: true,
          message:
            "Welcome back! You have been resubscribed to our newsletter.",
          resubscribed: true,
        });
      }
    }

    // Generate verification token
    const verificationToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Create new subscriber
    const subscriber = new Newsletter({
      email: email.toLowerCase(),
      name: name,
      status: "active", // For now, we'll set as active immediately
      subscriptionSource: source,
      ipAddress:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      verificationToken: verificationToken,
      emailVerified: false, // In production, send verification email
    });

    await subscriber.save();

    // In production, you would send a welcome email here
    // console.log('New newsletter subscriber:', email);

    res.json({
      success: true,
      message: "Thank you for subscribing! Welcome to Pink Dreams newsletter.",
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error.code === 11000) {
      // Duplicate email error
      return res.status(400).json({
        success: false,
        message: "This email is already subscribed to our newsletter",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Sorry, there was an error processing your subscription. Please try again.",
    });
  }
};

// Newsletter unsubscribe endpoint
exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our newsletter list",
      });
    }

    if (subscriber.status === "unsubscribed") {
      return res.json({
        success: true,
        message: "You are already unsubscribed from our newsletter",
      });
    }

    // Update subscription status
    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.json({
      success: true,
      message: "You have been successfully unsubscribed from our newsletter",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({
      success: false,
      message:
        "Sorry, there was an error processing your request. Please try again.",
    });
  }
};

// Get newsletter statistics (admin endpoint)
exports.getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({
      status: "active",
    });
    const unsubscribedCount = await Newsletter.countDocuments({
      status: "unsubscribed",
    });
    const pendingCount = await Newsletter.countDocuments({ status: "pending" });

    // Monthly subscription growth
    const monthlyGrowth = await Newsletter.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$subscribedAt" },
            month: { $month: "$subscribedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Subscription sources
    const sourceStats = await Newsletter.aggregate([
      { $group: { _id: "$subscriptionSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalSubscribers,
        activeSubscribers,
        unsubscribedCount,
        pendingCount,
        monthlyGrowth,
        sourceStats,
      },
    });
  } catch (error) {
    console.error("Newsletter stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching newsletter statistics",
    });
  }
};

// Get all subscribers (admin endpoint)
exports.getAllNewsletterSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status || "all";

    let query = {};
    if (status !== "all") {
      query.status = status;
    }

    const totalCount = await Newsletter.countDocuments(query);
    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-verificationToken"); // Don't expose verification tokens

    res.json({
      success: true,
      subscribers: subscribers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
      },
    });
  } catch (error) {
    console.error("Newsletter subscribers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscribers",
    });
  }
};

// Newsletter preferences update endpoint
exports.newsletterPreferences = async (req, res) => {
  try {
    const { email, preferences } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our newsletter list",
      });
    }

    // Update preferences
    if (preferences) {
      subscriber.preferences = { ...subscriber.preferences, ...preferences };
      await subscriber.save();
    }

    res.json({
      success: true,
      message: "Your preferences have been updated successfully",
      preferences: subscriber.preferences,
    });
  } catch (error) {
    console.error("Newsletter preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating preferences",
    });
  }
};

module.exports = exports;
