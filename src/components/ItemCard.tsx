import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Shield, Clock } from 'lucide-react'

interface ItemCardProps {
  item: {
    id: string
    title: string
    description: string
    price: string
    location: string
    category: string
    condition: string
    rating: number
    reviews: number
    image: string
    owner: {
      name: string
      verified: boolean
      rating: number
    }
  }
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <Link to={`/item/${item.id}`} className="block group">
      <div className="card overflow-hidden hover:scale-105 transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {item.category}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white text-gray-900 text-xs font-semibold px-2 py-1 rounded-full">
              {item.condition}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {item.description}
          </p>

          {/* Location and Rating */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {item.location}
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
              {item.rating} ({item.reviews})
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-emerald-600 font-semibold text-sm">
                  {item.owner.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{item.owner.name}</span>
                  {item.owner.verified && (
                    <Shield className="w-4 h-4 ml-1 text-emerald-600" />
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                  {item.owner.rating}
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-600">${item.price}</span>
              <span className="text-gray-500 text-sm">/day</span>
            </div>
            <div className="flex items-center text-emerald-600 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              Available now
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ItemCard