const express = require("express");
const { uploadBlogImageController, uploadBlogCategoryImageController, uploadAuthorProfileImageController, uploadCategoryImageController, uploadProductImageController } = require("../controllers/uploadController");
const { blogImageUpload, blogCategoryImageUpload, categoryImageUpload, upload } = require("../middleware/multer");
const  uploadMulterTemp  = require("../utils/multerTemp");
const router = express.Router();

// router.post( "/upload/blog-image",
//   blogImageUpload.single("blogImage"),
//     uploadBlogImageController
// );
router.post( "/upload/blog-image",
  uploadMulterTemp.single("blogImage"),
    uploadBlogImageController
);

router.post( "/upload/author-profile-image",
  uploadMulterTemp.single("authorProfileImage"),
    uploadAuthorProfileImageController
);

// Blog Category Image Upload Endpoint
router.post( "/upload/blog-category-image",
  uploadMulterTemp.single("blogCategoryImage"),
  uploadBlogCategoryImageController
);
// router.post( "/upload/blog-category-image",
//   blogCategoryImageUpload.single("blogCategoryImage"),
//   uploadBlogCategoryImageController
// );

// Category Image Upload Endpoint
router.post(
  "/upload/category-image",
  categoryImageUpload.single("categoryImage"),
  uploadCategoryImageController
);

router.post("/upload", upload.single("product"), uploadProductImageController );


module.exports = router;