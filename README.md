# File Storage App

This project is a full-stack application for storing and retrieving files. It consists of a Node.js backend API and a React frontend, using TanStack Query for efficient state management.

## Features

- File upload and storage
- File listing and download
- Simple token-based authentication
- Swagger API documentation for the backend
- React frontend with TanStack Query for state management

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or higher)
- npm (usually comes with Node.js)

## Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd file-storage-app/backend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will start on `http://localhost:3000` by default. You'll see a token printed in the console - keep this for use with the frontend.

## Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The React app will start on `http://localhost:5173` by default.

## Usage

1. Open the React app in your browser (usually `http://localhost:5173`).
2. Enter the token that was printed when you started the backend server.
3. Use the file input to select a file, then click "Upload File" to upload it.
4. The list of files will automatically update after a successful upload.
5. Click "Download" next to a file to download it.

## API Documentation

The backend includes Swagger documentation. Once the server is running, you can access it at:

```
http://localhost:3000/api-docs
```

## Testing

### Backend Tests

To run the backend tests:

```
cd backend
npm test
```

### Frontend Tests

To run the frontend tests:

```
cd frontend
npm test
```

## Technologies Used

- Backend:
  - Node.js
  - Express.js
  - SQLite (for data storage)
  - Multer (for file uploads)
  - Swagger (for API documentation)

- Frontend:
  - React
  - TanStack Query (for state management)
  - Axios (for HTTP requests)

## Contributing

Contributions to this project are welcome. Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

If you have any questions or feedback, please open an issue in the GitHub repository.