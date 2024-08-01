import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import './App.css';

const queryClient = new QueryClient();

const API_URL = 'http://localhost:3000/api';

// API functions
const fetchFiles = async (token) => {
  const response = await axios.get(`${API_URL}/files`, {
    headers: { Authorization: token },
  });
  return response.data;
};

const uploadFile = async ({ token, file }) => {
  if (!file) throw new Error('Please select a file');
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: { Authorization: token },
  });
  return response.data;
};

function FileStorageApp() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['files', token],
    queryFn: () => fetchFiles(token),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', token] });
      setFile(null);
    },
  });

  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    uploadMutation.mutate({ token, file });
  };

  const downloadFile = (fileId) => {
    window.open(`${API_URL}/files/${fileId}?token=${token}`);
  };

  return (
    <div className='App'>
      <h1>File Storage App</h1>

      <input
        type='text'
        value={token}
        onChange={handleTokenChange}
        placeholder='Enter your token'
      />

      <input type='file' onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploadMutation.isPending}>
        {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
      </button>

      {uploadMutation.isError && <p>Error uploading file: {uploadMutation.error.message}</p>}
      {uploadMutation.isSuccess && <p>File uploaded successfully!</p>}

      <h2>Files:</h2>
      {filesQuery.isLoading && <p>Loading files...</p>}
      {filesQuery.isError && <p>Error loading files: {filesQuery.error.message}</p>}
      <ul>
        {filesQuery.data?.map((file) => (
          <li key={file.id}>
            {file.filename}
            <button onClick={() => downloadFile(file.id)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileStorageApp />
    </QueryClientProvider>
  );
}

export default App;
