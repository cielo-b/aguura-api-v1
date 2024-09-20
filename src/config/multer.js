const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${path.join(__dirname, "../../public/images")}`);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.originalname.split(".")[0]}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, jpg and png files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).single("image");

const multipleUpload = multer({
  storage,
  fileFilter,
}).array("images");

module.exports = {
  upload,
  multipleUpload,
};
