import axios from 'axios';
import './App.css'
import { useQuery } from '@tanstack/react-query';

function App() {
  const requestValues = (): Promise<{ data: string[] }> => {
    return axios.get('http://localhost:3000/files');
  };
  const { data, isLoading } = useQuery({queryKey: ['vals'], queryFn: requestValues})

  return (
    <>
      {isLoading ? 'Loading':data?.data?.map((value) => <div>{value}</div>)}
    </>
  )
}

export default App
