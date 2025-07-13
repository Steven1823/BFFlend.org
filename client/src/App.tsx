import React, { useState } from 'react'
import { Route, Switch } from 'wouter'
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
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/browse" component={Browse} />
        <Route path="/item/:id" component={ItemDetail} />
        <Route path="/dashboard/borrower" component={BorrowerDashboard} />
        <Route path="/dashboard/lender" component={LenderDashboard} />
      </Switch>
    </div>
  )
}

export default App