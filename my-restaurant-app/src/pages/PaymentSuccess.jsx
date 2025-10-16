import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { API_URL, FRONTEND_BASE_URL } from "@/config/api"
import { fetchWithAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verificationStatus, setVerificationStatus] = useState('verifying') // 'verifying', 'success', 'failed'
  const [orderData, setOrderData] = useState(null)

  useEffect(() => {
    // Handle redirect from dev domain to production domain
    const currentUrl = window.location.href
    if (currentUrl.includes('dev.palachinki.store')) {
      // Redirect to production domain with same search parameters
      const newUrl = `${FRONTEND_BASE_URL}/payment-success${window.location.search}`
      console.log('Redirecting from dev domain to production:', newUrl)
      window.location.replace(newUrl)
      return
    }

    const verifyPayment = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}')
        
        // Try to get order ID from URL parameters first (from payment gateway)
        const orderIdFromUrl = searchParams.get('orderId')
        const pendingOrderId = orderIdFromUrl || sessionStorage.getItem('pending_order_id')
        const pendingPaymentId = sessionStorage.getItem('pending_payment_id')

        if (!user?.access_token) {
          throw new Error('User not logged in')
        }

        if (!pendingOrderId) {
          throw new Error('Missing order information')
        }

        // Verify payment with backend
        // If we have order ID from URL (payment gateway callback), we might not need payment_id
        const verifyPayload = {
          order_id: pendingOrderId
        }
        
        // Include payment_id if available (for session-based verification)
        if (pendingPaymentId) {
          verifyPayload.payment_id = pendingPaymentId
        }

        const response = await fetchWithAuth(`${API_URL}/order/payment/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(verifyPayload)
        })

        if (!response.ok) {
          throw new Error('Payment verification failed')
        }

        const data = await response.json()
        
        if (data.paid === true && data.status === 'success') {
          setVerificationStatus('success')
          setOrderData(data)
          
          // Clean up session storage
          sessionStorage.removeItem('pending_order_id')
          sessionStorage.removeItem('pending_payment_id')
          
          toast.success('Payment verified successfully!')
          
          // Auto-redirect after 3 seconds
          // Use order ID from response or from URL parameter
          const redirectOrderId = data.order_id || pendingOrderId
          setTimeout(() => {
            navigate(`/order-tracking-v2/${redirectOrderId}`)
          }, 3000)
        } else {
          setVerificationStatus('failed')
          toast.error('Payment verification failed')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setVerificationStatus('failed')
        toast.error(error.message || 'Payment verification failed')
      }
    }

    verifyPayment()
  }, [navigate, searchParams])

  const handleContinue = () => {
    if (verificationStatus === 'success') {
      // Try to get order ID from different sources
      const orderIdFromUrl = searchParams.get('orderId')
      const orderIdFromData = orderData?.order_id
      const orderIdFromSession = sessionStorage.getItem('pending_order_id')
      const redirectOrderId = orderIdFromData || orderIdFromUrl || orderIdFromSession
      
      if (redirectOrderId) {
        navigate(`/order-tracking-v2/${redirectOrderId}`)
      } else {
        navigate('/food') // Go to food page if no order ID available
      }
    } else {
      navigate('/cart')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {verificationStatus === 'verifying' && (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                )}
                {verificationStatus === 'success' && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                )}
                {verificationStatus === 'failed' && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl">
                {verificationStatus === 'verifying' && 'Verifying Payment...'}
                {verificationStatus === 'success' && 'Payment Successful!'}
                {verificationStatus === 'failed' && 'Payment Failed'}
              </CardTitle>
              
              <CardDescription>
                {verificationStatus === 'verifying' && 'Please wait while we verify your payment.'}
                {verificationStatus === 'success' && 'Your payment has been processed successfully. You will be redirected to order tracking shortly.'}
                {verificationStatus === 'failed' && 'There was an issue processing your payment. Please try again.'}
              </CardDescription>
            </CardHeader>
            
            {verificationStatus !== 'verifying' && (
              <CardContent className="text-center">
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                  variant={verificationStatus === 'success' ? 'default' : 'outline'}
                >
                  {verificationStatus === 'success' ? 'View Order' : 'Back to Cart'}
                </Button>
                
                {verificationStatus === 'success' && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Redirecting automatically in 3 seconds...
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}