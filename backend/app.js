import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'File Storage API',
      version: '1.0.0',
      description: 'A simple API for storing and retrieving files',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: ['./app.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Database setup
const db = new sqlite3.Database('file_storage.db');

db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, filename TEXT, content_type TEXT)',
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, token TEXT UNIQUE)',
  );
});

// Create example user
const createExampleUser = () => {
  const token = uuidv4();
  db.run(
    'INSERT OR IGNORE INTO users (username, token) VALUES (?, ?)',
    ['exampleUser', token],
    (err) => {
      if (err) {
        console.error('Error creating example user:', err);
      } else {
        console.log('Example user created with token:', token);
      }
    },
  );
};

createExampleUser();

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  db.get('SELECT * FROM users WHERE token = ?', [token], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next();
  });
};

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file to the server
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileId = path.parse(req.file.filename).name;
  const { originalname, mimetype } = req.file;

  db.run(
    'INSERT INTO files (id, filename, content_type) VALUES (?, ?, ?)',
    [fileId, originalname, mimetype],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving file metadata' });
      }
      res.status(201).json({ message: 'File uploaded successfully', file_id: fileId });
    },
  );
});

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List all files
 *     description: Retrieve a list of all uploaded files
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   content_type:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.get('/api/files', authenticate, (req, res) => {
  db.all('SELECT * FROM files', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving files' });
    }
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Download a file
 *     description: Download a specific file by its ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the file to download
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
app.get('/api/files/:id', authenticate, (req, res) => {
  const fileId = req.params.id;
  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'File not found' });
    }
    const filePath = path.join(__dirname, 'uploads', fileId + path.extname(row.filename));
    res.download(filePath, row.filename);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});

export { app };
