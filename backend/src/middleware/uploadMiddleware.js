const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype) || filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp)!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Case Documents Config
const docUploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(docUploadDir)) {
  fs.mkdirSync(docUploadDir, { recursive: true });
}

const docStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, docUploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    );
  },
});

function checkDocType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed!'));
  }
}

const uploadDocuments = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: function (req, file, cb) {
    checkDocType(file, cb);
  },
});

// Victim Image Config
const victimImageDir = path.join(__dirname, '../../uploads/victim-images');
if (!fs.existsSync(victimImageDir)) {
  fs.mkdirSync(victimImageDir, { recursive: true });
}

const victimImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, victimImageDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `victim-img-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    );
  },
});

const uploadVictimImage = multer({
  storage: victimImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// ---------------------------------------------------------------------------
// Combined victim registration upload
// ---------------------------------------------------------------------------
// IMPORTANT: Do NOT chain uploadVictimImage.single(...) and
// uploadDocuments.array(...) on the same route. Multer's .single() and .array()
// are terminal parsers for a single field; the second one rejects the other
// field as LIMIT_UNEXPECTED_FILE, producing a 400 before validation runs.
//
// Instead, use ONE multer instance with .fields([...]) so both fields are
// parsed in a single pass. The controller then reads from
//   req.files.victimImage[0]
//   req.files.documents
// ---------------------------------------------------------------------------

const victimRegistrationStorage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === 'victimImage') return cb(null, victimImageDir);
    if (file.fieldname === 'documents') return cb(null, docUploadDir);
    return cb(new Error('Unexpected upload field'));
  },
  filename(req, file, cb) {
    const safeExt = path.extname(file.originalname);
    if (file.fieldname === 'victimImage') {
      return cb(
        null,
        `victim-img-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`
      );
    }
    return cb(
      null,
      `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`
    );
  },
});

const uploadVictimRegistration = multer({
  storage: victimRegistrationStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5MB/file, 1 image + up to 5 docs
  fileFilter(req, file, cb) {
    if (file.fieldname === 'victimImage') return checkFileType(file, cb);
    if (file.fieldname === 'documents') return checkDocType(file, cb);
    return cb(new Error('Unexpected upload field'));
  },
}).fields([
  { name: 'victimImage', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

module.exports = {
  upload,
  uploadDocuments,
  uploadVictimImage,
  uploadVictimRegistration,
};