# Production Deployment to Vercel

## Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account with linked GitHub/GitLab/Bitbucket
- Environment variables configured in Vercel dashboard

## Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from CLI
```bash
vercel --prod
```

### 4. Or Deploy via Git Integration
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

## Environment Variables Setup

Add these to Vercel dashboard under Settings > Environment Variables:

### Required Variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `DATABASE_URL`
- `SESSION_SECRET`

### Optional Variables:
- `VITE_FIREBASE_MEASUREMENT_ID`
- `NODE_ENV=production`

## Build Configuration

The project is configured for:
- **Frontend**: Static React build in `client/dist`
- **Backend**: Serverless functions for API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version (requires 18+)
2. **Environment variables**: Ensure all required vars are set
3. **Database connection**: Verify DATABASE_URL format
4. **Firebase config**: Check all Firebase variables are correct

### Debug Commands:
```bash
vercel --prod --debug
vercel logs
```

## Post-Deployment

1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Test all API endpoints
5. Verify database connections
