import request from 'supertest';
import { app } from '../app.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let server;
let testToken;
let uploadedFileId;

beforeAll(async () => {
  // Capture console.log output
  const originalLog = console.log;
  let logOutput = '';
  console.log = (message) => {
    logOutput += message + '\n';
    originalLog(message);
  };

  server = app.listen(3001); // Use a different port for testing
  // Wait for the server to start and create the example user
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Extract the token from the captured log output
  const tokenMatch = logOutput.match(/Example user created with token: (.*)/);
  testToken = tokenMatch ? tokenMatch[1].trim() : null;

  // Restore console.log
  console.log = originalLog;
});

afterAll((done) => {
  server.close(done);
});

describe('File Storage API', () => {
  test('Upload a file', async () => {
    const testFilePath = path.join(__dirname, 'testfile.txt');
    fs.writeFileSync(testFilePath, 'This is a test file');

    const response = await request(server)
      .post('/api/upload')
      .set('Authorization', testToken)
      .attach('file', testFilePath);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('File uploaded successfully');
    expect(response.body.file_id).toBeDefined();

    uploadedFileId = response.body.file_id;
    fs.unlinkSync(testFilePath);
  });

  test('List files', async () => {
    const response = await request(server).get('/api/files').set('Authorization', testToken);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.some((file) => file.id === uploadedFileId)).toBe(true);
  });

  test('Download a file', async () => {
    const response = await request(server)
      .get(`/api/files/${uploadedFileId}`)
      .set('Authorization', testToken);

    expect(response.status).toBe(200);
    expect(response.header['content-disposition']).toContain('attachment');
    expect(response.text).toBe('This is a test file');
  });

  test('Try to access API without token', async () => {
    const response = await request(server).get('/api/files');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('No token provided');
  });

  test('Try to access API with invalid token', async () => {
    const response = await request(server).get('/api/files').set('Authorization', 'invalid_token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  test('Try to download non-existent file', async () => {
    const response = await request(server)
      .get('/api/files/non_existent_id')
      .set('Authorization', testToken);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('File not found');
  });
});
