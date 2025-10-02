# Troubleshooting Guide: Images and Reviews Issues

## 🔍 **Issues Identified:**

1. **Images not displaying properly** on the products page
2. **Reviews not showing** after submission

## 🛠️ **Solutions:**

### **Issue 1: Images Not Displaying**

#### **Problem:**

- ProductCard component expects `image` field but API returns `images` array
- Image URLs might be incorrect or missing

#### **Solution Applied:**

✅ **Fixed ProductCard.js** - Now handles both `image` and `images` fields
✅ **Added fallback images** - Uses `/logo192.png` if no image is available
✅ **Proper URL handling** - Converts relative paths to full URLs

#### **How to Test:**

1. Start the backend server
2. Run the debug script:
   ```bash
   node debug-issues.js
   ```
3. Check the console output for image structure

#### **Manual Check:**

1. Open browser console (F12)
2. Navigate to `/products` page
3. Look for any image-related errors
4. Check if image URLs are being constructed correctly

### **Issue 2: Reviews Not Displaying**

#### **Problem:**

- Reviews might not be saved to database
- API endpoints might not be working
- Frontend might not be refreshing after submission

#### **Solution Applied:**

✅ **Added debugging logs** to both frontend and backend
✅ **Enhanced error handling** in reviews service
✅ **Added console logging** to track review flow

#### **How to Test:**

1. **Check Database Schema:**

   ```sql
   -- Run this in SQL Server to check if reviews table exists
   SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductReviews'
   ```

2. **Check Sample Data:**

   ```sql
   -- Check if sample reviews exist
   SELECT COUNT(*) FROM ProductReviews
   ```

3. **Run Debug Script:**

   ```bash
   node debug-issues.js
   ```

4. **Test Review Submission:**
   - Log in to the application
   - Go to a product detail page
   - Submit a review
   - Check browser console for logs

## 🔧 **Step-by-Step Fix Process:**

### **Step 1: Verify Database Setup**

```bash
# Run the database test
node test-reviews-setup.js
```

### **Step 2: Start Backend Server**

```powershell
cd backend
npm start
```

### **Step 3: Test API Endpoints**

```bash
# Run the debug script
node debug-issues.js
```

### **Step 4: Start Frontend**

```powershell
cd frontend
npm start
```

### **Step 5: Test in Browser**

1. Open `http://localhost:3000`
2. Go to `/products` page
3. Check if images are displaying
4. Click on a product to view details
5. Scroll down to reviews section
6. Try submitting a review (if logged in)

## 🐛 **Common Issues and Fixes:**

### **Images Still Not Showing:**

1. **Check Database:**

   ```sql
   SELECT ProductID, Name, ImageURL FROM Products WHERE IsActive = 1
   ```

2. **Check Image URLs:**

   - Are they relative paths (starting with `/`)?
   - Are they absolute URLs?
   - Do the image files exist in the backend public folder?

3. **Check Backend Public Folder:**
   - Ensure images are in `backend/public/` directory
   - Check if the server is serving static files

### **Reviews Still Not Working:**

1. **Check Database Schema:**

   ```sql
   -- Execute the reviews_schema.sql file if not done
   ```

2. **Check Stored Procedures:**

   ```sql
   SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES
   WHERE ROUTINE_TYPE = 'PROCEDURE'
   AND ROUTINE_NAME IN ('GetProductReviews', 'AddProductReview', 'GetProductReviewStats')
   ```

3. **Check Sample Data:**
   ```sql
   SELECT * FROM ProductReviews LIMIT 5
   ```

### **Backend API Errors:**

1. **Check Console Logs:**

   - Look for "Backend: Fetching reviews" messages
   - Check for any error messages

2. **Test API Directly:**
   ```bash
   curl http://localhost:5000/api/products/1/reviews
   ```

### **Frontend Errors:**

1. **Check Browser Console:**

   - Look for JavaScript errors
   - Check network tab for failed requests

2. **Check Authentication:**
   - Ensure user is logged in to submit reviews
   - Check if user ID is being passed correctly

## 📋 **Debug Checklist:**

### **For Images:**

- [ ] Backend server is running on port 5000
- [ ] Database has products with ImageURL values
- [ ] Image files exist in backend/public folder
- [ ] ProductCard component is receiving images array
- [ ] No JavaScript errors in browser console

### **For Reviews:**

- [ ] Database schema has been executed
- [ ] ProductReviews table exists
- [ ] Sample reviews are in the database
- [ ] Stored procedures are created
- [ ] Backend API endpoints are responding
- [ ] User is logged in (for submitting reviews)
- [ ] No JavaScript errors in browser console

## 🚀 **Quick Fix Commands:**

### **If Images Still Don't Work:**

```powershell
# Check if backend is serving static files
curl http://localhost:5000/logo192.png
```

### **If Reviews Still Don't Work:**

```powershell
# Test the reviews API directly
curl http://localhost:5000/api/products/1/reviews
```

### **Reset Everything:**

```powershell
# Stop all servers
# Clear browser cache
# Restart backend and frontend
```

## 📞 **Need More Help?**

If the issues persist after following this guide:

1. **Run the debug script** and share the output
2. **Check browser console** and share any errors
3. **Check backend console** and share any error messages
4. **Verify database setup** with the test script

The debug script will help identify exactly where the problem is occurring!
