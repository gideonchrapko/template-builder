# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **Initialize database:**
   ```bash
   bun run db:push
   ```

4. **Install Playwright:**
   ```bash
   bunx playwright install chromium
   ```

5. **Run development server:**
   ```bash
   bun run dev
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

## Important Notes

- The template renderer (`lib/template-renderer.ts`) uses simple string replacement. You may need to enhance it to properly handle all template variables based on your actual HTML structure.
- File uploads are stored in `/storage/uploads/`
- Generated outputs are stored in `/storage/outputs/`
- The app only allows @botpress.com email addresses

## Next Steps

1. Test the form submission flow
2. Verify template rendering works correctly
3. Adjust template renderer to match your exact template structure
4. Test with different people counts (1, 2, 3)
5. Verify all output formats work (PNG, JPG, WebP, PDF)

