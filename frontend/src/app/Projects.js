import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ModernPageHeader from '../shared/components/layout/ModernPageHeader';
import { ContactSection } from '../shared/components/layout';
import './projects.css';
import api from '../shared/services/api/api';

const Projects = () => {
  const [query, setQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);
  const [projectImages, setProjectImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const projectRef = useRef(null);

  // Fetch project data from API
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const result = await api.getProjects();
        
        if (result.success && result.data) {
          // Transform API data to match expected format
          const transformedData = result.data.map(item => ({
            id: item.id,
            src: item.mainImageUrl,
            category: item.category,
            title: item.title,
            description: item.description,
            tags: item.tags || [],
            thumbnailUrls: item.thumbnailUrls || []
          }));
          setProjectImages(transformedData);
        } else {
          setError('Failed to load project data');
        }
      } catch (err) {
        console.error('Project fetch error:', err);
        setError('Error loading project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, []);

  const filtered = useMemo(() => {
    return projectImages.filter((img) => {
      const q = query.trim().toLowerCase();
      const searchMatch = q.length === 0 || img.title.toLowerCase().includes(q) || img.description?.toLowerCase().includes(q) || img.tags?.some(t => t.toLowerCase().includes(q));
      return searchMatch;
    });
  }, [query, projectImages]);

  const visibleImages = filtered.slice(0, visibleCount);

  // Simple enter animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('animate-in')),
      { threshold: 0.1 }
    );
    const items = projectRef.current?.querySelectorAll('.project-card');
    items?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleImages]);

  const openLightboxAt = (index) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = 'unset';
  };

  const showPrev = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + filtered.length) % filtered.length));
  };

  const showNext = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filtered.length));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtered.length]);


  return (
    <div className="projects-page">
      <div className="container">
        <ModernPageHeader
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Projects' }
          ]}
          title="Our Projects"
          subtitle="Showcasing our accomplished office furniture solutions and successful installations"
        />

        <div className="projects-controls">
          <div className="filter-row">
            <div className="search-box">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." aria-label="Search projects" />
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="loading-state">
            <p>Loading projects...</p>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <p>Error: {error}</p>
          </div>
        )}
        
        {/* Modern Projects Grid */}
        {!loading && !error && (
          <div className="projects-grid" ref={projectRef}>
            {visibleImages.length === 0 && (
              <div className="no-results">
                <div className="no-results-content">
                  <div className="no-results-icon">🏢</div>
                  <h3>No projects found</h3>
                  <p>Try adjusting your search criteria or check back later for new projects</p>
                </div>
              </div>
            )}
            {visibleImages.map((image, idx) => (
              <article key={image.id} className="project-card" onClick={() => openLightboxAt(idx)}>
                <div className="card-image-container">
                  <img src={image.src} alt={image.title} loading="lazy" />
                  <div className="card-overlay">
                    <div className="overlay-content">
                      <span className="view-details">View Project</span>
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{image.title}</h3>
                  <p className="card-description">{image.description?.substring(0, 120)}...</p>
                  <div className="card-tags">
                    {image.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && visibleCount < filtered.length && (
          <div className="load-more-wrap">
            <button className="btn" onClick={() => setVisibleCount((c) => c + 9)}>Load More Projects</button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="modal-overlay" onClick={closeLightbox}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLightbox}>×</button>
            <button className="nav prev" onClick={showPrev} aria-label="Previous">‹</button>
            <button className="nav next" onClick={showNext} aria-label="Next">›</button>

            {/* Template Layout */}
            <div className="modal-body mock-layout">
              {/* Left: Large image */}
              <figure className="mock-visual-large">
                <img src={filtered[lightboxIndex].src} alt={filtered[lightboxIndex].title} />
              </figure>

              {/* Right: Horizontal thumbnails */}
              <div className="mock-thumb-row">
                {(() => {
                  const currentItem = filtered[lightboxIndex];
                  const thumbnails = currentItem?.thumbnailUrls || [];
                  const allImages = [currentItem?.src, ...thumbnails].filter(Boolean);
                  
                  return allImages.slice(0, 5).map((imgSrc, i) => (
                    <button
                      key={i}
                      className={`mini-thumb ${i === 0 ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        // For now, just show the main image
                        // In a full implementation, you'd switch between main and thumbnail images
                      }}
                      aria-label={`Thumbnail ${i + 1}`}
                    >
                      <img src={imgSrc} alt={`Thumbnail ${i + 1}`} />
                    </button>
                  ));
                })()}
              </div>

              {/* Bottom: Details spanning full width */}
              <div className="mock-details">
                <h1 className="detail-heading centered">{filtered[lightboxIndex].title}</h1>
                <div className="detail-tags centered">
                  {filtered[lightboxIndex].tags?.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                {filtered[lightboxIndex].description && (
                  <p className="detail-description centered-text">{filtered[lightboxIndex].description}</p>
                )}
                <div className="detail-actions centered">
                  <Link to="/products" className="btn" onClick={closeLightbox}>View Our Products</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Section with Map */}
      <ContactSection />
    </div>
  );
};

export default Projects;
