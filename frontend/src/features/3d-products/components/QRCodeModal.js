import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeModal.css';

// QR Code Modal for Desktop - IKEA Place style
const QRCodeModal = ({ isOpen, onClose, product, arUrl }) => {
  const [copied, setCopied] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="qr-close-btn" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Main Content */}
        <div className="qr-modal-body">
          {/* Icon */}
          <div className="qr-icon-container">
            <svg className="qr-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Title */}
          <h2 className="qr-title">View in AR on Your Phone</h2>
          <p className="qr-subtitle">
            Scan this QR code with your mobile device to see <strong>{product?.name || 'this product'}</strong> in your space
          </p>

          {/* QR Code */}
          <div className="qr-code-container">
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={arUrl}
                size={256}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="qr-instructions">
            <div className="qr-instruction-step">
              <div className="qr-step-number">1</div>
              <p>Open your phone's camera app</p>
            </div>
            <div className="qr-instruction-step">
              <div className="qr-step-number">2</div>
              <p>Point it at this QR code</p>
            </div>
            <div className="qr-instruction-step">
              <div className="qr-step-number">3</div>
              <p>Tap the notification to open AR</p>
            </div>
            <div className="qr-instruction-step">
              <div className="qr-step-number">4</div>
              <p>Place the product in your room</p>
            </div>
          </div>

          {/* Copy Link Option */}
          <div className="qr-link-container">
            <p className="qr-link-label">Or share this link:</p>
            <div className="qr-link-input-group">
              <input
                type="text"
                value={arUrl}
                readOnly
                className="qr-link-input"
              />
              <button
                className={`qr-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;

