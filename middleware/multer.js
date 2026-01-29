const multer = require("multer");
const path = require("path");
const fs = require("fs");

//Product Image Upload

const uploadDir = path.join(__dirname, "../upload/images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created upload directory:", uploadDir);
}

const storage = multer.diskStorage({
  destination: "../upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({ storage: storage });


// Category Image Upload

const categoryUploadDir = "../upload/categories";
if (!fs.existsSync(categoryUploadDir)) {
  fs.mkdirSync(categoryUploadDir, { recursive: true });
  console.log("✅ Category upload directory created");
}

// Configure multer for category images
const categoryStorage = multer.diskStorage({
  destination: "../upload/categories",
  filename: (req, file, cb) => {
    const uniqueName = `category_${Date.now()}${path.extname(file.originalname)}`;
    return cb(null, uniqueName);
  },
});

const categoryImageUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed.",
        ),
      );
    }
  },
});




// =============================================
// Blog CATEGORY IMAGE UPLOAD
// =============================================

// Create category upload directory
const blogCategoryUploadDir = "../upload/blog-categories";
if (!fs.existsSync(blogCategoryUploadDir)) {
  fs.mkdirSync(blogCategoryUploadDir, { recursive: true });
  console.log("✅ Category upload directory created");
}

// Configure multer for category images
const blogCategoryStorage = multer.diskStorage({
  destination: "../upload/blog-categories",
  filename: (req, file, cb) => {
    const uniqueName = `category_${Date.now()}${path.extname(file.originalname)}`;
    return cb(null, uniqueName);
  },
});

const blogCategoryImageUpload = multer({
  storage: blogCategoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed.",
        ),
      );
    }
  },
});



// =============================================
// Blog  IMAGE UPLOAD
// =============================================

// Create blog upload directory
const blogUploadDir = "../upload/blog";
if (!fs.existsSync(blogUploadDir)) {
  fs.mkdirSync(blogUploadDir, { recursive: true });
  console.log("✅ Blog upload directory created");
}

// Configure multer for category images
const blogStorage = multer.diskStorage({
  destination: "../upload/blog",
  filename: (req, file, cb) => {
    const uniqueName = `blog_${Date.now()}${path.extname(file.originalname)}`;
    return cb(null, uniqueName);
  },
});

const blogImageUpload = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed.",
        ),
      );
    }
  },
});





module.exports = {
    upload,
    categoryImageUpload,
    blogCategoryImageUpload,
    blogImageUpload
}

