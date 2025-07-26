# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PeerTube plugin that enables content creators to monetize their videos using Nano (XNO) cryptocurrency. The plugin integrates payment processing with PeerTube's video system to create premium content that requires payment to access.

## Development Commands

### Build Commands
- `npm run build` - Compile TypeScript files to dist/ directory
- `npm run dev` - Watch mode compilation with auto-rebuild on changes

### Dependencies
- `npm install` - Install all dependencies (TypeScript, Node types, axios, node-fetch)

## Architecture Overview

### Core Components

**Server-side (`src/main.ts`)**
- Main plugin registration and PeerTube hooks
- Payment processing logic and Nano network integration
- RESTful API endpoints for payment management
- Video premium status management
- Admin statistics and payment export functionality

**Client-side Scripts**
- `common-client-plugin.ts` - Shared UI components and styling for premium indicators
- `video-watch-client-plugin.ts` - Payment overlay and video access control on watch pages  
- `video-edit-client-plugin.ts` - Premium video controls in video edit forms
- `admin-plugin-client-plugin.ts` - Admin dashboard enhancements

### Plugin Architecture

The plugin follows PeerTube's plugin system architecture:

1. **Hook System**: Uses PeerTube hooks to integrate with video lifecycle events
2. **Settings Management**: Configurable settings for Nano node URL, wallet seed, and payment timeout
3. **Storage System**: Uses PeerTube's plugin storage for payment data and video premium status
4. **Client Scripts**: Different scripts load based on PeerTube page context (watch, edit, admin)

### Payment Flow

1. Content creator marks video as premium via edit form
2. Viewer encounters premium video and sees payment overlay
3. Payment address generated using Nano wallet integration
4. Payment status monitored via polling mechanism
5. Access granted upon payment confirmation

### Key Files

- `src/main.ts:line` - Core server logic with payment API endpoints
- `src/client/video-watch-client-plugin.ts:30` - Premium payment overlay implementation
- `src/client/video-edit-client-plugin.ts:22` - Premium video form controls
- `languages/en.json` - All translatable strings for internationalization

### API Endpoints

Plugin exposes REST API at `/plugins/nano-payments/api/`:
- `POST /generate-payment` - Create payment address for video access
- `GET /check-payment/:paymentId` - Poll payment status
- `POST /set-premium` - Mark video as premium content
- `GET /admin/stats` - Payment statistics (admin only)
- `GET /admin/export-payments` - CSV export of payments (admin only)

### Nano Integration

Uses Nano cryptocurrency for payments:
- Generates unique payment addresses per transaction
- Monitors payment confirmation via Nano node RPC
- Handles balance verification and access granting

## Development Notes

- TypeScript compilation outputs to `dist/` directory
- Client scripts are loaded contextually by PeerTube based on page scope
- Plugin settings are managed through PeerTube's admin interface
- Payment data is stored using PeerTube's plugin storage system
- CSS styling is injected via client scripts for premium indicators and payment UI