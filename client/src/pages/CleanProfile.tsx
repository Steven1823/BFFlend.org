import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, User, Briefcase } from 'lucide-react'

const CleanProfile = () => {
  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    profession: '',
    profilePhoto: null as File | null
  })
  
  const [photoPreview, setPhotoPreview] = useState<string>('')

  // System theme detection on component mount
  useEffect(() => {
    const detectSystemTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      
      // Apply theme to document root
      document.documentElement.classList.toggle('dark', prefersDark)
    }

    // Initial detection
    detectSystemTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
      document.documentElement.classList.toggle('dark', e.matches)
    }

    mediaQuery.addEventListener('change', handleThemeChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  // Handle input changes with real-time updates
  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle photo upload with preview
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfile(prev => ({ ...prev, profilePhoto: file }))
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!profile.fullName.trim()) return 'U'
    return profile.fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className={`shadow-lg border-0 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <CardHeader className="text-center pb-4">
            <CardTitle className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Create Your Profile
            </CardTitle>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Set up your profile to get started
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  {photoPreview ? (
                    <AvatarImage 
                      src={photoPreview} 
                      alt="Profile" 
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className={`text-2xl font-semibold ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <label 
                  htmlFor="photo-upload" 
                  className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </label>
                
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              
              <p className={`text-xs text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Click the camera icon to upload your photo
              </p>
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium flex items-center gap-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <User className="w-4 h-4" />
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={profile.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Profession Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium flex items-center gap-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Briefcase className="w-4 h-4" />
                Profession
              </label>
              <Input
                type="text"
                placeholder="What do you do?"
                value={profile.profession}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Preview Section */}
            {(profile.fullName || profile.profession || photoPreview) && (
              <div className={`mt-6 p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Preview
                </h3>
                
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    {photoPreview ? (
                      <AvatarImage 
                        src={photoPreview} 
                        alt="Profile preview" 
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className={`text-sm font-semibold ${
                        isDarkMode 
                          ? 'bg-gray-600 text-gray-300' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {getUserInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {profile.fullName || 'Your Name'}
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {profile.profession || 'Your Profession'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* System Theme Info */}
            <div className={`text-center p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-blue-900/30 border border-blue-800' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-xs ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Theme automatically detected: {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
            </div>

            {/* Save Button */}
            <Button 
              className={`w-full font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={!profile.fullName.trim() || !profile.profession.trim()}
            >
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CleanProfile