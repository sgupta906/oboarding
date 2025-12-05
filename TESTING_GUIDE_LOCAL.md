# Local Testing Guide (No Emulator Required)

This guide walks you through testing the OnboardingHub application using **localStorage fallback** - no Firebase Emulator needed!

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 🔐 Authentication & Login

### Pre-seeded Test Accounts

The app comes with 3 pre-seeded users in localStorage:

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `admin@company.com` | Any text | Admin | Full system access |
| `manager@company.com` | Any text | Manager | Can create users, manage templates, view dashboard |
| `employee@company.com` | Any text | Employee | Can complete onboarding steps |

### How to Sign In

1. Visit `http://localhost:5173`
2. You'll see the **Sign In** page
3. Click "Sign In" button (in localStorage mode, any password works)
4. You'll be logged in immediately and redirected

**Note:** In localStorage mode, the password field doesn't matter - just click Sign In to proceed.

---

## 👤 Creating & Managing Users

### What's the difference between "New User" and "New Hire"?

- **New User** = A manager/admin account (created in Users tab)
- **New Hire** = An employee onboarding instance (created in Dashboard with "New Onboarding" button)

### Test: Create a New User (Manager Account)

1. Sign in as **manager@company.com**
2. Go to **Manager View** → **Users** tab
3. Click **"Create User"** button
4. Fill in the form:
   - **Email:** newmanager@company.com
   - **Name:** John Manager
   - **Roles:** Check "manager"
   - **Profiles:** Check "Engineering"
5. Click **"Save User"**
6. You should see:
   - Success toast message
   - New user appears in the Users table
7. Click **"Edit"** on the new user
8. Change name to "John Manager Updated"
9. Click **"Save User"**
10. Change updates successfully
11. Click **"Delete"** button and confirm
12. User disappears from table

**What to check:**
- ✅ Form validates required fields (email, name, at least one role)
- ✅ Email format validation (must be valid email format)
- ✅ Role selection is required
- ✅ User appears immediately in table after creation
- ✅ Edit modal pre-fills with current values
- ✅ Changes save successfully
- ✅ Delete removes user from table

---

## 📋 Creating & Managing Onboarding Instances (New Hires)

### Test: Create a New Onboarding Instance

1. Sign in as **manager@company.com**
2. Go to **Manager View** → **Dashboard** tab
3. Scroll down and click **"New Onboarding"** button
4. Fill in the form:
   - **Employee Name:** Jane Smith
   - **Email:** jane.smith@company.com
   - **Role:** Select "Engineering"
   - **Start Date:** Pick today's date
   - **Template:** Select a template from dropdown
5. Click **"Create"**
6. You should see:
   - Success message
   - New hire appears in KPI counts
   - Activity logged in Activity Feed

### Test: Employee Completes Onboarding Steps

1. Sign in as **employee@company.com**
2. You should see the **Employee View** with onboarding steps
3. Click **"Mark as Complete"** on the first step
4. Step should:
   - Move to completed section
   - Show green checkmark
   - Update progress bar
5. Try **"Report I'm Stuck"** on another step:
   - Click the stuck button
   - Choose a reason
   - Submit
   - Step changes to yellow "stuck" status
6. Try **"Suggest Edit"** on another step:
   - Click suggest button
   - Enter suggestion text
   - Submit
   - Suggestion appears in manager's dashboard

**What to check:**
- ✅ Steps display correctly
- ✅ Status changes update immediately
- ✅ Progress bar updates
- ✅ Stuck status is logged in activity feed
- ✅ Suggestions appear for manager review

---

## 👥 Profile Filtering

### Test: Employee Profile Filter

1. Sign in as **employee@company.com**
2. Look at the **welcome header** (top of page)
3. In the **top-right**, find the profile dropdown (says "All Roles")
4. Click it and select **"Engineer"** profile
5. Steps below should filter to show only Engineering-related tasks
6. Click dropdown again and select **"Intern"**
7. Steps change to show Intern tasks
8. Click dropdown and select **"All Roles"**
9. All steps reappear

**What to check:**
- ✅ Dropdown shows all available profiles
- ✅ Steps filter when you change profiles
- ✅ Step count updates based on selected profile

### Test: Manager KPI Profile Filter

1. Sign in as **manager@company.com**
2. Go to **Dashboard** tab
3. Above the KPI cards (showing "Active Onboardings", "Stuck Employees", etc.)
4. Find the **profile filter dropdown** (says "All Profiles")
5. Click it and select **"Engineer"**
6. KPI numbers change to show only Engineer stats
7. Click dropdown and select **"Sales"**
8. Numbers change to show Sales stats
9. Click dropdown and select **"All Profiles"**
10. Numbers return to total stats

**What to check:**
- ✅ KPI cards show correct counts for selected profile
- ✅ Numbers update instantly when you change profile
- ✅ "All Profiles" shows total counts

---

## 🎯 Manager Dashboard Features

### Test: KPI Cards

1. Sign in as **manager@company.com**
2. Go to **Dashboard** tab
3. You should see 3 KPI cards:
   - **Active Onboardings** - Count of in-progress onboarding instances
   - **Stuck Employees** - Count of employees reporting stuck status
   - **Doc Feedback** - Count of pending suggestions
4. Create a new onboarding (see "Creating New Hires" section)
5. Watch **Active Onboardings** count increase

### Test: Activity Feed

1. Sign in as **manager@company.com**
2. Go to **Dashboard** tab
3. Scroll down to **Activity Feed**
4. You should see recent actions like:
   - User created
   - User edited
   - Onboarding created
   - Step completed
   - Issue reported
5. When you create a user or onboarding, activity appears instantly

### Test: Role Management

1. Sign in as **manager@company.com** or **admin@company.com**
2. Go to **Manager View** → **Roles** tab
3. You should see default roles:
   - Engineering
   - Sales
   - Product
   - HR
   - Operations
   - Design
   - Marketing
4. Click **"Create Role"** to add a custom role
5. Fill in:
   - **Role Name:** Custom Role Name
   - **Description:** (optional)
6. Click **"Save"**
7. New role appears in the list
8. Click the **"Edit"** icon on a role
9. Change its description
10. Click the **"Delete"** icon to remove (if not in use)

**What to check:**
- ✅ Default roles display correctly
- ✅ Can create new roles
- ✅ Can edit role descriptions
- ✅ Can delete unused roles

---

## 🧪 Running Automated Tests

```bash
npm run test
```

Expected output:
```
✅ Test Files: 30 passed
✅ Tests: 615 passed
✅ Duration: ~7 seconds
```

All tests should **PASS**.

---

## 🏗️ Build Verification

```bash
npm run build
```

Expected output:
```
✓ built in 1.9s
dist/index.html    0.46 kB
dist/assets/...    ~774 kB
```

Should complete with **NO ERRORS**.

---

## 🐛 Troubleshooting

### Issue: Can't sign in
**Solution:**
- Make sure `.env.local` has `VITE_USE_FIREBASE_EMULATOR=false`
- Try clearing browser localStorage: Open DevTools → Application → Local Storage → Clear All
- Refresh the page

### Issue: Users tab not showing
**Solution:**
- Make sure you're signed in as a manager (manager@company.com)
- Employees won't see the Users tab
- Clear cache and refresh

### Issue: Profiles dropdown not appearing
**Solution:**
- Profiles auto-seed on first load
- If missing, refresh the page
- Check browser console for errors (F12 → Console)

### Issue: Can't create a user - getting error
**Solution:**
- Check all required fields are filled:
  - Email (valid format)
  - Name (2+ characters)
  - At least one role selected
- Try a different email (not already used)
- Check browser console (F12 → Console) for specific error

### Issue: Tests failing
**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run test
```

---

## 📝 Summary of Features to Test

| Feature | Sign In As | Where | Expected Result |
|---------|------------|-------|-----------------|
| View onboarding steps | employee@company.com | Employee View | Steps display with status |
| Mark step complete | employee@company.com | Employee View | Step turns green, progress updates |
| Report stuck | employee@company.com | Employee View | Step turns yellow, logged in activity |
| Filter by profile | employee@company.com | Employee View header | Steps filter by profile |
| View dashboard | manager@company.com | Manager View | KPI cards and activity feed |
| Create user | manager@company.com | Manager View → Users | New user appears in table |
| Edit user | manager@company.com | Manager View → Users | User details update |
| Delete user | manager@company.com | Manager View → Users | User removed from table |
| Filter KPIs | manager@company.com | Manager View → Dashboard | KPI counts change by profile |
| Create onboarding | manager@company.com | Manager View → Dashboard | New onboarding instance created |
| Manage roles | admin@company.com | Manager View → Roles | Can create/edit/delete roles |

---

## ✅ Complete Testing Checklist

- [ ] Sign in as employee works
- [ ] Sign in as manager works
- [ ] Sign in as admin works
- [ ] Employee can complete steps
- [ ] Employee can report stuck
- [ ] Employee can suggest edits
- [ ] Employee profile filtering works
- [ ] Manager can view dashboard
- [ ] Manager can create users
- [ ] Manager can edit users
- [ ] Manager can delete users
- [ ] Manager KPI filtering works
- [ ] Manager can create onboarding instances
- [ ] Manager activity feed shows actions
- [ ] Admin can manage roles
- [ ] All 615 tests pass
- [ ] Build completes successfully

---

## 🚀 Everything Works Locally!

No Firebase Emulator, no complex setup - everything runs on localStorage.
The data persists in your browser until you clear it.

Happy testing! 🎉
