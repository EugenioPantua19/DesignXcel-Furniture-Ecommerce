# 🚀 Quick Reference Guide

## 📁 **Where to Find Things:**

### **🔧 Need to run a test?**
```bash
cd scripts/test-scripts/
ls test-*.js
node test-[feature].js
```

### **🗄️ Need to fix database?**
```bash
cd scripts/database-scripts/
ls fix-*.js
node fix-[issue].js
```

### **📚 Need documentation?**
```bash
cd docs/
ls *.md
# Open any .md file for specific feature docs
```

### **🗄️ Need database schema?**
```bash
cd database-schemas/
ls *.sql
# Use appropriate .sql file for your needs
```

## 🎯 **Common Commands:**

### **Start Development:**
```bash
# Windows
start.bat

# Unix/Linux
./start.sh

# Cross-platform
node start-dev.js
```

### **Test API:**
```bash
cd scripts/test-scripts/
node test-current-api.js
```

### **Debug Issues:**
```bash
cd scripts/test-scripts/
node debug-issues.js
```

### **Add Database Column:**
```bash
cd scripts/database-scripts/
node add-isfeatured-column.js
```

## 📋 **File Naming Conventions:**

- `test-*.js` - Testing scripts
- `debug-*.js` - Debugging utilities  
- `check-*.js` - Validation scripts
- `verify-*.js` - Verification tools
- `add-*.js` - Database addition scripts
- `fix-*.js` - Database fix scripts
- `fix-*.sql` - SQL fix scripts

## 🎉 **Benefits:**

✅ **Easy to find files**  
✅ **Clear organization**  
✅ **Professional structure**  
✅ **Scalable pattern**  
✅ **No more clutter!**
