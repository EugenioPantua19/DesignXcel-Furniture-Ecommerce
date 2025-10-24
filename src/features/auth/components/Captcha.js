import { useState, useEffect } from 'react';

const Captcha = ({ onCaptchaVerified, isVerified, onReset }) => {
    const [captchaValue, setCaptchaValue] = useState('');
    const [userInput, setUserInput] = useState('');
    const [error, setError] = useState('');
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [operator, setOperator] = useState('+');

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const operators = ['+', '-', '×'];
        const randomOperator = operators[Math.floor(Math.random() * operators.length)];
        let n1, n2, result;

        switch (randomOperator) {
            case '+':
                n1 = Math.floor(Math.random() * 20) + 1;
                n2 = Math.floor(Math.random() * 20) + 1;
                result = n1 + n2;
                break;
            case '-':
                n1 = Math.floor(Math.random() * 20) + 10;
                n2 = Math.floor(Math.random() * n1) + 1;
                result = n1 - n2;
                break;
            case '×':
                n1 = Math.floor(Math.random() * 10) + 1;
                n2 = Math.floor(Math.random() * 10) + 1;
                result = n1 * n2;
                break;
            default:
                n1 = Math.floor(Math.random() * 20) + 1;
                n2 = Math.floor(Math.random() * 20) + 1;
                result = n1 + n2;
        }

        setNum1(n1);
        setNum2(n2);
        setOperator(randomOperator);
        setCaptchaValue(result.toString());
        setUserInput('');
        setError('');
        
        // Reset verification status
        if (onReset) {
            onReset();
        }
    };

    const handleVerify = () => {
        if (userInput.trim() === '') {
            setError('Please enter the answer');
            return;
        }

        if (parseInt(userInput) === parseInt(captchaValue)) {
            setError('');
            if (onCaptchaVerified) {
                onCaptchaVerified();
            }
        } else {
            setError('Incorrect answer. Please try again.');
            setUserInput('');
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setUserInput(value);
        if (error) setError('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleVerify();
        }
    };

    return (
        <div className="captcha-container">
            <div className="captcha-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#F0B21B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="9" stroke="#F0B21B" strokeWidth="1.5"/>
                </svg>
                <span>Security Verification</span>
            </div>
            
            <div className="captcha-challenge">
                <div className="captcha-question">
                    <span className="captcha-number">{num1}</span>
                    <span className="captcha-operator">{operator}</span>
                    <span className="captcha-number">{num2}</span>
                    <span className="captcha-equals">=</span>
                    <input
                        type="text"
                        className="captcha-input"
                        placeholder="?"
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        maxLength="3"
                        disabled={isVerified}
                    />
                </div>
                
                {error && (
                    <div className="captcha-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2"/>
                            <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2"/>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
                
                <div className="captcha-actions">
                    {!isVerified ? (
                        <>
                            <button
                                type="button"
                                className="captcha-verify-btn"
                                onClick={handleVerify}
                                disabled={!userInput.trim()}
                            >
                                Verify
                            </button>
                            <button
                                type="button"
                                className="captcha-refresh-btn"
                                onClick={generateCaptcha}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                New Challenge
                            </button>
                        </>
                    ) : (
                        <div className="captcha-success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="9" stroke="#27ae60" strokeWidth="1.5"/>
                            </svg>
                            <span>Verification Complete</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Captcha; 