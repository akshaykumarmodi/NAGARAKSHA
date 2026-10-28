/**
 * NAGARAKSHA — File Upload API
 * Stores uploaded images as base64 data URLs (simple, no external storage needed).
 * For a hackathon, this is safe and practical.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${Date.now()}${ext}`);
  }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
  }
});

// POST /api/upload — upload evidence image
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

  // Return a data URL so the frontend can display it immediately without extra auth
  const fileData = fs.readFileSync(req.file.path);
  const base64 = fileData.toString('base64');
  const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: dataUrl,  // Data URL — safe to use directly in <img src>
      note: 'Uploaded as unverified evidence. Pending reviewer approval.'
    }
  });
});

export default router;
