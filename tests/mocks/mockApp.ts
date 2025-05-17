import express from 'express';
import multer from 'multer';
import path from 'path';
import { postOcr } from '../../server/controllers/ocr.controller';

// Create express mock app for testing
const app = express();

// Configure multer for file uploads in tests
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'some-generated-name.pdf');
  }
});

const upload = multer({ storage });

// Set up the OCR route for testing
app.post('/api/ocr', upload.single('file'), postOcr);

export { app };
