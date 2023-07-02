const multer = require('multer');
const path = require('path');

// Allowed image file types
const allowedFileTypes = ['.jpg', '.jpeg', '.png',".webp"];

// Image validation function
const imageFilter = function (req, file, cb) {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedFileTypes.includes(ext)) {
    req.error = new Error('Only images with .jpg, .jpeg, .png, or .webp extensions are allowed.');
    cb(null, true);
  }
  // File accepted
  cb(null, true);
};


// Multer storage configuration for product images
const productImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/upload"));
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });
  

  
  // Multer storage configuration for profile images
  const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/profileimages");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  
  // Multer image upload middleware with file filter for product images
  const productImageUpload = multer({ storage: productImageStorage, fileFilter: imageFilter });
  
  // Multer image upload middleware with file filter for profile images
  const profileImageUpload = multer({ storage: profileImageStorage});
  
  module.exports = {
    productImageUpload,
    profileImageUpload,
  };