const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const clinicOwnerUploadsDir = path.join(uploadsRoot, 'clinic-owner');

fs.mkdirSync(clinicOwnerUploadsDir, { recursive: true });

const sanitizeBaseName = (value) =>
  String(value || 'document')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'document';

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, clinicOwnerUploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const baseName = sanitizeBaseName(file.originalname);
    callback(null, `${Date.now()}-${baseName}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const clinicOwnerUpload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PDF, JPG, PNG, and WEBP files are allowed'));
      return;
    }

    callback(null, true);
  },
});

module.exports = {
  clinicOwnerUpload,
};
