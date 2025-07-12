import React, { useState } from 'react'
import { Search, Filter, MapPin, Star, Clock } from 'lucide-react'
import ItemCard from '../components/ItemCard'

const Browse: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'tools', name: 'Tools & Equipment' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'sports', name: 'Sports & Recreation' },
    { id: 'books', name: 'Books & Media' },
    { id: 'clothing', name: 'Clothing & Fashion' }
  ]

  const locations = [
    { id: 'all', name: 'All Locations' },
    { id: 'lagos', name: 'Lagos, Nigeria' },
    { id: 'accra', name: 'Accra, Ghana' },
    { id: 'cairo', name: 'Cairo, Egypt' },
    { id: 'nairobi', name: 'Nairobi, Kenya' },
    { id: 'cape-town', name: 'Cape Town, South Africa' }
  ]

  const mockItems = [
    {
      id: '1',
      title: 'Canon EOS R5 Camera',
      description: 'Professional mirrorless camera perfect for photography and videography',
      price: '25',
      location: 'Lagos, Nigeria',
      category: 'Electronics',
      condition: 'Excellent',
      rating: 4.9,
      reviews: 23,
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop',
      owner: {
        name: 'Adebayo Johnson',
        verified: true,
        rating: 4.8
      }
    },
    {
      id: '2',
      title: 'MacBook Pro 16" M2',
      description: 'Latest MacBook Pro with M2 chip, perfect for creative work and development',
      price: '45',
      location: 'Accra, Ghana',
      category: 'Electronics',
      condition: 'Like New',
      rating: 5.0,
      reviews: 15,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
      owner: {
        name: 'Kwame Asante',
        verified: true,
        rating: 4.9
      }
    },
    {
      id: '3',
      title: 'Honda Civic 2022',
      description: 'Reliable and fuel-efficient car for city driving and weekend trips',
      price: '80',
      location: 'Cairo, Egypt',
      category: 'Vehicles',
      condition: 'Good',
      rating: 4.7,
      reviews: 31,
      image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400&h=300&fit=crop',
      owner: {
        name: 'Fatima Hassan',
        verified: true,
        rating: 4.6
      }
    },
    {
      id: '4',
      title: 'Professional Drill Set',
      description: 'Complete drill set with various bits and accessories for all your DIY needs',
      price: '15',
      location: 'Nairobi, Kenya',
      category: 'Tools',
      condition: 'Good',
      rating: 4.5,
      reviews: 18,
      image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop',
      owner: {
        name: 'James Mwangi',
        verified: true,
        rating: 4.7
      }
    },
    {
      id: '5',
      title: 'Gaming Setup Complete',
      description: 'High-end gaming PC with monitor, keyboard, and mouse. Perfect for gaming sessions',
      price: '60',
      location: 'Cape Town, South Africa',
      category: 'Electronics',
      condition: 'Excellent',
      rating: 4.8,
      reviews: 27,
      image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop',
      owner: {
        name: 'Thabo Molefe',
        verified: true,
        rating: 4.9
      }
    },
    {
      id: '6',
      title: 'Mountain Bike',
      description: 'High-quality mountain bike perfect for trails and city cycling',
      price: '20',
      location: 'Lagos, Nigeria',
      category: 'Sports',
      condition: 'Good',
      rating: 4.6,
      reviews: 12,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
      owner: {
        name: 'Chioma Okafor',
        verified: true,
        rating: 4.5
      }
    }
  ]

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           item.category.toLowerCase() === selectedCategory
    const matchesLocation = selectedLocation === 'all' || 
                           item.location.toLowerCase().includes(selectedLocation.replace('-', ' '))
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Items</h1>
          <p className="text-gray-600">Discover amazing items available for rent in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {filteredItems.length} of {mockItems.length} items
          </p>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Sort by: Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating: High to Low</option>
              <option>Newest First</option>
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse all categories</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedLocation('all')
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Browse