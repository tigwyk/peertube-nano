function register({ registerHook, peertubeHelpers }: any) {
  
  // Add admin panel enhancements for premium video management
  registerHook({
    target: 'action:admin-plugin-settings.init',
    handler: () => {
      addAdminPremiumStats()
    }
  })

  function addAdminPremiumStats() {
    // Add premium video statistics to admin panel
    const adminContent = document.querySelector('.admin-sub-header') || 
                        document.querySelector('.main-col')

    if (!adminContent) return

    const statsSection = document.createElement('div')
    statsSection.className = 'premium-stats-section'
    statsSection.innerHTML = `
      <div class="card mt-3">
        <div class="card-header">
          <h5>Premium Content Statistics</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <div class="stat-item">
                <h6>Premium Videos</h6>
                <span id="premium-video-count">Loading...</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-item">
                <h6>Total Payments</h6>
                <span id="total-payments">Loading...</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-item">
                <h6>Revenue (XNO)</h6>
                <span id="total-revenue">Loading...</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-item">
                <h6>Pending Payments</h6>
                <span id="pending-payments">Loading...</span>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <button id="refresh-stats" class="btn btn-primary btn-sm">Refresh Stats</button>
            <button id="export-payments" class="btn btn-secondary btn-sm ml-2">Export Payments</button>
          </div>
        </div>
      </div>
    `

    adminContent.appendChild(statsSection)

    // Load initial stats
    loadPremiumStats()

    // Add event listeners
    document.getElementById('refresh-stats')?.addEventListener('click', loadPremiumStats)
    document.getElementById('export-payments')?.addEventListener('click', exportPayments)
  }

  async function loadPremiumStats() {
    try {
      const response = await fetch('/plugins/nano-payments/api/admin/stats')
      const stats = await response.json() as any

      if (stats.success) {
        document.getElementById('premium-video-count')!.textContent = stats.data.premiumVideos || '0'
        document.getElementById('total-payments')!.textContent = stats.data.totalPayments || '0'
        document.getElementById('total-revenue')!.textContent = (stats.data.totalRevenue || '0') + ' XNO'
        document.getElementById('pending-payments')!.textContent = stats.data.pendingPayments || '0'
      }
    } catch (error) {
      console.error('Error loading premium stats:', error)
      document.getElementById('premium-video-count')!.textContent = 'Error'
      document.getElementById('total-payments')!.textContent = 'Error'
      document.getElementById('total-revenue')!.textContent = 'Error'
      document.getElementById('pending-payments')!.textContent = 'Error'
    }
  }

  async function exportPayments() {
    try {
      const response = await fetch('/plugins/nano-payments/api/admin/export-payments')
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nano-payments-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting payments:', error)
      alert('Error exporting payments')
    }
  }

  console.log('Nano Payments Plugin: Admin client script loaded')
}

export { register }