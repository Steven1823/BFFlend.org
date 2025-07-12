import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, Star, TrendingUp, Users, CheckCircle } from 'lucide-react'
import TrustBadge from '../components/TrustBadge'

const Landing: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Trustless',
      description: 'Smart contracts ensure secure transactions with built-in escrow and dispute resolution.'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Fast, low-cost transactions on the Celo blockchain with mobile-first design.'
    },
    {
      icon: Globe,
      title: 'Built for Africa',
      description: 'Designed specifically for African users with local payment methods and currencies.'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: Users },
    { label: 'Items Listed', value: '25,000+', icon: TrendingUp },
    { label: 'Successful Rentals', value: '50,000+', icon: CheckCircle },
    { label: 'Trust Score', value: '4.9/5', icon: Star }
  ]

  const testimonials = [
    {
      name: 'Amara Okafor',
      location: 'Lagos, Nigeria',
      text: 'FriendLend helped me rent out my camera equipment when I wasn\'t using it. I\'ve earned over $500 this month!',
      rating: 5
    },
    {
      name: 'Kwame Asante',
      location: 'Accra, Ghana',
      text: 'I needed a power drill for a weekend project. Found one nearby for just $10/day. Much better than buying!',
      rating: 5
    },
    {
      name: 'Fatima Hassan',
      location: 'Cairo, Egypt',
      text: 'The platform is so easy to use and payments are instant. I feel safe renting from verified users.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg hero-pattern text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Share the things you love,
              <span className="block text-emerald-200">earn while you do</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto text-balance">
              Africa's first Web3-powered P2P rental marketplace. Rent anything from cameras to cars, 
              all secured by blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/browse" className="btn-primary bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
                Start Browsing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/dashboard/lender" className="btn-secondary border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4">
                List Your Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <TrustBadge text="Blockchain Secured" />
            <TrustBadge text="KYC Verified Users" />
            <TrustBadge text="Instant Payments" />
            <TrustBadge text="24/7 Support" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FriendLend?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built on cutting-edge blockchain technology to provide the most secure and efficient rental experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 text-center hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              Join the growing community of renters and lenders across Africa
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people using FriendLend
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join thousands of users who are already earning money by sharing their items.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse" className="btn-primary bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
              Browse Items
            </Link>
            <Link to="/dashboard/lender" className="btn-secondary border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4">
              List Your First Item
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing