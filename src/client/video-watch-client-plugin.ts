function register({ registerHook, peertubeHelpers }: any) {
  
  // Hook to modify video watch page for premium content
  registerHook({
    target: 'action:video-watch.video.loaded',
    handler: (params: any) => {
      const { video } = params
      
      if (video.isPremium && !video.hasAccess) {
        showPremiumPaymentOverlay(video, peertubeHelpers)
      }
    }
  })

  // Hook to prevent video play for unpaid premium content
  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: (params: any) => {
      const { video, player } = params
      
      if (video.isPremium && !video.hasAccess) {
        player.pause()
        player.el().style.pointerEvents = 'none'
      }
    }
  })

  function showPremiumPaymentOverlay(video: any, peertubeHelpers: any) {
    const videoContainer = document.querySelector('.video-js')
    if (!videoContainer) return

    const overlay = document.createElement('div')
    overlay.className = 'premium-video-overlay'
    overlay.innerHTML = `
      <div class="premium-payment-modal">
        <h3>Premium Content</h3>
        <p>This video requires payment to watch.</p>
        <p><strong>Price: ${video.premiumPrice} XNO</strong></p>
        <button id="pay-with-nano" class="btn btn-primary">Pay with Nano</button>
        <button id="close-premium-modal" class="btn btn-secondary">Cancel</button>
        <div id="payment-details" style="display: none;">
          <h4>Send payment to:</h4>
          <div class="nano-address" id="payment-address"></div>
          <p>Amount: <strong id="payment-amount"></strong></p>
          <div class="payment-status pending" id="payment-status">
            Waiting for payment confirmation...
          </div>
          <button id="check-payment" class="btn btn-info">Check Payment Status</button>
        </div>
      </div>
    `

    videoContainer.appendChild(overlay)

    // Event listeners
    document.getElementById('pay-with-nano')?.addEventListener('click', async () => {
      await initiatePayment(video, peertubeHelpers)
    })

    document.getElementById('close-premium-modal')?.addEventListener('click', () => {
      overlay.remove()
    })

    document.getElementById('check-payment')?.addEventListener('click', () => {
      checkPaymentStatus()
    })
  }

  async function initiatePayment(video: any, peertubeHelpers: any) {
    try {
      const response = await fetch('/plugins/nano-payments/api/generate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId: video.id,
          userId: peertubeHelpers.getUser()?.id || 'anonymous'
        })
      })

      const data = await response.json() as any
      
      if (data.success) {
        // Show payment details
        document.getElementById('payment-details')!.style.display = 'block'
        document.getElementById('payment-address')!.textContent = data.address
        document.getElementById('payment-amount')!.textContent = `${data.amount} XNO`
        
        // Store payment ID for status checking
        ;(window as any).currentPaymentId = data.paymentId
        
        // Start polling for payment confirmation
        startPaymentStatusPolling()
      } else {
        alert('Failed to generate payment address: ' + (data as any).error)
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      alert('Error initiating payment')
    }
  }

  function startPaymentStatusPolling() {
    const pollInterval = setInterval(async () => {
      const isPaid = await checkPaymentStatus()
      if (isPaid) {
        clearInterval(pollInterval)
        // Reload page to refresh video access
        window.location.reload()
      }
    }, 5000) // Check every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 600000)
  }

  async function checkPaymentStatus(): Promise<boolean> {
    try {
      const paymentId = (window as any).currentPaymentId
      if (!paymentId) return false

      const response = await fetch(`/plugins/nano-payments/api/check-payment/${paymentId}`)
      const data = await response.json() as any

      const statusElement = document.getElementById('payment-status')
      if (statusElement) {
        if (data.paid) {
          statusElement.textContent = 'Payment confirmed!'
          statusElement.className = 'payment-status completed'
          return true
        } else {
          statusElement.textContent = 'Waiting for payment confirmation...'
          statusElement.className = 'payment-status pending'
        }
      }

      return data.paid
    } catch (error) {
      console.error('Error checking payment status:', error)
      return false
    }
  }

  console.log('Nano Payments Plugin: Video watch client script loaded')
}

export { register }