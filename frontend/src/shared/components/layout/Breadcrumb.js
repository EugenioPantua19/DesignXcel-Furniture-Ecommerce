import React from 'react';
import { Link } from 'react-router-dom';
import './breadcrumb.css';

const Breadcrumb = ({ items }) => {
    return (
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                {items.map((item, index) => (
                    <li key={index} className="breadcrumb-item">
                        {index > 0 && (
                            <span className="breadcrumb-separator" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        )}
                        {item.href ? (
                            <Link to={item.href} className="breadcrumb-link">
                                {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                                {item.label}
                            </Link>
                        ) : (
                            <span className="breadcrumb-current" aria-current="page">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
