import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  onPaymentSuccess: (transactionId: string) => void
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  description,
  onPaymentSuccess
}) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1)
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else if (cleaned.length === 9) {
      // Assume it's missing the country code
      cleaned = '254' + cleaned
    }
    
    return cleaned
  }

  const initiatePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setErrorMessage('Please enter a valid phone number')
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formatPhoneNumber(phoneNumber),
          amount: Math.round(amount * 100), // Convert to cents
          accountReference: `BFFLEND-${Date.now()}`,
          transactionDesc: description
        }),
      })

      const data = await response.json()

      if (response.ok && data.ResponseCode === '0') {
        setCheckoutRequestId(data.CheckoutRequestID)
        // Start polling for payment status
        pollPaymentStatus(data.CheckoutRequestID)
      } else {
        setPaymentStatus('failed')
        setErrorMessage(data.CustomerMessage || data.error || 'Payment initiation failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('failed')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const pollPaymentStatus = async (requestId: string) => {
    let attempts = 0
    const maxAttempts = 30 // Poll for 5 minutes (30 * 10 seconds)

    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/status/${requestId}`)
        const data = await response.json()

        if (data.ResultCode === '0') {
          // Payment successful
          setPaymentStatus('success')
          onPaymentSuccess(data.MpesaReceiptNumber || requestId)
          return
        } else if (data.ResultCode === '1032') {
          // Payment cancelled by user
          setPaymentStatus('failed')
          setErrorMessage('Payment was cancelled')
          return
        } else if (data.ResultCode !== '1037') {
          // Any error code except "pending"
          setPaymentStatus('failed')
          setErrorMessage(data.ResultDesc || 'Payment failed')
          return
        }

        // Still pending, continue polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        } else {
          setPaymentStatus('failed')
          setErrorMessage('Payment timeout. Please try again.')
        }
      } catch (error) {
        console.error('Status check error:', error)
        setPaymentStatus('failed')
        setErrorMessage('Failed to check payment status')
      }
    }

    poll()
  }

  const resetModal = () => {
    setPhoneNumber('')
    setPaymentStatus('idle')
    setCheckoutRequestId('')
    setErrorMessage('')
    setIsProcessing(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              M-Pesa Payment
            </CardTitle>
            <CardDescription>
              Pay with M-Pesa for {description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {paymentStatus === 'idle' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  KSh {amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Amount to pay</div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  M-Pesa Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="0700123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-center"
                />
                <div className="text-xs text-gray-500 text-center">
                  Enter your M-Pesa registered phone number
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              )}

              <Button 
                onClick={initiatePayment} 
                disabled={isProcessing || !phoneNumber}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  'Pay with M-Pesa'
                )}
              </Button>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-600 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Payment Initiated</h3>
              <p className="text-gray-600 mb-4">
                Check your phone for the M-Pesa payment request
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  • Enter your M-Pesa PIN when prompted<br />
                  • Confirm the payment amount<br />
                  • Wait for confirmation SMS
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  You will receive an M-Pesa confirmation SMS shortly
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <div className="space-y-2">
                <Button onClick={() => setPaymentStatus('idle')} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            2% of this transaction will help feed children in need 🍚
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentModal