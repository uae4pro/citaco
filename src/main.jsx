import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { CustomClerkProvider } from '@/lib/clerk.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <CustomClerkProvider>
        <App />
    </CustomClerkProvider>
)