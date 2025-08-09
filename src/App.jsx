import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ClerkAuthProvider } from "@/hooks/useClerkAuth.jsx"

function App() {
  return (
    <ClerkAuthProvider>
      <Pages />
      <Toaster />
    </ClerkAuthProvider>
  )
}

export default App