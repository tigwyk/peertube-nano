# PeerTube Nano Payments Plugin

A PeerTube plugin that enables content creators to monetize their videos using Nano (XNO) cryptocurrency. Viewers can pay with Nano to access premium content.

## Features

- **Premium Videos**: Content creators can mark videos as premium and set a price in XNO
- **Nano Payments**: Secure, fast, and feeless payments using Nano cryptocurrency
- **Access Control**: Automatic video access control based on payment status
- **Admin Dashboard**: Statistics and payment management for administrators
- **Real-time Verification**: Automatic payment verification and access granting

## Installation

1. **Install the plugin** on your PeerTube instance:
   ```bash
   npm install peertube-plugin-nano-payments
   ```

2. **Configure the plugin** in your PeerTube admin panel:
   - Go to Administration → Plugins → peertube-plugin-nano-payments
   - Set your Nano node RPC URL (default: https://proxy.nanos.cc/proxy)
   - Configure your wallet seed for payment address generation
   - Set payment timeout (default: 10 minutes)

## Usage

### For Content Creators

1. **Upload or edit a video**
2. **Check "Make this a premium video"** in the video edit form
3. **Set the price** in XNO (default: 0.1 XNO)
4. **Save the video** - it will now require payment to watch

### For Viewers

1. **Visit a premium video** - you'll see a payment overlay
2. **Click "Pay with Nano"** to generate a payment address
3. **Send the exact amount** of XNO to the provided address
4. **Wait for confirmation** - access will be granted automatically

### For Administrators

1. **View statistics** in the plugin admin panel:
   - Number of premium videos
   - Total payments received
   - Revenue in XNO
   - Pending payments

2. **Export payment data** as CSV for accounting purposes

## Configuration

The plugin requires the following settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Nano Node RPC URL | Endpoint for Nano network communication | https://proxy.nanos.cc/proxy |
| Nano Wallet Seed | Private seed for generating payment addresses | (required) |
| Payment Timeout | How long to wait for payment confirmation | 10 minutes |

## API Endpoints

The plugin exposes several API endpoints:

- `POST /plugins/nano-payments/api/generate-payment` - Generate payment address
- `GET /plugins/nano-payments/api/check-payment/:paymentId` - Check payment status
- `POST /plugins/nano-payments/api/set-premium` - Mark video as premium
- `GET /plugins/nano-payments/api/admin/stats` - Get payment statistics (admin only)
- `GET /plugins/nano-payments/api/admin/export-payments` - Export payments CSV (admin only)

## Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build

# Development mode (watch for changes)
npm run dev
```

### File Structure

```
src/
├── main.ts                           # Main server-side plugin logic
├── client/
│   ├── common-client-plugin.ts       # Common client-side functionality
│   ├── video-watch-client-plugin.ts  # Video watching page logic
│   ├── video-edit-client-plugin.ts   # Video editing page logic
│   └── admin-plugin-client-plugin.ts # Admin panel enhancements
assets/
├── style.css                         # Plugin styles
languages/
├── en.json                          # English translations
```

## Security Considerations

- **Private Keys**: Store wallet seeds securely and never expose them
- **Payment Verification**: The plugin verifies payments through the Nano network
- **Access Control**: Video access is controlled server-side for security
- **Data Storage**: Payment data is stored in PeerTube's plugin storage system

## Nano Integration

This plugin integrates with the Nano cryptocurrency network to provide:

- **Fast Transactions**: Near-instant payment confirmation
- **Feeless**: No transaction fees for users
- **Environmentally Friendly**: Energy-efficient consensus mechanism
- **Decentralized**: No reliance on traditional payment processors

## Troubleshooting

### Common Issues

1. **Payment not detected**: Check Nano node connectivity and wallet configuration
2. **Video access denied**: Ensure payment was sent to the correct address with exact amount
3. **Plugin not loading**: Verify all files are built and TypeScript compilation succeeded

### Debug Mode

Enable debug logging in your PeerTube configuration to see detailed plugin logs.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Join the PeerTube community discussions
- Contact the plugin developer

---

**Note**: This plugin requires PeerTube 5.0.0 or higher and a properly configured Nano node for payment verification.