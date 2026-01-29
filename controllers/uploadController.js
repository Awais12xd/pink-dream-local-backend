const path = require("path");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");


exports.uploadAuthorProfileImageController = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

       let avatar = "";
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file);
      avatar =  cloudinaryResult.url;
    }

    if(!avatar){
      res.json({
        success: false,
        message: "Error while uploading author image",
      });
    }



      console.log("✅ author image uploaded:", avatar);

      res.json({
        success: true,
        message: "Author image uploaded successfully",
        imageUrl: avatar,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("❌ Author image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Author image upload failed",
        error: error.message,
      });
    }
  };
exports.uploadBlogImageController = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

       let avatar = "";
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file);
      avatar =  cloudinaryResult.url;
    }

    if(!avatar){
      res.json({
        success: false,
        message: "Error while uploading Blog image",
      });
    }



      console.log("✅ Blog image uploaded:", avatar);

      res.json({
        success: true,
        message: "Blog image uploaded successfully",
        imageUrl: avatar,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("❌ blog image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Blog image upload failed",
        error: error.message,
      });
    }
  };

exports.uploadBlogCategoryImageController = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      
       let avatar = "";
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file);
      avatar =  cloudinaryResult.url;
    }

    if(!avatar){
      res.json({
        success: false,
        message: "Error while uploading Blog category image",
      });
    }



      console.log("✅ Blog category image uploaded:", avatar);

      res.json({
        success: true,
        message: "Blog Category image uploaded successfully",
        imageUrl: avatar,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("❌ blog Category image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Blog Category image upload failed",
        error: error.message,
      });
    }
};


exports.uploadCategoryImageController = (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      const imageUrl = `${req.protocol}://${req.get("host")}/images/categories/${req.file.filename}`;
      console.log(imageUrl , "image category")

      console.log("✅ Category image uploaded:", req.file.filename );

      res.json({
        success: true,
        message: "Category image uploaded successfully",
        imageUrl: imageUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("❌ Category image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Category image upload failed",
        error: error.message,
      });
    }
};


exports.uploadProductImageController = (req, res) => {
  console.log("req is htting")
  try {
    if (!req.file) {
      return res.status(400).json({
        success: 0,
        message: "No file uploaded",
      });
    }

    // Use environment variable for base URL
    // const baseUrl =
    //   process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
     const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/images/${req.file.filename}`;
      console.log(imageUrl , "image category")


    console.log("Image uploaded:", {
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl,
    });

    res.json({
      success: 1,
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: 0,
      message: "Upload failed",
    });
  }
}

module.exports = exports;