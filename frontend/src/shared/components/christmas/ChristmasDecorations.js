import React from 'react';
import { ChristmasIcons } from './ChristmasIcons';

/**
 * Christmas Theme Decorations Component
 * Provides Christmas-themed decorative elements for pages
 */
const ChristmasDecorations = ({ 
  showTree = true, 
  showStars = true, 
  showGifts = true,
  showBells = true,
  showSnowflakes = true,
  showHolly = true,
  showWreath = true,
  showOrnaments = true,
  showSleigh = true,
  showReindeer = true,
  showFireplace = true,
  showStocking = true,
  showCookie = true,
  showHotChocolate = true,
  showCandle = true,
  showAngel = true,
  size = 24,
  className = ''
}) => {
  const decorations = [];

  if (showTree) decorations.push(<ChristmasIcons.Tree key="tree" size={size} />);
  if (showStars) decorations.push(<ChristmasIcons.Star key="star" size={size} />);
  if (showGifts) decorations.push(<ChristmasIcons.Gift key="gift" size={size} />);
  if (showBells) decorations.push(<ChristmasIcons.Bell key="bell" size={size} />);
  if (showSnowflakes) decorations.push(<ChristmasIcons.Snowflake key="snowflake" size={size} />);
  if (showHolly) decorations.push(<ChristmasIcons.Holly key="holly" size={size} />);
  if (showWreath) decorations.push(<ChristmasIcons.Wreath key="wreath" size={size} />);
  if (showOrnaments) decorations.push(<ChristmasIcons.Ornament key="ornament" size={size} />);
  if (showSleigh) decorations.push(<ChristmasIcons.Sleigh key="sleigh" size={size} />);
  if (showReindeer) decorations.push(<ChristmasIcons.Reindeer key="reindeer" size={size} />);
  if (showFireplace) decorations.push(<ChristmasIcons.Fireplace key="fireplace" size={size} />);
  if (showStocking) decorations.push(<ChristmasIcons.Stocking key="stocking" size={size} />);
  if (showCookie) decorations.push(<ChristmasIcons.Cookie key="cookie" size={size} />);
  if (showHotChocolate) decorations.push(<ChristmasIcons.HotChocolate key="hotchocolate" size={size} />);
  if (showCandle) decorations.push(<ChristmasIcons.Candle key="candle" size={size} />);
  if (showAngel) decorations.push(<ChristmasIcons.Angel key="angel" size={size} />);

  return (
    <div className={`christmas-decorations ${className}`}>
      {decorations}
    </div>
  );
};

/**
 * Christmas Header Decoration Component
 * Adds Christmas-themed header decorations
 */
const ChristmasHeaderDecoration = () => (
  <div className="christmas-header-decoration">
    <div className="christmas-header-left">
      <ChristmasIcons.Tree size={20} />
      <ChristmasIcons.Star size={16} />
      <ChristmasIcons.Bell size={18} />
    </div>
    <div className="christmas-header-center">
      <ChristmasIcons.Wreath size={24} />
    </div>
    <div className="christmas-header-right">
      <ChristmasIcons.Holly size={18} />
      <ChristmasIcons.Ornament size={16} />
      <ChristmasIcons.Snowflake size={20} />
    </div>
  </div>
);

/**
 * Christmas Footer Decoration Component
 * Adds Christmas-themed footer decorations
 */
const ChristmasFooterDecoration = () => (
  <div className="christmas-footer-decoration">
    <div className="christmas-footer-left">
      <ChristmasIcons.Sleigh size={20} />
      <ChristmasIcons.Reindeer size={18} />
    </div>
    <div className="christmas-footer-center">
      <ChristmasIcons.Fireplace size={24} />
    </div>
    <div className="christmas-footer-right">
      <ChristmasIcons.Stocking size={18} />
      <ChristmasIcons.Cookie size={16} />
      <ChristmasIcons.HotChocolate size={20} />
    </div>
  </div>
);

/**
 * Christmas Page Decoration Component
 * Adds Christmas-themed page decorations
 */
const ChristmasPageDecoration = ({ 
  position = 'top-right',
  size = 32,
  icon = 'tree'
}) => {
  const IconComponent = ChristmasIcons[icon.charAt(0).toUpperCase() + icon.slice(1)];
  
  if (!IconComponent) return null;

  return (
    <div className={`christmas-page-decoration christmas-page-decoration-${position}`}>
      <IconComponent size={size} />
    </div>
  );
};

/**
 * Christmas Loading Spinner Component
 * Christmas-themed loading spinner
 */
const ChristmasLoadingSpinner = ({ size = 40 }) => (
  <div className="christmas-loading-spinner">
    <div className="christmas-spinner-container">
      <ChristmasIcons.Snowflake size={size} />
      <div className="christmas-spinner-text">Loading...</div>
    </div>
  </div>
);

/**
 * Christmas Empty State Component
 * Christmas-themed empty state with decorations
 */
const ChristmasEmptyState = ({ 
  title = "No items found",
  message = "Try adjusting your search or filters",
  icon = "gift",
  showDecorations = true
}) => {
  const IconComponent = ChristmasIcons[icon.charAt(0).toUpperCase() + icon.slice(1)];
  
  return (
    <div className="christmas-empty-state">
      {showDecorations && (
        <div className="christmas-empty-decorations">
          <ChristmasIcons.Tree size={32} />
          <ChristmasIcons.Star size={24} />
          <ChristmasIcons.Bell size={28} />
        </div>
      )}
      <div className="christmas-empty-content">
        {IconComponent && <IconComponent size={48} />}
        <h3 className="christmas-empty-title">{title}</h3>
        <p className="christmas-empty-message">{message}</p>
      </div>
    </div>
  );
};

/**
 * Christmas Success Message Component
 * Christmas-themed success message
 */
const ChristmasSuccessMessage = ({ 
  message = "Success!",
  showIcon = true,
  size = 24
}) => (
  <div className="christmas-success-message">
    {showIcon && <ChristmasIcons.Star size={size} />}
    <span className="christmas-success-text">{message}</span>
  </div>
);

/**
 * Christmas Error Message Component
 * Christmas-themed error message
 */
const ChristmasErrorMessage = ({ 
  message = "Something went wrong",
  showIcon = true,
  size = 24
}) => (
  <div className="christmas-error-message">
    {showIcon && <ChristmasIcons.Bell size={size} />}
    <span className="christmas-error-text">{message}</span>
  </div>
);

/**
 * Christmas Info Message Component
 * Christmas-themed info message
 */
const ChristmasInfoMessage = ({ 
  message = "Information",
  showIcon = true,
  size = 24
}) => (
  <div className="christmas-info-message">
    {showIcon && <ChristmasIcons.Snowflake size={size} />}
    <span className="christmas-info-text">{message}</span>
  </div>
);

/**
 * Christmas Warning Message Component
 * Christmas-themed warning message
 */
const ChristmasWarningMessage = ({ 
  message = "Warning",
  showIcon = true,
  size = 24
}) => (
  <div className="christmas-warning-message">
    {showIcon && <ChristmasIcons.Candle size={size} />}
    <span className="christmas-warning-text">{message}</span>
  </div>
);

/**
 * Christmas Button Component
 * Christmas-themed button with icons
 */
const ChristmasButton = ({ 
  children,
  icon = null,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const IconComponent = icon ? ChristmasIcons[icon.charAt(0).toUpperCase() + icon.slice(1)] : null;
  
  const buttonClasses = [
    'christmas-button',
    `christmas-button-${variant}`,
    `christmas-button-${size}`,
    className
  ].filter(Boolean).join(' ');

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <button 
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {IconComponent && iconPosition === 'left' && (
        <IconComponent size={iconSize} />
      )}
      <span className="christmas-button-text">{children}</span>
      {IconComponent && iconPosition === 'right' && (
        <IconComponent size={iconSize} />
      )}
    </button>
  );
};

/**
 * Christmas Card Component
 * Christmas-themed card with decorations
 */
const ChristmasCard = ({ 
  children,
  title = null,
  showDecorations = true,
  decorationPosition = 'top-right',
  decorationIcon = 'star',
  className = '',
  ...props
}) => {
  const IconComponent = ChristmasIcons[decorationIcon.charAt(0).toUpperCase() + decorationIcon.slice(1)];
  
  return (
    <div className={`christmas-card ${className}`} {...props}>
      {showDecorations && IconComponent && (
        <div className={`christmas-card-decoration christmas-card-decoration-${decorationPosition}`}>
          <IconComponent size={20} />
        </div>
      )}
      {title && (
        <div className="christmas-card-header">
          <h3 className="christmas-card-title">{title}</h3>
        </div>
      )}
      <div className="christmas-card-content">
        {children}
      </div>
    </div>
  );
};

/**
 * Christmas Badge Component
 * Christmas-themed badge with icons
 */
const ChristmasBadge = ({ 
  children,
  icon = null,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  const IconComponent = icon ? ChristmasIcons[icon.charAt(0).toUpperCase() + icon.slice(1)] : null;
  
  const badgeClasses = [
    'christmas-badge',
    `christmas-badge-${variant}`,
    `christmas-badge-${size}`,
    className
  ].filter(Boolean).join(' ');

  const iconSize = size === 'small' ? 12 : size === 'large' ? 20 : 16;

  return (
    <span className={badgeClasses} {...props}>
      {IconComponent && <IconComponent size={iconSize} />}
      <span className="christmas-badge-text">{children}</span>
    </span>
  );
};

export default ChristmasDecorations;
export {
  ChristmasHeaderDecoration,
  ChristmasFooterDecoration,
  ChristmasPageDecoration,
  ChristmasLoadingSpinner,
  ChristmasEmptyState,
  ChristmasSuccessMessage,
  ChristmasErrorMessage,
  ChristmasInfoMessage,
  ChristmasWarningMessage,
  ChristmasButton,
  ChristmasCard,
  ChristmasBadge
};
