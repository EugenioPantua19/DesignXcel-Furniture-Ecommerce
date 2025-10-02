import React from 'react';
import { Link } from 'react-router-dom';
import './modern-page-header.css';

const ModernPageHeader = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  backgroundImage = null,
  showBackButton = false,
  onBackClick = null 
}) => {
  return (
    <div className="modern-page-header">
      {backgroundImage && (
        <div 
          className="header-background" 
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      <div className="header-content">
        <div className="modern-page-header-content">
          {showBackButton && (
            <button 
              className="back-button"
              onClick={onBackClick}
              aria-label="Go back"
            >
              ← Back
            </button>
          )}
          
          {breadcrumbs.length > 0 && (
            <nav className="modern-page-breadcrumb" aria-label="Breadcrumb">
              <ol className="breadcrumb-list">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="breadcrumb-item">
                    {crumb.href ? (
                      <Link to={crumb.href} className="breadcrumb-link">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="breadcrumb-current">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span className="breadcrumb-separator">/</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          <div className="header-text">
            <h1 className="modern-page-title">{title}</h1>
            {subtitle && <p className="modern-page-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPageHeader;
