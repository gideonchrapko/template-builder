# Final Environment Variable Fix

## Issue Found:

Your `NEXTAUTH_URL` has a trailing slash which can cause configuration errors.

## Fix in Vercel:

1. Go to Vercel → Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. Change from: `https://template-builder-gilt.vercel.app/`
4. Change to: `https://template-builder-gilt.vercel.app` (remove trailing slash)
5. Save
6. **Redeploy**

## Your Current Variables (after fix):

✅ `NEXTAUTH_URL` - Should be: `https://template-builder-gilt.vercel.app` (no trailing slash)
✅ `GOOGLE_CLIENT_ID` - Correct: `121233777156-63e4kl1rolut195guh21jmrvjom4asl1.apps.googleusercontent.com`
✅ `GOOGLE_CLIENT_SECRET` - Should be correct
✅ `NEXTAUTH_SECRET` - Should be correct
✅ `DATABASE_URL` - Should be correct

## Also Add (if not already there):

- `AUTH_SECRET` - Set to same value as `NEXTAUTH_SECRET` (NextAuth v5 prefers this)

