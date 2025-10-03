# 🛒 Checkout Flow Test Guide

## 🎯 **Testing Objective**
Verify that the checkout process works smoothly without automatic logout issues.

## 🚀 **Pre-Test Setup**

### **1. Start Servers**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### **2. Access URLs**
- **Frontend**: http://localhost:3000
- **Backend Admin**: http://localhost:5000
- **Database**: Ensure SQL Server is running

## 📋 **Test Scenarios**

### **Scenario 1: Fresh Login → Checkout**

#### **Step 1: Customer Login**
1. Navigate to `http://localhost:3000/login`
2. Login with customer credentials
3. ✅ **Expected**: Successful login, redirected to home/dashboard
4. 🔍 **Check**: User data in localStorage, session established

#### **Step 2: Add Items to Cart**
1. Browse to products page
2. Add 2-3 items to cart
3. ✅ **Expected**: Items added successfully
4. 🔍 **Check**: Cart icon shows item count

#### **Step 3: Navigate to Checkout**
1. Click cart icon or "Checkout" button
2. Navigate to `/checkout`
3. ✅ **Expected**: Checkout page loads without logout
4. 🔍 **Check**: 
   - Address information loads
   - Terms and conditions load
   - No redirect to login page
   - Console shows session validation logs

#### **Step 4: Proceed to Payment**
1. Review order details
2. Accept terms and conditions
3. Click "Pay Now" or "Proceed to Payment"
4. ✅ **Expected**: Redirected to payment page without logout
5. 🔍 **Check**: 
   - Payment page loads successfully
   - Order items display correctly
   - No session errors in console

#### **Step 5: Complete Payment**
1. Select payment method (E-Wallet/Stripe)
2. Click "Pay with E-Wallet" or similar
3. ✅ **Expected**: Payment processing without logout
4. 🔍 **Check**: 
   - Stripe checkout session created
   - No authentication errors
   - Redirected to Stripe or success page

---

### **Scenario 2: Extended Session → Checkout**

#### **Step 1: Login and Wait**
1. Login as customer
2. Browse the site for 10-15 minutes
3. Add items to cart after extended browsing
4. ✅ **Expected**: No automatic logout during browsing

#### **Step 2: Checkout After Extended Session**
1. Navigate to checkout after extended session
2. ✅ **Expected**: Checkout loads without requiring re-login
3. 🔍 **Check**: Session validation uses cached data (check console)

---

### **Scenario 3: Network Error Simulation**

#### **Step 1: Start Checkout Process**
1. Login and add items to cart
2. Navigate to checkout page
3. ✅ **Expected**: Normal checkout flow

#### **Step 2: Simulate Network Issues**
1. Temporarily disconnect internet or block API calls
2. Try to proceed with checkout
3. ✅ **Expected**: Graceful error handling, no logout
4. 🔍 **Check**: Error messages shown, session preserved

---

## 🔍 **Debugging Checklist**

### **Console Logs to Monitor**
```javascript
// Session validation logs
"🔄 Performing automatic session validation"
"✅ Session recently validated, skipping validation"
"🛒 Validating session for checkout..."

// API call logs
"🚀 API Request: GET /api/customer/addresses"
"🚀 API Request: GET /api/terms"
"🚀 API Request: POST /api/create-checkout-session"

// Error handling logs
"🔒 401 error on checkout endpoint"
"✅ Checkout session validation successful"
```

### **Network Tab Monitoring**
- `/api/customer/addresses` - Should return 200
- `/api/terms` - Should return 200  
- `/api/auth/validate-session` - Should be called sparingly
- `/api/create-checkout-session` - Should return 200

### **Local Storage Check**
```javascript
// Check in browser console
localStorage.getItem('token')
localStorage.getItem('user')
localStorage.getItem('lastValidation')
```

## ❌ **Common Issues & Solutions**

### **Issue 1: Still Getting Logged Out**
**Symptoms**: Redirected to login during checkout
**Check**: 
- Console errors for 401 responses
- Session data in localStorage
- Backend session logs

**Solution**: 
- Verify session is properly established
- Check cookie settings in browser
- Ensure backend session middleware is working

### **Issue 2: Address Loading Fails**
**Symptoms**: "Unauthorized" error when loading addresses
**Check**: 
- `/api/customer/addresses` response
- Session validation in backend logs
- Customer ID in session

**Solution**:
- Verify customer session data
- Check backend address endpoint authentication

### **Issue 3: Payment Processing Fails**
**Symptoms**: Error during Stripe checkout creation
**Check**:
- Stripe configuration
- Backend `/api/create-checkout-session` endpoint
- Session validation before payment

## ✅ **Success Criteria**

### **Must Pass:**
- [ ] Login → Browse → Checkout (no logout)
- [ ] Address information loads successfully
- [ ] Terms and conditions load
- [ ] Payment page accessible
- [ ] Stripe checkout session creates successfully
- [ ] Extended session works (15+ minutes)
- [ ] Network errors handled gracefully

### **Performance Criteria:**
- [ ] Session validation cached (not called every API request)
- [ ] Checkout loads within 3 seconds
- [ ] No unnecessary API calls
- [ ] Clean console logs (no errors)

## 📊 **Test Results Template**

```
Date: ___________
Tester: ___________

Scenario 1 - Fresh Login → Checkout:
[ ] Login successful
[ ] Items added to cart
[ ] Checkout page loads
[ ] Payment page accessible
[ ] Payment processing works

Scenario 2 - Extended Session:
[ ] No logout after 15 minutes
[ ] Checkout works after extended session

Scenario 3 - Network Errors:
[ ] Graceful error handling
[ ] Session preserved during errors

Issues Found:
- 
- 
- 

Overall Result: PASS / FAIL
```

## 🎯 **Next Steps After Testing**

If tests **PASS**: 
- Mark checkout fixes as complete
- Document the solution
- Update user documentation

If tests **FAIL**:
- Note specific failure points
- Check console/network logs
- Apply additional fixes
- Re-test

---

**Happy Testing! 🚀**
