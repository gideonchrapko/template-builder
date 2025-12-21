# Fix These Environment Variables in Vercel

## 1. NEXTAUTH_URL
**Current (WRONG):**
```
[https://template-builder-gilt.vercel.app](https://template-builder-gilt.vercel.app/)
```

**Should be:**
```
https://template-builder-gilt.vercel.app
```

## 2. GOOGLE_CLIENT_ID
**Current (WRONG):**
```
http://121233777156-63e4kl1rolut195guh21jmrvjom4asl1.apps.googleusercontent.com/
```

**Should be:**
```
121233777156-63e4kl1rolut195guh21jmrvjom4asl1.apps.googleusercontent.com
```

## Steps to Fix:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Click on `NEXTAUTH_URL`
3. Change the value to: `https://template-builder-gilt.vercel.app` (no brackets, no markdown)
4. Save
5. Click on `GOOGLE_CLIENT_ID`
6. Change the value to: `121233777156-63e4kl1rolut195guh21jmrvjom4asl1.apps.googleusercontent.com` (no http://, no trailing slash)
7. Save
8. **Redeploy** your project

## All Other Variables Look Good:
✅ DATABASE_URL - Correct
✅ POSTGRES_URL - Correct  
✅ PRISMA_DATABASE_URL - Correct
✅ GOOGLE_CLIENT_SECRET - Correct
✅ NEXTAUTH_SECRET - Correct

