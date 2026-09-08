import { useState } from 'react'


function App() {
    const [status,setStatus] = useState('Not pinged yet');
    async function pingServer(){
        try{
            const response = await fetch ('/api/ping');
            if(response.ok){
                const messege = await response.text();
                setStatus('ok'+ message);
            }else {
        setStatus(' Server error: ' + response.status);
      }
        }
         catch (error) {
      setStatus(' Cannot reach , try cathc failed , redo');
    }
    }
  
}

export default App
