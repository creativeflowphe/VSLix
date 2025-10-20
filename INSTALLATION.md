# Installation Guide

Complete step-by-step guide to set up and run the Booking SaaS Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Project Setup](#project-setup)
4. [Database Configuration](#database-configuration)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [Testing the Application](#testing-the-application)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional but recommended)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### Required Accounts

1. **Supabase Account** (Free tier available)
   - Sign up at: https://supabase.com/
   - You'll need this for database and authentication

---

## Supabase Setup

### Step 1: Create a New Supabase Project

1. Log in to https://app.supabase.com/
2. Click "New Project"
3. Fill in the details:
   - **Name**: Choose a name (e.g., "booking-saas")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, click on the "Settings" icon (gear) in the sidebar
2. Go to "API" section
3. You'll need these values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

4. Keep these credentials handy for the next steps

---

## Project Setup

### Step 1: Download/Clone the Project

If using Git:
```bash
git clone <repository-url>
cd project
```

Or download and extract the ZIP file, then navigate to the project folder.

### Step 2: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages. It may take 2-3 minutes.

### Step 3: Configure Environment Variables

1. In the project root, you'll find a `.env` file
2. Open it with a text editor
3. Replace the placeholder values with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Example:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjk4MjQwMCwiZXhwIjoxOTI4NTU4NDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Save the file

---

## Database Configuration

### Step 1: Run Database Migrations

The project includes pre-configured database migrations. You need to run them in your Supabase project.

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query"

### Step 2: Apply Migrations

You need to run the migration files in order. Here's what to do:

#### Migration 1: Initial Schema

1. Open the file: `supabase/migrations/20251020025018_create_initial_booking_schema.sql`
2. Copy the entire contents
3. Paste it into the SQL Editor in Supabase
4. Click "Run"
5. Wait for success confirmation

#### Migration 2: Test Data

1. Open the file: `supabase/migrations/20251020025136_add_comprehensive_test_data_v2.sql`
2. Copy the entire contents
3. Paste it into a new query in the SQL Editor
4. Click "Run"
5. Wait for success confirmation

### Step 3: Verify Database Setup

1. In Supabase, go to "Table Editor" in the sidebar
2. You should see tables like:
   - profiles
   - salons
   - services
   - bookings
   - reviews
   - And more...

3. Click on any table to verify data was inserted

---

## Edge Functions Deployment

Edge Functions are already deployed if you're using the provided Supabase project. If you need to deploy them manually:

### Prerequisites

The functions are located in `supabase/functions/` and include:
- `send-notification`
- `auto-review-request`

These functions are automatically configured in the Supabase environment.

---

## Testing the Application

### Step 1: Start Development Server

In your terminal, run:

```bash
npm run dev
```

You should see output like:
```
VITE v5.4.2  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Open the Application

1. Open your browser
2. Navigate to http://localhost:5173/
3. You should see the login page

### Step 3: Test with Sample Users

The test data migration created sample users. Try logging in with:

**Master Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Business Owner:**
- Email: `owner1@example.com`
- Password: `owner123`

**Client:**
- Email: `client1@example.com`
- Password: `client123`

### Step 4: Explore the Features

1. Log in with different user roles
2. Test booking creation
3. Try the marketplace
4. Check analytics dashboards
5. Toggle dark/light mode

---

## Production Deployment

### Build for Production

1. Create a production build:
```bash
npm run build
```

2. This creates a `dist/` folder with optimized files

### Deploy to Vercel

1. Install Vercel CLI (optional):
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts

Or use the Vercel website:
1. Go to https://vercel.com/
2. Click "New Project"
3. Import your Git repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Deploy to Netlify

1. Install Netlify CLI (optional):
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

Or use the Netlify website:
1. Go to https://app.netlify.com/
2. Click "Add new site"
3. Import your Git repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables
7. Click "Deploy"

### Deploy to AWS Amplify

1. Go to https://aws.amazon.com/amplify/
2. Click "Get Started" under Amplify Hosting
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add environment variables
6. Click "Save and Deploy"

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. Supabase connection errors

**Solution:**
- Verify your `.env` file has correct credentials
- Check that your Supabase project is running
- Ensure no trailing spaces in environment variables

#### 3. Login not working

**Solution:**
- Verify database migrations ran successfully
- Check Supabase Authentication is enabled:
  - Go to Authentication > Settings in Supabase
  - Ensure "Enable Email Provider" is ON

#### 4. Charts not displaying

**Solution:**
```bash
npm install chart.js react-chartjs-2
```

#### 5. Dark mode not working

**Solution:**
- Clear browser cache
- Check browser console for errors

#### 6. Port already in use

**Solution:**
Change the port in `package.json`:
```json
"dev": "vite --port 3000"
```

### Getting Help

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check the terminal for error messages
3. Verify all migration files ran successfully
4. Ensure environment variables are set correctly
5. Try clearing browser cache and local storage

### Database Issues

To reset the database:

1. Go to Supabase Dashboard
2. Settings > Database
3. Click "Reset Database Password" (this doesn't reset data)
4. Or manually delete tables and re-run migrations

---

## Next Steps

After successful installation:

1. **Customize Branding**
   - Update colors in `tailwind.config.js`
   - Modify theme in `src/components/ThemeCustomizer.tsx`

2. **Add Your Business**
   - Create a business owner account
   - Add your salon/spa details
   - Upload services and pricing

3. **Configure Notifications**
   - Set up notification templates
   - Configure email settings in Supabase

4. **Set Up Payments** (Optional)
   - Get Stripe API keys from https://stripe.com/
   - Add to environment variables
   - Configure payment flows

5. **Custom Domain** (Production)
   - Configure custom domain in your hosting provider
   - Update CORS settings in Supabase if needed

---

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Remove test data from production database
- [ ] Enable email verification in Supabase Auth
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Review RLS policies
- [ ] Set up database backups
- [ ] Enable SSL/HTTPS
- [ ] Configure proper environment variables
- [ ] Set up monitoring and logging

---

## Maintenance

### Regular Tasks

- Monitor Supabase usage dashboard
- Review error logs
- Back up database regularly
- Update dependencies monthly
- Review and respond to user feedback

### Updating Dependencies

```bash
npm outdated
npm update
npm audit fix
```

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Conclusion

You should now have a fully functional booking SaaS platform running locally. Test all features thoroughly before deploying to production.

For questions or issues not covered in this guide, please contact the development team.

Good luck with your booking platform!
