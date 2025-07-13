import React from 'react'
import { Link, useLocation } from 'wouter'
import { Wallet, Menu, X, Shield, Search, User } from 'lucide-react'

interface NavbarProps {
  isConnected: boolean
  userAddress: string
  onConnect: () => void
  onDisconnect: () => void
}

const Navbar: React.FC<NavbarProps> = ({ isConnected, userAddress, onConnect, onDisconnect }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [location] = useLocation()

  const isActive = (path: string) => location === path

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FriendLend</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/browse" 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/browse') 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Browse Items</span>
            </Link>
            
            {isConnected && (
              <>
                <Link 
                  to="/dashboard/borrower" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard/borrower') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  My Rentals
                </Link>
                <Link 
                  to="/dashboard/lender" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard/lender') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  My Items
                </Link>
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-emerald-700">{userAddress}</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex items-center space-x-2 btn-primary"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/browse" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                <span>Browse Items</span>
              </Link>
              
              {isConnected && (
                <>
                  <Link 
                    to="/dashboard/borrower" 
                    className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Rentals
                  </Link>
                  <Link 
                    to="/dashboard/lender" 
                    className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Items
                  </Link>
                </>
              )}
              
              <div className="pt-3 border-t border-gray-200">
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-700">{userAddress}</span>
                    </div>
                    <button
                      onClick={() => {
                        onDisconnect()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onConnect()
                      setIsMenuOpen(false)
                    }}
                    className="w-full btn-primary"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar