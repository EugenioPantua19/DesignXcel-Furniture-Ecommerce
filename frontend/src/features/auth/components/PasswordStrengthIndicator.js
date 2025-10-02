import { validatePassword, getPasswordStrengthColor, getPasswordRequirements } from '../../../shared/utils/validation/passwordValidation';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const requirements = getPasswordRequirements(password);
  const strengthColor = getPasswordStrengthColor(validation.strength);

  return (
    <div className="password-strength-indicator">
      {/* Password Strength Meter */}
      <div className="strength-meter-container">
        <div className="strength-label">
          <span>Password Strength:</span>
          <span className="strength-text" style={{ color: strengthColor }}>
            {validation.strengthLabel}
          </span>
        </div>
        <div className="strength-bars">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div
              key={level}
              className={`strength-bar ${level <= validation.strength ? 'filled' : ''}`}
              style={{
                backgroundColor: level <= validation.strength ? strengthColor : '#e0e0e0'
              }}
            />
          ))}
        </div>
      </div>

      {/* Password Requirements Checklist */}
      {showRequirements && (
        <div className="password-requirements">
          <h4>Password Requirements:</h4>
          <div className="requirements-list">
            {requirements.map((req, index) => (
              <div
                key={index}
                className={`requirement-item ${req.met ? 'met' : 'not-met'}`}
              >
                <span className="requirement-icon">{req.icon}</span>
                <span className="requirement-text">{req.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="password-errors">
          {validation.errors.map((error, index) => (
            <div key={index} className="error-item">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div className="password-warnings">
          {validation.warnings.map((warning, index) => (
            <div key={index} className="warning-item">
              <span className="warning-icon">💡</span>
              <span className="warning-text">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Password Tips */}
      <div className="password-tips">
        <h5>💡 Password Tips:</h5>
        <ul>
          <li>Use a mix of letters, numbers, and symbols</li>
          <li>Avoid personal information like names or birthdays</li>
          <li>Don't reuse passwords from other accounts</li>
          <li>Consider using a passphrase with random words</li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
