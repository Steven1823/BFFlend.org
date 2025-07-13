import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import ItemDetail from './pages/ItemDetail'
import BorrowerDashboard from './pages/Dashboard/Borrower'
import LenderDashboard from './pages/Dashboard/Lender'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          isConnected={isConnected} 
          userAddress={userAddress}
          onConnect={() => {
            setIsConnected(true)
            setUserAddress('0x1234...5678')
          }}
          onDisconnect={() => {
            setIsConnected(false)
            setUserAddress('')
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/dashboard/borrower" element={<BorrowerDashboard />} />
          <Route path="/dashboard/lender" element={<LenderDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App