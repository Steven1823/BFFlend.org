import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Shield, Star } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Browse
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="p-6">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Calendar className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium">Item Image</p>
                  <p className="text-sm">Loading item #{id}</p>
                </div>
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>

            {/* Item Details */}
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Premium Camera Equipment
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">(24 reviews)</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">$45</p>
                    <p className="text-sm text-gray-600">per day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">$300</p>
                    <p className="text-sm text-gray-600">per week</p>
                  </div>
                </div>
                
                {/* Rental Period Selector */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Request Rental
                </button>
              </div>

              {/* Owner Info */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Alex Johnson</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="w-4 h-4 mr-1 text-green-500" />
                      Verified Owner
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">4.9</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">127</p>
                    <p className="text-xs text-gray-600">Rentals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">2.5y</p>
                    <p className="text-xs text-gray-600">Member</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 pb-6">
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">
                Professional-grade camera equipment perfect for photography enthusiasts and professionals. 
                This high-quality camera delivers exceptional image quality and comes with all necessary 
                accessories. Ideal for events, portraits, and creative projects. Well-maintained and 
                regularly serviced to ensure optimal performance.
              </p>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Camera Body
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Standard Lens
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Battery & Charger
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Memory Card
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Carrying Case
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    User Manual
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}