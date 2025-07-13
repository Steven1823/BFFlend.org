import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Edit, Plus, Trash2, Wallet, AlertCircle, CheckCircle, MapPin, Briefcase, Heart } from 'lucide-react'

const Profile = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [profile, setProfile] = useState({
    fullName: '',
    location: '',
    profession: '',
    currentlyWorkingOn: '',
    bio: '',
    profilePhoto: null as File | null
  })
  const [userItems, setUserItems] = useState([
    { id: 1, name: 'Power Drill', price: '15', category: 'Tools', status: 'available' },
    { id: 2, name: 'Sewing Machine', price: '25', category: 'Equipment', status: 'rented' },
    { id: 3, name: 'Carpenter Tools Set', price: '30', category: 'Tools', status: 'available' }
  ])

  const professions = [
    'Carpenter', 'Electrician', 'Tailor', 'Mechanic', 'Plumber', 'Mason', 
    'Welder', 'Painter', 'Photographer', 'Chef', 'Hairdresser', 'Farmer',
    'Teacher', 'Student', 'Other'
  ]

  const locations = [
    'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya',
    'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Accra, Ghana',
    'Kumasi, Ghana', 'Cairo, Egypt', 'Cape Town, South Africa', 'Other'
  ]

  const handleWalletConnect = async () => {
    setIsConnecting(true)
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsWalletConnected(true)
      setWalletAddress('0x1234...abcd')
      
      // Show success message
      setTimeout(() => {
        alert('Wallet connected successfully! You can now post items securely.')
      }, 500)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfile(prev => ({ ...prev, profilePhoto: file }))
    }
  }

  const handleRemoveItem = (itemId: number) => {
    setUserItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleAddItem = () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first to post items safely!')
      return
    }
    // Add item logic here
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your BFFlend profile and listings</p>
        </div>

        {/* Wallet Connection Alert */}
        {!isWalletConnected && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-amber-800 font-medium">Connect wallet to lend or borrow safely</p>
              <p className="text-amber-700 text-sm">Your wallet ensures secure transactions and protects your items</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Profile Information
                  {isWalletConnected && <CheckCircle className="w-5 h-5 text-green-600" />}
                </CardTitle>
                <CardDescription>
                  Your profile helps others in the community know you better
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.profilePhoto ? URL.createObjectURL(profile.profilePhoto) : undefined} />
                    <AvatarFallback className="text-lg">
                      {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        className="hidden"
                      />
                      <Button variant="outline" className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Upload Photo
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      value={profile.fullName}
                      onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Select value={profile.location} onValueChange={(value) => setProfile(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession
                  </label>
                  <Select value={profile.profession} onValueChange={(value) => setProfile(prev => ({ ...prev, profession: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map((profession) => (
                        <SelectItem key={profession} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currently Working On
                  </label>
                  <Textarea
                    value={profile.currentlyWorkingOn}
                    onChange={(e) => setProfile(prev => ({ ...prev, currentlyWorkingOn: e.target.value }))}
                    placeholder="e.g., Building a custom shelf for my workshop"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself and what you're passionate about"
                    className="min-h-[120px]"
                  />
                </div>

                <Button className="w-full md:w-auto">
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            {/* My Items Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Items</CardTitle>
                    <CardDescription>
                      Items you've posted for lending
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddItem} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {userItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items posted yet</p>
                    <p className="text-sm">Start by adding your first item!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category} • ${item.price}/day</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isWalletConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <p className="text-sm text-gray-600 break-all">{walletAddress}</p>
                    <Button variant="outline" size="sm" onClick={() => setIsWalletConnected(false)}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Connect your wallet to securely lend and borrow items
                    </p>
                    <Button 
                      onClick={handleWalletConnect} 
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location || 'Location not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">{profile.profession || 'Profession not set'}</span>
                </div>
                {profile.currentlyWorkingOn && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-1">Currently Working On:</p>
                    <p className="text-sm text-gray-600">{profile.currentlyWorkingOn}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Let's Connect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Let's Connect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {profile.profession && profile.location
                      ? `I'm a ${profile.profession.toLowerCase()} in ${profile.location.split(',')[0]} looking to collaborate.`
                      : 'Complete your profile to share your collaboration message!'
                    }
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  Connect & Collaborate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile