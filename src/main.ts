import { RegisterServerOptions } from '@peertube/peertube-types'

async function register({ 
  registerHook, 
  registerSetting, 
  settingsManager, 
  storageManager, 
  videoCategoryManager, 
  peertubeHelpers 
}: RegisterServerOptions) {
  
  // Register plugin settings
  registerSetting({
    name: 'nano-node-url',
    label: 'Nano Node RPC URL',
    type: 'input',
    default: 'https://proxy.nanos.cc/proxy',
    private: false
  })

  registerSetting({
    name: 'nano-wallet-seed',
    label: 'Nano Wallet Seed (Private)',
    type: 'input-password',
    private: true
  })

  registerSetting({
    name: 'payment-timeout',
    label: 'Payment Timeout (minutes)',
    type: 'input',
    default: '10',
    private: false
  })

  // Add premium video category if it doesn't exist
  videoCategoryManager.addCategory(100, 'Premium Content')

  // Hook to add premium flag to video model
  registerHook({
    target: 'action:api.video.uploaded',
    handler: (async (params: any) => {
      const { video } = params
      // Store premium status in plugin storage
      if (video.pluginData?.isPremium) {
        await storageManager.storeData(`video-${video.id}-premium`, {
          isPremium: true,
          price: video.pluginData.price || '0.1',
          currency: 'XNO'
        })
      }
    }) as any
  })

  // Hook to filter video access
  registerHook({
    target: 'filter:api.video.get.result',
    handler: (async (video: any) => {
      if (!video) return video

      // Check if video is premium
      const premiumData = await storageManager.getData(`video-${video.id}-premium`) as any
      if (premiumData?.isPremium) {
        video.isPremium = true
        video.premiumPrice = premiumData.price
        
        // Check if user has paid for this video
        const userId = video.userId // This would need to be properly extracted from context
        if (userId) {
          const hasPaid = await storageManager.getData(`user-${userId}-video-${video.id}-paid`)
          video.hasAccess = !!hasPaid
        } else {
          video.hasAccess = false
        }
      }

      return video
    }) as any
  })

  // Hook to handle video streaming access
  registerHook({
    target: 'filter:api.video.pre-import-url.accept.result',
    handler: ((result: any) => {
      // This would be used to check premium access before allowing video streaming
      return result
    }) as any
  })

  // Add custom routes for payment handling
  const router = (peertubeHelpers as any).express.Router()
  
  // Route to set premium status for a video
  router.post('/set-premium', async (req: any, res: any) => {
    try {
      const { videoId, isPremium, price } = req.body
      
      if (isPremium) {
        await storageManager.storeData(`video-${videoId}-premium`, {
          isPremium: true,
          price: price || '0.1',
          currency: 'XNO',
          updatedAt: new Date().toISOString()
        })
      } else {
        await storageManager.storeData(`video-${videoId}-premium`, null)
      }

      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message })
    }
  })
  
  // Route to generate payment address
  router.post('/generate-payment', async (req: any, res: any) => {
    try {
      const { videoId, userId } = req.body
      
      // Generate unique payment address for this transaction
      const paymentId = `${userId}-${videoId}-${Date.now()}`
      const paymentAddress = await generateNanoAddress(paymentId, settingsManager)
      
      // Store payment request
      await storageManager.storeData(`payment-${paymentId}`, {
        videoId,
        userId,
        address: paymentAddress,
        status: 'pending',
        createdAt: new Date().toISOString()
      })

      res.json({
        success: true,
        paymentId,
        address: paymentAddress,
        amount: '0.1' // This should come from video premium data
      })
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message })
    }
  })

  // Route to check payment status
  router.get('/check-payment/:paymentId', async (req: any, res: any) => {
    try {
      const { paymentId } = req.params
      const paymentData = await storageManager.getData(`payment-${paymentId}`) as any
      
      if (!paymentData) {
        return res.status(404).json({ success: false, error: 'Payment not found' })
      }

      // Check if payment has been received
      const isReceived = await checkNanoPayment(paymentData.address, paymentData.amount, settingsManager)
      
      if (isReceived && paymentData.status === 'pending') {
        // Mark as paid
        paymentData.status = 'completed'
        paymentData.completedAt = new Date().toISOString()
        await storageManager.storeData(`payment-${paymentId}`, paymentData)
        
        // Grant access to video
        await storageManager.storeData(`user-${paymentData.userId}-video-${paymentData.videoId}-paid`, {
          paidAt: new Date().toISOString(),
          paymentId
        })
      }

      res.json({
        success: true,
        status: paymentData.status,
        paid: paymentData.status === 'completed'
      })
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message })
    }
  })

  // Route to get admin statistics
  router.get('/admin/stats', async (req: any, res: any) => {
    try {
      // Get all premium videos
      const allKeys = (await storageManager.getData('__all_keys__') || []) as string[]
      const premiumVideoKeys = allKeys.filter((key: string) => key.includes('-premium'))
      
      // Get all payments
      const paymentKeys = allKeys.filter((key: string) => key.startsWith('payment-'))
      const payments = await Promise.all(
        paymentKeys.map(async (key: string) => await storageManager.getData(key))
      )
      
      const completedPayments = payments.filter((p: any) => p?.status === 'completed')
      const pendingPayments = payments.filter((p: any) => p?.status === 'pending')
      
      const totalRevenue = completedPayments.reduce((sum: number, payment: any) => {
        return sum + parseFloat(payment.amount || '0.1')
      }, 0)

      res.json({
        success: true,
        data: {
          premiumVideos: premiumVideoKeys.length,
          totalPayments: completedPayments.length,
          pendingPayments: pendingPayments.length,
          totalRevenue: totalRevenue.toFixed(3)
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message })
    }
  })

  // Route to export payments as CSV
  router.get('/admin/export-payments', async (req: any, res: any) => {
    try {
      const allKeys = (await storageManager.getData('__all_keys__') || []) as string[]
      const paymentKeys = allKeys.filter((key: string) => key.startsWith('payment-'))
      const payments = await Promise.all(
        paymentKeys.map(async (key: string) => ({
          id: key,
          ...(await storageManager.getData(key) as any)
        }))
      )

      // Generate CSV
      const csvHeader = 'Payment ID,Video ID,User ID,Amount,Status,Created At,Completed At\n'
      const csvRows = payments.map((payment: any) => 
        `${payment.id},${payment.videoId},${payment.userId},${payment.amount || '0.1'},${payment.status},${payment.createdAt},${payment.completedAt || ''}`
      ).join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=nano-payments.csv')
      res.send(csvHeader + csvRows)
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message })
    }
  })

  ;(peertubeHelpers as any).express.addRouter('/plugins/nano-payments/api', router)
}

async function unregister() {
  // Cleanup if needed
}

// Helper functions for Nano integration
async function generateNanoAddress(paymentId: string, settingsManager: any): Promise<string> {
  // This would integrate with a Nano wallet to generate a unique address
  // For now, return a placeholder
  return `nano_1${paymentId.substring(0, 50).padEnd(50, '0')}`
}

async function checkNanoPayment(address: string, expectedAmount: string, settingsManager: any): Promise<boolean> {
  try {
    const nodeUrl = await settingsManager.getSetting('nano-node-url')
    
    // Make RPC call to check account balance/history
    const response = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'account_balance',
        account: address
      })
    })

    const data = await response.json() as any
    
    // Convert raw balance to Nano and check if it meets the expected amount
    const balanceNano = parseInt(data.balance) / Math.pow(10, 30)
    return balanceNano >= parseFloat(expectedAmount)
  } catch (error) {
    console.error('Error checking Nano payment:', error)
    return false
  }
}

module.exports = {
  register,
  unregister
}