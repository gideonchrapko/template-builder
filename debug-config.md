# Debugging NextAuth Configuration Error

## Steps to Find the Exact Error:

1. **Check Vercel Function Logs:**
   - Go to Vercel → Your Project → Deployments
   - Click on the latest deployment
   - Go to **Functions** tab
   - Look for errors in `/api/auth/[...nextauth]` function
   - Check the **Logs** tab for detailed error messages

2. **Common Causes of "Configuration" Error:**

   a) **Missing or Empty Environment Variables:**
      - `GOOGLE_CLIENT_ID` is empty or undefined
      - `GOOGLE_CLIENT_SECRET` is empty or undefined
      - `NEXTAUTH_SECRET` or `AUTH_SECRET` is missing
   
   b) **Database Connection Failing:**
      - Prisma can't connect to database
      - Adapter initialization fails
   
   c) **Google OAuth Callback URL Mismatch:**
      - Callback URL in Google Cloud Console doesn't match
      - Should be: `https://template-builder-gilt.vercel.app/api/auth/callback/google`

3. **Verify Google OAuth Setup:**
   - Go to Google Cloud Console
   - Check Authorized redirect URIs includes:
     `https://template-builder-gilt.vercel.app/api/auth/callback/google`
   - Verify Client ID and Secret match what's in Vercel

4. **Test Environment Variables:**
   - Make sure all variables are set for **Production** environment
   - No extra spaces or characters
   - Values are exactly as they should be

