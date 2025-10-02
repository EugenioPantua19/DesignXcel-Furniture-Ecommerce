// Password validation utility
export const validatePassword = (password) => {
  const errors = [];
  const warnings = [];

  // Check length (8-16 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length > 16) {
    errors.push('Password must not exceed 16 characters');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for repeated characters (3 or more)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain 3 or more repeated characters');
  }

  // Check for common weak passwords
  const weakPasswords = [
    '123456',
    'password',
    'qwerty',
    'Pa$$word1',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'football',
    'baseball',
    'superman',
    'trustno1',
    'hello123',
    'password123',
    'admin123',
    'qwerty123',
    '123456789',
    '12345678',
    '1234567',
    '1234567890',
    'abc123',
    'password1',
    'admin1',
    'qwerty1'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }

  // Additional security checks
  if (password.length >= 8 && password.length <= 16) {
    // Check for sequential characters
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
      warnings.push('Avoid sequential characters (e.g., abc, 123)');
    }

    // Check for keyboard patterns
    if (/qwerty|asdfgh|zxcvbn|123456|654321/i.test(password)) {
      warnings.push('Avoid keyboard patterns');
    }

    // Check for personal information patterns
    if (/\b\d{4}\b/.test(password) && password.length <= 10) {
      warnings.push('Avoid using years or PINs as part of your password');
    }
  }

  // Strength assessment
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) strength++;
  if (password.length >= 12) strength++;

  let strengthLabel = '';
  if (strength <= 2) strengthLabel = 'Very Weak';
  else if (strength <= 3) strengthLabel = 'Weak';
  else if (strength <= 4) strengthLabel = 'Fair';
  else if (strength <= 5) strengthLabel = 'Good';
  else strengthLabel = 'Strong';

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    strengthLabel
  };
};

// Password strength indicator component helper
export const getPasswordStrengthColor = (strength) => {
  if (strength <= 2) return '#e74c3c'; // Red
  if (strength <= 3) return '#f39c12'; // Orange
  if (strength <= 4) return '#f1c40f'; // Yellow
  if (strength <= 5) return '#27ae60'; // Green
  return '#2ecc71'; // Bright Green
};

// Password requirements checklist helper
export const getPasswordRequirements = (password) => {
  return [
    {
      text: '8-16 characters long',
      met: password.length >= 8 && password.length <= 16,
      icon: password.length >= 8 && password.length <= 16 ? '✓' : '✗'
    },
    {
      text: 'At least one uppercase letter',
      met: /[A-Z]/.test(password),
      icon: /[A-Z]/.test(password) ? '✓' : '✗'
    },
    {
      text: 'At least one lowercase letter',
      met: /[a-z]/.test(password),
      icon: /[a-z]/.test(password) ? '✓' : '✗'
    },
    {
      text: 'At least one number',
      met: /\d/.test(password),
      icon: /\d/.test(password) ? '✓' : '✗'
    },
    {
      text: 'At least one special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
      icon: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? '✓' : '✗'
    },
    {
      text: 'No 3+ repeated characters',
      met: !/(.)\1{2,}/.test(password),
      icon: !/(.)\1{2,}/.test(password) ? '✓' : '✗'
    }
  ];
};
