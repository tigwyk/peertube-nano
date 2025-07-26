function register({ registerHook, peertubeHelpers }: any) {
  
  // Add premium indicator to video cards
  registerHook({
    target: 'filter:internal.common.svg-icons.get-content.result',
    handler: (result: string) => {
      return result + `
        <symbol viewBox="0 0 24 24" id="premium-crown">
          <path d="M12 6L9 9L6 6L4 8L7 18H17L20 8L18 6L15 9L12 6Z" fill="gold"/>
        </symbol>
      `
    }
  })

  // Add premium styling
  const style = document.createElement('style')
  style.textContent = `
    .premium-video-indicator {
      position: absolute;
      top: 5px;
      right: 5px;
      background: linear-gradient(45deg, #FFD700, #FFA500);
      color: #333;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: bold;
      z-index: 10;
    }
    
    .premium-video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }
    
    .premium-payment-modal {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
    }
    
    .nano-address {
      font-family: monospace;
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      word-break: break-all;
      margin: 10px 0;
    }
    
    .payment-status {
      text-align: center;
      margin: 15px 0;
    }
    
    .payment-status.pending {
      color: orange;
    }
    
    .payment-status.completed {
      color: green;
    }
  `
  document.head.appendChild(style)

  console.log('Nano Payments Plugin: Common client script loaded')
}

export { register }