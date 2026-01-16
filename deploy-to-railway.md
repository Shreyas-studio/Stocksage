# Railway Deployment Guide (Manual - No GitHub)

## Quick Reference Commands

Run these commands in PowerShell, one at a time, from your project folder:

```powershell
# 1. Install Railway CLI (one-time setup)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to your project folder
cd "S:\Shreyas\Personal\Web App\StockSage\StockSage"

# 4. Create new Railway project
railway init

# 5. Add PostgreSQL database
railway add postgresql

# 6. Set environment variables (replace with your actual values)
railway variables set SESSION_SECRET=your-long-random-secret-here
railway variables set OPENAI_API_KEY=your-openai-api-key-here

# 7. Set build and start commands
railway variables set RAILWAY_BUILD_COMMAND="npm run build"
railway variables set RAILWAY_START_COMMAND="npm start"

# 8. Deploy your app
railway up

# 9. Get your live URL
railway domain

# 10. View logs (if needed)
railway logs
```

## Troubleshooting

- **"railway: command not found"** → Make sure you installed Railway CLI (step 1) and restarted your terminal
- **Build fails** → Check `railway logs` and share the error message
- **App won't start** → Make sure all environment variables are set correctly

## Important Notes

- Railway automatically sets `PORT` - you don't need to set it manually
- The `DATABASE_URL` is set automatically when you add PostgreSQL
- After first deployment, you can update your app by running `railway up` again
