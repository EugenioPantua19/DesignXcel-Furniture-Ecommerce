import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../shared/components/layout/PageHeader';
import { getImageUrl } from '../shared/utils/imageUtils';
import { Bars } from 'react-loader-spinner';
import './projects.css';
import api from '../shared/services/api/api';

const Projects = () => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);
  const [projectImages, setProjectImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const visibleImages = projectImages.slice(0, visibleCount);

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
    setCurrentImageIndex(0); // Start with main image
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = 'unset';
  };

  const showPrev = (e) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      const currentItem = projectImages[lightboxIndex];
      const thumbnails = currentItem?.thumbnailUrls || [];
      const allImages = [currentItem?.src, ...thumbnails].filter(Boolean);
      
      if (allImages.length > 1) {
        // Navigate within current project's images
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      } else {
        // Navigate to previous project
        setLightboxIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
        setCurrentImageIndex(0);
      }
    }
  };

  const showNext = (e) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      const currentItem = projectImages[lightboxIndex];
      const thumbnails = currentItem?.thumbnailUrls || [];
      const allImages = [currentItem?.src, ...thumbnails].filter(Boolean);
      
      if (allImages.length > 1) {
        // Navigate within current project's images
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      } else {
        // Navigate to next project
        setLightboxIndex((prev) => (prev + 1) % projectImages.length);
        setCurrentImageIndex(0);
      }
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [projectImages.length]);


  return (
    <div className="projects-page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Projects' }
          ]}
          title="Our Projects"
          subtitle="Showcasing our accomplished office furniture solutions and successful installations"
        />

        {/* Loading and Error States */}
        {loading && (
          <div className="loading-state">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem' 
            }}>
              <Bars color="#F0B21B" height={80} width={80} />
              <p>Loading our amazing projects...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem' 
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <p>Oops! We couldn't load the projects right now.</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: '#F0B21B',
                  color: '#333',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Modern Projects Grid */}
        {!loading && !error && (
          <div className="projects-grid" ref={projectRef}>
            {visibleImages.map((image, idx) => (
              <article key={image.id} className="project-card" onClick={() => openLightboxAt(idx)}>
                <div className="card-image-container">
                  <img src={getImageUrl(image.src)} alt={image.title} loading="lazy" />
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

        {!loading && !error && visibleCount < projectImages.length && (
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
                {(() => {
                  const currentItem = projectImages[lightboxIndex];
                  const thumbnails = currentItem?.thumbnailUrls || [];
                  const allImages = [currentItem?.src, ...thumbnails].filter(Boolean);
                  const currentImage = allImages[currentImageIndex] || currentItem?.src;
                  
                  return (
                    <>
                      <img 
                        src={getImageUrl(currentImage)} 
                        alt={currentItem?.title} 
                        style={{ transition: 'opacity 0.3s ease' }}
                      />
                      {allImages.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '1rem',
                          right: '1rem',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      )}
                    </>
                  );
                })()}
              </figure>

              {/* Right: Vertical thumbnails */}
              <div className="mock-thumb-row">
                {(() => {
                  const currentItem = projectImages[lightboxIndex];
                  const thumbnails = currentItem?.thumbnailUrls || [];
                  const allImages = [currentItem?.src, ...thumbnails].filter(Boolean);
                  
                  return allImages.slice(0, 6).map((imgSrc, i) => (
                    <button
                      key={i}
                      className={`mini-thumb ${i === currentImageIndex ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentImageIndex(i);
                      }}
                      aria-label={`View image ${i + 1} of ${allImages.length}`}
                      title={`View image ${i + 1} of ${allImages.length}`}
                    >
                      <img src={getImageUrl(imgSrc)} alt={`Thumbnail ${i + 1}`} />
                      {i === currentImageIndex && (
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#F0B21B',
                          color: '#333',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {i + 1}
                        </div>
                      )}
                    </button>
                  ));
                })()}
              </div>

              {/* Bottom: Details spanning full width */}
              <div className="mock-details">
                <h1 className="detail-heading centered">{projectImages[lightboxIndex].title}</h1>
                <div className="detail-tags centered">
                  {projectImages[lightboxIndex].tags?.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                {projectImages[lightboxIndex].description && (
                  <p className="detail-description centered-text">{projectImages[lightboxIndex].description}</p>
                )}
                <div className="detail-actions centered">
                  <Link to="/products" className="btn" onClick={closeLightbox}>View Our Products</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
