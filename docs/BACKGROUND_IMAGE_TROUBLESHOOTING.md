# Background Image Troubleshooting Guide

## Issue: Background Image Not Visible on Frontend

If the background image is not showing up on the frontend homepage, follow these troubleshooting steps:

## 🔍 **Step 1: Check if Background Image is Set**

1. **Open Browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Run this command:**
   ```javascript
   fetch("http://localhost:5000/api/theme/active")
     .then((r) => r.json())
     .then(console.log);
   ```
4. **Check if `backgroundImage` field exists and has a value**

## 🔍 **Step 2: Test Background Image URL**

1. **Copy the background image URL from the API response**
2. **Open a new browser tab**
3. **Paste the URL and press Enter**
4. **Verify the image loads correctly**

## 🔍 **Step 3: Check Current Styles**

1. **In Developer Tools, go to Elements tab**
2. **Select the `<body>` element**
3. **Check the Computed styles for:**
   - `background-image`
   - `background-color`
   - `background-size`
   - `background-position`

## 🔍 **Step 4: Manual Test**

1. **Open the test page:** `http://localhost:3000/test-background.html`
2. **Click "Test Background Image" button**
3. **Check if the background appears**

## 🔧 **Common Fixes**

### Fix 1: Clear Browser Cache

```bash
# Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
# Or clear browser cache completely
```

### Fix 2: Check CORS Issues

If you see CORS errors in console:

1. **Ensure backend is running on port 5000**
2. **Check if the image URL is accessible**
3. **Verify the uploads folder exists**

### Fix 3: Force Background Image

Add this to browser console:

```javascript
// Get the background image URL
fetch("http://localhost:5000/api/theme/active")
  .then((r) => r.json())
  .then((data) => {
    if (data.backgroundImage) {
      const url = data.backgroundImage.startsWith("http")
        ? data.backgroundImage
        : `http://localhost:5000${data.backgroundImage}`;

      // Force apply background
      document.body.style.backgroundImage = `url('${url}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";

      console.log("Background applied:", url);
    }
  });
```

### Fix 4: Check CSS Conflicts

Look for CSS rules that might override the background:

```css
/* These should NOT override background-image */
body {
  background-color: #f8f9fa; /* This might be the issue */
}
```

## 🐛 **Debugging Commands**

### Check Theme Settings

```javascript
// In browser console
fetch("http://localhost:5000/api/theme/active")
  .then((r) => r.json())
  .then(console.log);
```

### Check Current Body Styles

```javascript
// In browser console
console.log("Body background-image:", document.body.style.backgroundImage);
console.log("Body background-color:", document.body.style.backgroundColor);
```

### Test Image Accessibility

```javascript
// In browser console
fetch("http://localhost:5000/uploads/your-image.jpg")
  .then((r) => console.log("Image accessible:", r.ok))
  .catch((e) => console.log("Image error:", e));
```

## 📋 **Checklist**

- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] Background image is uploaded via CMS
- [ ] Image file exists in `/backend/public/uploads/`
- [ ] No CORS errors in browser console
- [ ] No CSS conflicts overriding background
- [ ] Browser cache is cleared
- [ ] Image URL is accessible directly

## 🚨 **Common Issues**

### Issue 1: "Image not found" error

**Solution:** Check if the image file exists in the uploads folder

### Issue 2: CORS error

**Solution:** Ensure backend is running and accessible

### Issue 3: Background color overriding image

**Solution:** The CSS fix should handle this automatically

### Issue 4: Image loads but not visible

**Solution:** Check z-index and positioning of overlay elements

## 📞 **Still Having Issues?**

1. **Check the browser console for errors**
2. **Verify the image file exists and is accessible**
3. **Test with a simple image first**
4. **Try the test page at `/test-background.html`**
5. **Check if the issue is specific to certain browsers**

## 🔄 **Reset Background Image**

To remove the background image:

1. **Go to CMS → Theme tab**
2. **Click "Remove Background Image"**
3. **Or set background image to null via API:**
   ```javascript
   fetch("http://localhost:5000/api/theme/active", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       activeTheme: "default",
       backgroundImage: null,
     }),
   });
   ```
