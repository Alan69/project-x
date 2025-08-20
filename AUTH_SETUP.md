# Authentication Setup Guide

This guide explains how to set up authentication in your Performance Review System using the NocoDB users table.

## 🔑 How Authentication Works

The frontend now authenticates users by:

1. **Querying the `users` table** in NocoDB using email
2. **Comparing passwords** (simple text comparison for demo)
3. **Generating a session token** and storing user data
4. **Managing authentication state** in Redux

## 📋 Prerequisites

1. **NocoDB running** on `http://localhost:8080`
2. **API token** from NocoDB dashboard
3. **Users table** created in NocoDB

## 🚀 Quick Setup

### Step 1: Get Your API Token

1. Go to `http://localhost:8080/dashboard/#/account/tokens`
2. Click "Generate Token"
3. Copy the generated token

### Step 2: Update API Configuration

In `src/services/api.ts`, update line 6:

```typescript
const NOCODB_API_TOKEN = "YOUR_ACTUAL_TOKEN_HERE";
```

### Step 3: Create Users Table

#### Option A: Use the Setup Script (Recommended)

1. Open `add-demo-users.js` in your browser console
2. Replace `'YOUR_API_TOKEN_HERE'` with your actual token
3. Run: `setupDemoUsers()`

#### Option B: Manual Creation

1. Go to `http://localhost:8080/dashboard`
2. Click "Create New Table"
3. Name it `users`
4. Add these columns:

| Column Name    | Title         | Type             | Required | Options                                        |
| -------------- | ------------- | ---------------- | -------- | ---------------------------------------------- |
| `email`        | Email         | Single Line Text | ✅       | Unique                                         |
| `password`     | Password      | Single Line Text | ✅       | -                                              |
| `firstName`    | First Name    | Single Line Text | ✅       | -                                              |
| `lastName`     | Last Name     | Single Line Text | ✅       | -                                              |
| `role`         | Role          | Single Select    | ✅       | EMPLOYEE, MANAGER, HR, ADMIN, COMMITTEE_MEMBER |
| `position`     | Position      | Single Line Text | ✅       | -                                              |
| `department`   | Department    | Single Line Text | ✅       | -                                              |
| `currentGrade` | Current Grade | Single Select    | ✅       | L1, L2, L3, L4, L5                             |
| `managerId`    | Manager ID    | Single Line Text | ❌       | -                                              |
| `hireDate`     | Hire Date     | Date             | ✅       | -                                              |
| `isActive`     | Is Active     | Checkbox         | ✅       | -                                              |

### Step 4: Add Demo Users

The setup script will automatically add these demo users:

| Email                   | Password      | Role      | Name              |
| ----------------------- | ------------- | --------- | ----------------- |
| `employee@company.com`  | `password123` | Employee  | John Employee     |
| `manager@company.com`   | `password123` | Manager   | Jane Manager      |
| `hr@company.com`        | `password123` | HR        | Bob HR            |
| `admin@company.com`     | `password123` | Admin     | Alice Admin       |
| `committee@company.com` | `password123` | Committee | Charlie Committee |

## 🔐 Testing Authentication

1. **Start your React app**: `npm start`
2. **Go to login page**: `http://localhost:3000/login`
3. **Use demo credentials** from the table above
4. **Check browser console** for any errors

## 🛠️ Troubleshooting

### Common Issues

1. **404 Error on Login**

   - Check if API token is correct
   - Verify users table exists
   - Ensure table name is exactly `users`

2. **"User not found" Error**

   - Check if email exists in users table
   - Verify email spelling

3. **"Invalid password" Error**

   - Check password in users table
   - Ensure password field matches exactly

4. **CORS Issues**
   - NocoDB should handle CORS automatically
   - Check browser console for CORS errors

### Debug Steps

1. **Check API Token**:

   ```bash
   curl -H "xc-token: YOUR_TOKEN" http://localhost:8080/api/v2/tables
   ```

2. **Check Users Table**:

   ```bash
   curl -H "xc-token: YOUR_TOKEN" http://localhost:8080/api/v2/tables/users/records
   ```

3. **Check Browser Network Tab**:
   - Look for failed requests
   - Check request/response details

## 🔒 Security Notes

⚠️ **Important**: This is a demo implementation with basic security:

- **Passwords are stored as plain text** (not recommended for production)
- **Tokens are simple strings** (use JWT in production)
- **No password hashing** (implement bcrypt in production)
- **No rate limiting** (add protection in production)

## 🚀 Production Improvements

For production use, consider:

1. **Password Hashing**: Use bcrypt or Argon2
2. **JWT Tokens**: Implement proper JWT authentication
3. **Rate Limiting**: Add login attempt limits
4. **Password Policies**: Enforce strong passwords
5. **Session Management**: Add token expiration
6. **HTTPS**: Use secure connections only

## 📚 API Endpoints

The authentication system uses these endpoints:

- **Login**: `GET /api/v2/tables/users/records?where=(email,eq,{email})&limit=1`
- **Get Users**: `GET /api/v2/tables/users/records`
- **Get User by ID**: `GET /api/v2/tables/users/records?where=(id,eq,{id})`

## 🎯 Next Steps

After authentication is working:

1. **Test all user roles** and permissions
2. **Implement protected routes** based on user roles
3. **Add user profile management**
4. **Set up password reset functionality**
5. **Add audit logging** for security events

---

**Need Help?** Check the browser console for detailed error messages and ensure all prerequisites are met.
