# Deployment Guide for Vercel

## Environment Variables Setup

Before deploying to Vercel, you need to configure the following environment variables in your Vercel project settings:

### Required Environment Variables

1. **NEXTAUTH_URL**
   - Description: The canonical URL of your site
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.vercel.app` (or your custom domain)

2. **NEXTAUTH_SECRET**
   - Description: Secret key for encrypting tokens and signing cookies
   - Generate using: `openssl rand -base64 32`
   - Example: `Ok6+dtUgTAujKunvJPfqSXJbKGtun0hdW4WNpuPW3D4=`

3. **NEXT_PUBLIC_API_BASE_URL**
   - Description: Your backend API URL
   - Local: `http://localhost:8000`
   - Production: `https://your-api-domain.com`

4. **NEXT_PUBLIC_API_KEY** (Optional)
   - Description: API key for client-side API calls
   - Example: Your API key from the backend

## Steps to Deploy on Vercel

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Configure NextAuth and fix Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

### 3. Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development**:

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_API_KEY=your-api-key-here
```

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at your Vercel URL

## Important Notes

### NextAuth Configuration

- The `NEXTAUTH_SECRET` is required for production
- The `NEXTAUTH_URL` should match your production domain
- The `trustHost: true` setting in `src/auth.ts` is necessary for Vercel deployments

### API Configuration

- Make sure your backend API URL is accessible from Vercel
- If your backend requires CORS, add your Vercel domain to the allowed origins
- Consider using environment-specific URLs for different deployment stages

### Troubleshooting

1. **Build Fails**: Check the build logs in Vercel dashboard
2. **Auth Issues**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly
3. **API Connection**: Ensure `NEXT_PUBLIC_API_BASE_URL` points to your live backend

## Vercel CLI Deployment (Alternative)

You can also deploy using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Remember to set environment variables via CLI or dashboard before deploying.

## Custom Domain Setup

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update `NEXTAUTH_URL` to match your custom domain
4. Redeploy to apply changes
