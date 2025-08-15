# Firebase Setup for Vercel Deployment

## Problem Identified
The 500 Internal Server Error on `/api/settings/test-connection` is caused by **missing Firebase environment variables** in your Vercel deployment.

## Root Cause
Your local `.env` file is not being used by Vercel. Environment variables must be configured in the Vercel Dashboard.

## Solution Steps

### 1. Add Environment Variables to Vercel

Go to [Vercel Dashboard](https://vercel.com/dashboard) and follow these steps:

1. Select your project `client-vault-taupe`
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value |
|---------------|--------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDnD79096i5eYtYd0sgupdwZIOVZsWC4Lw` |
| `VITE_FIREBASE_PROJECT_ID` | `recharging-mobiles-online` |
| `VITE_FIREBASE_APP_ID` | `1:258902263753:web:e1e0b6c7adabbec4714a18` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `258902263753` |

### 2. Redeploy Your Application

After adding the environment variables:
1. Go to your project in Vercel Dashboard
2. Click **Redeploy** on the latest deployment
3. Wait for the deployment to complete

### 3. Test the Connection

Once redeployed:
1. Visit your deployed app
2. Go to Settings page
3. Click "Test Firebase Connection"
4. The connection should now succeed

### 4. Verification Commands

You can verify the setup by running:
```bash
# Check if environment variables are set
node check-firebase-setup.js

# Test the endpoint directly
curl -X POST https://client-vault-taupe.vercel.app/api/settings/test-connection
```

## Expected Result
After completing these steps, the `/api/settings/test-connection` endpoint should return:
```json
{
  "success": true,
  "message": "Firebase connection successful",
  "details": {
    "documentExists": false,
    "projectId": "recharging-mobiles-online"
  }
}
```

## Troubleshooting
If you still see errors:
1. Double-check all variable names match exactly
2. Ensure no extra spaces in the values
3. Verify the Firebase project has Firestore enabled
4. Check Vercel deployment logs for any additional errors
