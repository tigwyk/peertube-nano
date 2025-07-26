function register({ registerHook, peertubeHelpers }: any) {
  
  // Add premium video controls to video edit form
  registerHook({
    target: 'action:video-edit.init',
    handler: (params: any) => {
      addPremiumControls()
    }
  })

  // Hook to save premium data when video is updated
  registerHook({
    target: 'action:video-edit.video.updated',
    handler: (params: any) => {
      const { video } = params
      savePremiumData(video)
    }
  })

  function addPremiumControls() {
    // Find the video edit form
    const form = document.querySelector('form[name="video-edit"]') || 
                 document.querySelector('.video-edit-form') ||
                 document.querySelector('my-video-edit-form')
    
    if (!form) {
      // Retry after a short delay if form not found
      setTimeout(addPremiumControls, 500)
      return
    }

    // Create premium controls section
    const premiumSection = document.createElement('div')
    premiumSection.className = 'premium-controls-section'
    premiumSection.innerHTML = `
      <div class="form-group">
        <label class="form-control-label">
          <input type="checkbox" id="is-premium-video" name="isPremium">
          Make this a premium video
        </label>
        <small class="form-text text-muted">
          Users will need to pay with Nano (XNO) to watch this video
        </small>
      </div>
      
      <div class="form-group" id="premium-price-group" style="display: none;">
        <label for="premium-price" class="form-control-label">Price (XNO)</label>
        <input type="number" 
               id="premium-price" 
               name="premiumPrice" 
               class="form-control" 
               step="0.001" 
               min="0.001" 
               value="0.1"
               placeholder="0.1">
        <small class="form-text text-muted">
          Price in Nano (XNO) cryptocurrency
        </small>
      </div>
    `

    // Insert the premium section before the submit buttons
    const submitSection = form.querySelector('.submit-container') || 
                         form.querySelector('.form-actions') ||
                         form.querySelector('button[type="submit"]')?.parentElement

    if (submitSection) {
      form.insertBefore(premiumSection, submitSection)
    } else {
      form.appendChild(premiumSection)
    }

    // Add event listeners
    const premiumCheckbox = document.getElementById('is-premium-video') as HTMLInputElement
    const priceGroup = document.getElementById('premium-price-group')

    premiumCheckbox?.addEventListener('change', (e) => {
      const isChecked = (e.target as HTMLInputElement).checked
      if (priceGroup) {
        priceGroup.style.display = isChecked ? 'block' : 'none'
      }
    })

    // Load existing premium data if editing existing video
    loadExistingPremiumData()
  }

  async function loadExistingPremiumData() {
    try {
      // Extract video ID from URL or other means
      const videoId = extractVideoIdFromPage()
      if (!videoId) return

      const response = await fetch(`/api/v1/videos/${videoId}`)
      const video = await response.json() as any

      if (video.isPremium) {
        const premiumCheckbox = document.getElementById('is-premium-video') as HTMLInputElement
        const priceInput = document.getElementById('premium-price') as HTMLInputElement
        const priceGroup = document.getElementById('premium-price-group')

        if (premiumCheckbox) {
          premiumCheckbox.checked = true
          if (priceGroup) priceGroup.style.display = 'block'
        }

        if (priceInput && video.premiumPrice) {
          priceInput.value = video.premiumPrice
        }
      }
    } catch (error) {
      console.error('Error loading premium data:', error)
    }
  }

  function extractVideoIdFromPage(): string | null {
    // Try to extract video ID from URL
    const urlPath = window.location.pathname
    const match = urlPath.match(/\/videos\/edit\/(\d+)/) || urlPath.match(/\/videos\/(\d+)\/edit/)
    return match ? match[1] : null
  }

  async function savePremiumData(video: any) {
    const premiumCheckbox = document.getElementById('is-premium-video') as HTMLInputElement
    const priceInput = document.getElementById('premium-price') as HTMLInputElement

    if (premiumCheckbox?.checked) {
      const price = priceInput?.value || '0.1'
      
      // Add premium data to video object
      video.pluginData = video.pluginData || {}
      video.pluginData.isPremium = true
      video.pluginData.price = price

      // Save to plugin storage via API
      try {
        await fetch('/plugins/nano-payments/api/set-premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            videoId: video.id,
            isPremium: true,
            price: price
          })
        })
      } catch (error) {
        console.error('Error saving premium data:', error)
      }
    }
  }

  console.log('Nano Payments Plugin: Video edit client script loaded')
}

export { register }