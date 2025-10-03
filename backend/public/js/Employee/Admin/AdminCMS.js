// AdminCMS.js - Handles Admin Content Management (Testimonials, etc.)

// --- Testimonials Management ---

// Fetch testimonials from backend
async function fetchTestimonials() {
    const res = await fetch('/api/admin/testimonials');
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return res.json();
}

// Add a new testimonial
async function addTestimonial(formData) {
    const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to add testimonial');
    return res.json();
}

// Update a testimonial
async function updateTestimonial(id, formData) {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to update testimonial');
    return res.json();
}

// Delete a testimonial
async function deleteTestimonial(id) {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete testimonial');
    return res.json();
}

// Render testimonials in the admin tab
async function renderTestimonialsAdmin() {
    const container = document.getElementById('admin-testimonials-list');
    container.innerHTML = 'Loading...';
    try {
        const response = await fetchTestimonials();
        const testimonials = response.testimonials || [];
        if (testimonials.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2em;">No testimonials yet. Add your first testimonial using the form above.</p>';
            return;
        }
        container.innerHTML = testimonials.map(t => `
            <div class="testimonial-admin-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fff;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <img src="${t.imageURL ? `http://localhost:5000${t.imageURL}` : '/images/placeholder-avatar.svg'}" 
                         alt="${t.name}" width="60" height="60" 
                         style="border-radius:50%;object-fit:cover;border: 2px solid #F0B21B;">
                    <div>
                        <h5 style="margin: 0; color: #333;">${t.name}</h5>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">${t.profession || ''}</p>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="color: #F0B21B;">★★★★★</span>
                            <span style="font-weight: bold; color: #333;">${t.rating}</span>
                        </div>
                    </div>
                    <div style="margin-left: auto; display: flex; gap: 10px;">
                        <button onclick="editTestimonialHandler('${t.id}')" 
                                style="background: #F0B21B; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Edit
                        </button>
                        <button onclick="deleteTestimonialHandler('${t.id}')" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </div>
                <blockquote style="margin: 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #F0B21B; border-radius: 4px; font-style: italic; color: #555;">
                    "${t.text}"
                </blockquote>
                <div style="margin-top: 10px; font-size: 12px; color: #999;">
                    Display Order: ${t.displayOrder} | 
                    Status: <span style="color: ${t.isActive ? '#28a745' : '#dc3545'}">${t.isActive ? 'Active' : 'Inactive'}</span> |
                    Created: ${new Date(t.createdAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading testimonials:', err);
        container.innerHTML = '<p style="color:red; text-align: center; padding: 2em;">Error loading testimonials. Please try again.</p>';
    }
}

// Handle testimonial form submit
async function handleTestimonialFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const editId = form.dataset.editId;
    
    try {
        if (editId) {
            // Update existing testimonial
            await updateTestimonial(editId, formData);
            alert('Testimonial updated successfully!');
        } else {
            // Add new testimonial
            await addTestimonial(formData);
            alert('Testimonial added successfully!');
        }
        
        // Reset form and exit edit mode
        form.reset();
        delete form.dataset.editId;
        form.querySelector('button[type="submit"]').textContent = 'Add Testimonial';
        renderTestimonialsAdmin();
    } catch (err) {
        console.error('Error submitting testimonial:', err);
        alert(editId ? 'Failed to update testimonial. Please try again.' : 'Failed to add testimonial. Please try again.');
    }
}

// Delete handler
async function deleteTestimonialHandler(id) {
    if (!confirm('Delete this testimonial?')) return;
    try {
        await deleteTestimonial(id);
        renderTestimonialsAdmin();
    } catch (err) {
        console.error('Error deleting testimonial:', err);
        alert('Failed to delete testimonial. Please try again.');
    }
}

// Edit handler
async function editTestimonialHandler(id) {
    try {
        const response = await fetchTestimonials();
        const testimonials = response.testimonials || [];
        const testimonial = testimonials.find(t => t.id == id);
        if (!testimonial) {
            alert('Testimonial not found.');
            return;
        }

        // Populate the form with existing data
        document.getElementById('testimonial-name').value = testimonial.name;
        document.getElementById('testimonial-profession').value = testimonial.profession || '';
        document.getElementById('testimonial-text').value = testimonial.text;
        document.getElementById('testimonial-rating').value = testimonial.rating;
        document.getElementById('testimonial-display-order').value = testimonial.displayOrder || 0;

        // Change form to edit mode
        const form = document.getElementById('admin-testimonial-form');
        form.dataset.editId = id;
        form.querySelector('button[type="submit"]').textContent = 'Update Testimonial';
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('Error loading testimonial for editing:', err);
        alert('Failed to load testimonial for editing. Please try again.');
    }
}

// --- Header Offer Bar Management ---

// Fetch header offer bar settings from backend
async function fetchHeaderOfferBar() {
    const res = await fetch('/api/admin/header-offer-bar');
    if (!res.ok) throw new Error('Failed to fetch header offer bar settings');
    return res.json();
}

// Save header offer bar settings
async function saveHeaderOfferBar(formData) {
    const res = await fetch('/api/admin/header-offer-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to save header offer bar settings');
    return res.json();
}

// Load header offer bar settings into form
async function loadHeaderOfferBarSettings() {
    try {
        const settings = await fetchHeaderOfferBar();
        if (settings) {
            document.getElementById('header-offer-text').value = settings.offerText || '';
            document.getElementById('header-offer-button-text').value = settings.buttonText || '';
            document.getElementById('header-offer-start-date').value = settings.startDate || '';
            document.getElementById('header-offer-end-date').value = settings.endDate || '';
            document.getElementById('header-offer-status').value = settings.status || 'active';
            document.getElementById('header-offer-background-color').value = settings.backgroundColor || '#ffc107';
            document.getElementById('header-offer-text-color').value = settings.textColor || '#ffffff';
            
            // Update preview
            updateHeaderOfferPreview();
        }
    } catch (err) {
        console.error('Error loading header offer bar settings:', err);
    }
}

// Update the preview of the header offer bar
function updateHeaderOfferPreview() {
    const offerText = document.getElementById('header-offer-text').value || 'SPECIAL OFFER Get 25% off premium office furniture collections - Limited time offer ending soon!';
    const buttonText = document.getElementById('header-offer-button-text').value || 'Shop Now';
    const backgroundColor = document.getElementById('header-offer-background-color').value || '#ffc107';
    const textColor = document.getElementById('header-offer-text-color').value || '#ffffff';
    
    const preview = document.getElementById('header-offer-preview');
    const previewText = document.getElementById('preview-offer-text');
    const previewButton = document.getElementById('preview-button-text');
    
    if (preview && previewText && previewButton) {
        preview.style.backgroundColor = backgroundColor;
        preview.style.color = textColor;
        previewText.textContent = offerText;
        previewButton.textContent = buttonText;
    }
}

// Handle header offer bar form submit
async function handleHeaderOfferFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Collect form data as an object
    const formData = {
        offerText: form.querySelector('[name="offerText"]').value,
        buttonText: form.querySelector('[name="buttonText"]').value,
        startDate: form.querySelector('[name="startDate"]').value,
        endDate: form.querySelector('[name="endDate"]').value,
        status: form.querySelector('[name="status"]').value,
        backgroundColor: form.querySelector('[name="backgroundColor"]').value,
        textColor: form.querySelector('[name="textColor"]').value
    };
    
    const statusDiv = document.getElementById('header-offer-status-message');
    
    try {
        await saveHeaderOfferBar(formData);
        statusDiv.innerHTML = '<p style="color: green; margin-top: 1em;">Header offer bar settings saved successfully!</p>';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (err) {
        statusDiv.innerHTML = '<p style="color: red; margin-top: 1em;">Failed to save header offer bar settings.</p>';
    }
}

// --- Gallery Management ---

// Fetch gallery images from backend
async function fetchGalleryImages() {
    const res = await fetch('/api/admin/projects');
    if (!res.ok) throw new Error('Failed to fetch gallery images');
    return res.json();
}

// Add a new gallery image
async function addGalleryImage(formData) {
    const res = await fetch('/api/admin/projects', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to add gallery image');
    return res.json();
}

// Update a gallery image
async function updateGalleryImage(id, formData) {
    const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PUT',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to update gallery image');
    return res.json();
}

// Delete a gallery image
async function deleteGalleryImage(id) {
    const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete gallery image');
    return res.json();
}

// Render gallery images in the admin tab
async function renderGalleryAdmin() {
    const container = document.getElementById('gallery-status');
    if (!container) return;
    
    container.innerHTML = 'Loading...';
    try {
        const images = await fetchGalleryImages();
        if (images.length === 0) {
            container.innerHTML = '<p>No projects yet.</p>';
            return;
        }
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5em;">
                ${images.map(img => `
                    <div class="gallery-admin-item" style="border: 1px solid #ddd; padding: 1.5em; border-radius: 8px; background: white;">
                        <div style="margin-bottom: 1em;">
                            <img src="${img.mainImageUrl}" alt="${img.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px;">
                        </div>
                        <h4 style="margin: 0 0 0.5em 0; color: #333;">${img.title}</h4>
                        <p style="margin: 0 0 1em 0; color: #666; font-size: 0.9em;"><strong>Description:</strong> ${img.description || 'No description'}</p>
                        
                        <div style="margin-bottom: 1em;">
                            <strong style="color: #333; font-size: 0.9em;">Thumbnails (${img.thumbnailUrls ? img.thumbnailUrls.length : 0}):</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5em; margin-top: 0.5em;">
                                ${img.thumbnailUrls && img.thumbnailUrls.length > 0 ? 
                                    img.thumbnailUrls.map(thumb => `
                                        <img src="${thumb}" alt="Thumbnail" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                                    `).join('') : 
                                    '<span style="color: #999; font-size: 0.8em;">No thumbnails</span>'
                                }
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 0.5em;">
                            <button onclick="editGalleryItem('${img.id}')" style="background: #007bff; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Edit</button>
                            <button onclick="deleteGalleryHandler('${img.id}')" style="background: #dc3545; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p style="color:red">Error loading projects.</p>';
    }
}

// Edit gallery item - populate form with existing data
async function editGalleryItem(id) {
    try {
        // Fetch gallery item data
        const response = await fetch(`/api/admin/projects/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch gallery item');
        }
        const item = await response.json();
        
        // Populate the form with existing data
        document.getElementById('gallery-title').value = item.title || '';
        document.getElementById('gallery-description').value = item.description || '';
        
        // Set the form to edit mode
        const form = document.getElementById('gallery-form');
        form.setAttribute('data-edit-id', id);
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Update Project';
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        
        // Show current main image if exists
        if (item.mainImageUrl) {
            const currentImageDiv = document.getElementById('current-main-image');
            if (currentImageDiv) {
                currentImageDiv.innerHTML = `
                    <p><strong>Current Main Image:</strong></p>
                    <img src="${item.mainImageUrl}" alt="Current main image" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;">
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading gallery item for edit:', error);
        alert('Failed to load gallery item for editing. Please try again.');
    }
}

// Handle gallery form submit
async function handleGalleryFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    // Check if this is an edit operation
    const editId = form.getAttribute('data-edit-id');
    const isEdit = editId !== null;
    
    // For new items, validate that main image is selected
    if (!isEdit) {
        const mainImage = formData.get('mainImage');
        if (!mainImage || mainImage.size === 0) {
            alert('Please select a main image.');
            return;
        }
    }
    
    // Validate that title is provided
    const title = formData.get('title');
    if (!title) {
        alert('Please provide a title.');
        return;
    }
    
    try {
        if (isEdit) {
            // Update existing gallery item
            await updateGalleryImage(editId, formData);
            alert('Project updated successfully!');
        } else {
            // Add new gallery item
            await addGalleryImage(formData);
            alert('Project added successfully!');
        }
        
        // Reset form and clear edit mode
        form.reset();
        form.removeAttribute('data-edit-id');
        
        // Reset submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Project';
        
        // Clear thumbnail preview
        const thumbnailPreview = document.getElementById('thumbnail-preview-container');
        if (thumbnailPreview) {
            thumbnailPreview.innerHTML = '<span id="no-thumbnails-text">No thumbnails selected</span>';
        }
        
        // Clear current image display
        const currentImageDiv = document.getElementById('current-main-image');
        if (currentImageDiv) {
            currentImageDiv.innerHTML = '';
        }
        
        renderGalleryAdmin();
    } catch (err) {
        alert(`Failed to ${isEdit ? 'update' : 'add'} project: ` + err.message);
    }
}

// Delete gallery handler
async function deleteGalleryHandler(id) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
        await deleteGalleryImage(id);
        renderGalleryAdmin();
        alert('Project deleted successfully!');
    } catch (err) {
        alert('Failed to delete project: ' + err.message);
    }
}

// Thumbnail preview functionality
function setupThumbnailPreview() {
    const thumbnailInput = document.getElementById('gallery-thumbnails');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function(e) {
            const files = e.target.files;
            const previewContainer = document.getElementById('thumbnail-preview-container');
            const noThumbnailsText = document.getElementById('no-thumbnails-text');
            
            if (files.length > 0) {
                // Hide "no thumbnails" text
                if (noThumbnailsText) noThumbnailsText.style.display = 'none';
                
                // Clear existing preview
                previewContainer.innerHTML = '';
                
                // Show preview for each selected file
                Array.from(files).forEach((file, index) => {
                    if (index >= 8) return; // Limit to 8 images
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.width = '80px';
                        img.style.height = '60px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '4px';
                        img.style.border = '1px solid #ddd';
                        img.alt = `Thumbnail ${index + 1}`;
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
                
                // Show count
                const countText = document.createElement('div');
                countText.style.width = '100%';
                countText.style.textAlign = 'center';
                countText.style.marginTop = '0.5em';
                countText.style.fontSize = '0.8em';
                countText.style.color = '#666';
                countText.textContent = `${files.length} thumbnail(s) selected`;
                previewContainer.appendChild(countText);
            } else {
                // Show "no thumbnails" text
                if (noThumbnailsText) noThumbnailsText.style.display = 'block';
                previewContainer.innerHTML = '<span id="no-thumbnails-text">No thumbnails selected</span>';
            }
        });
    }
}

// --- About Us Management ---

// Fetch about us content from backend
async function fetchAboutUsContent() {
    const res = await fetch('/api/admin/about');
    if (!res.ok) throw new Error('Failed to fetch about us content');
    return res.json();
}

// Save about us content
async function saveAboutUsContent(formData) {
    const res = await fetch('/api/admin/about', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to save about us content');
    return res.json();
}

// Load about us content into form
async function loadAboutUsContent() {
    try {
        const content = await fetchAboutUsContent();
        if (content) {
            // Story Section
            document.getElementById('story-title').value = content.StoryTitle || '';
            document.getElementById('story-subtitle').value = content.StorySubtitle || '';
            document.getElementById('story-description').value = content.StoryDescription || '';
            document.getElementById('projects-count').value = content.ProjectsCount || '';
            document.getElementById('clients-count').value = content.ClientsCount || '';
            
            // Mission Section
            document.getElementById('mission-title').value = content.MissionTitle || '';
            document.getElementById('mission-description').value = content.MissionDescription || '';
            document.getElementById('feature-1').value = content.Feature1 || '';
            document.getElementById('feature-2').value = content.Feature2 || '';
            document.getElementById('feature-3').value = content.Feature3 || '';
            
            // Values Section
            document.getElementById('values-title').value = content.ValuesTitle || '';
            document.getElementById('value-1-title').value = content.Value1Title || '';
            document.getElementById('value-1-description').value = content.Value1Description || '';
            document.getElementById('value-2-title').value = content.Value2Title || '';
            document.getElementById('value-2-description').value = content.Value2Description || '';
            document.getElementById('value-3-title').value = content.Value3Title || '';
            document.getElementById('value-3-description').value = content.Value3Description || '';
            document.getElementById('value-4-title').value = content.Value4Title || '';
            document.getElementById('value-4-description').value = content.Value4Description || '';
            
            // Philosophy Section
            document.getElementById('philosophy-title').value = content.PhilosophyTitle || '';
            document.getElementById('philosophy-subtitle').value = content.PhilosophySubtitle || '';
            document.getElementById('philosophy-description').value = content.PhilosophyDescription || '';
            document.getElementById('typo-1-title').value = content.Typo1Title || '';
            document.getElementById('typo-1-description').value = content.Typo1Description || '';
            document.getElementById('typo-2-title').value = content.Typo2Title || '';
            document.getElementById('typo-2-description').value = content.Typo2Description || '';
            document.getElementById('typo-3-title').value = content.Typo3Title || '';
            document.getElementById('typo-3-description').value = content.Typo3Description || '';

            // Layout
            const layoutSelect = document.getElementById('about-layout');
            if (layoutSelect) layoutSelect.value = content.Layout || 'default';
        }
    } catch (err) {
        console.error('Error loading about us content:', err);
    }
}

// Handle about us form submit
async function handleAboutUsFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const statusDiv = document.getElementById('about-status');
    
    try {
        await saveAboutUsContent(formData);
        statusDiv.innerHTML = '<p style="color: green;">About Us content saved successfully!</p>';
    } catch (err) {
        statusDiv.innerHTML = '<p style="color: red;">Failed to save About Us content.</p>';
    }
}

// --- Testimonials Design Management ---

// Fetch testimonials design settings from backend
async function fetchTestimonialsDesignSettings() {
    const res = await fetch('/api/testimonials-design');
    if (!res.ok) throw new Error('Failed to fetch testimonials design settings');
    return res.json();
}

// Save testimonials design settings
async function saveTestimonialsDesignSettings(formData) {
    const res = await fetch('/api/admin/testimonials-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to save testimonials design settings');
    return res.json();
}

// Load testimonials design settings into form
async function loadTestimonialsDesignSettings() {
    try {
        const response = await fetchTestimonialsDesignSettings();
        const settings = response.success ? response : response;
        
        if (settings) {
            // Colors
            const bgColorEl = document.getElementById('testimonials-bg-color');
            const accentColorEl = document.getElementById('testimonials-accent-color');
            
            if (bgColorEl) bgColorEl.value = settings.bgColor || '#f8f9fa';
            if (accentColorEl) accentColorEl.value = settings.accentColor || '#F0B21B';
            
            // Display Options
            const showRatingEl = document.getElementById('testimonials-show-rating');
            const showImageEl = document.getElementById('testimonials-show-image');
            const showTitleEl = document.getElementById('testimonials-show-title');
            const showQuoteIconEl = document.getElementById('testimonials-show-quote-icon');
            
            if (showRatingEl) showRatingEl.checked = settings.showRating !== false;
            if (showImageEl) showImageEl.checked = settings.showImage !== false;
            if (showTitleEl) showTitleEl.checked = settings.showTitle !== false;
            if (showQuoteIconEl) showQuoteIconEl.checked = settings.showQuoteIcon !== false;
            
            // Update preview
            updateTestimonialsPreview();
        }
    } catch (err) {
        console.error('Error loading testimonials design settings:', err);
        // Use default values if loading fails
        console.log('Using default testimonials design settings');
    }
}

// Update the preview of the testimonials
function updateTestimonialsPreview() {
    const bgColor = document.getElementById('testimonials-bg-color')?.value || '#f8f9fa';
    const accentColor = document.getElementById('testimonials-accent-color')?.value || '#F0B21B';
    const showRating = document.getElementById('testimonials-show-rating')?.checked !== false;
    const showImage = document.getElementById('testimonials-show-image')?.checked !== false;
    const showTitle = document.getElementById('testimonials-show-title')?.checked !== false;
    const showQuoteIcon = document.getElementById('testimonials-show-quote-icon')?.checked !== false;
    
    const previewContainer = document.getElementById('testimonials-preview');
    const previewContent = document.getElementById('testimonials-preview-content');
    
    if (previewContainer && previewContent) {
        // Apply container styles
        previewContainer.style.backgroundColor = bgColor;
        
        // Generate preview content that matches the current frontend design exactly
        const previewHTML = generateModernTestimonialsPreview(bgColor, accentColor, showRating, showImage, showTitle, showQuoteIcon);
        previewContent.innerHTML = previewHTML;
    }
}

// Generate modern testimonials preview that matches the current frontend design exactly
function generateModernTestimonialsPreview(bgColor, accentColor, showRating, showImage, showTitle, showQuoteIcon) {
    return `
        <!-- Modern testimonials preview - Exact match to frontend -->
        <div style="text-align: center; margin-bottom: 60px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 2px; background: ${accentColor}; border-radius: 1px;"></div>
                <span style="font-size: 14px; font-weight: 600; color: #6b7280; letter-spacing: 0.5px; text-transform: uppercase;">Testimonial</span>
            </div>
            <h2 style="font-size: 48px; font-weight: 700; color: #1f2937; margin: 0; line-height: 1.2;">
                What Our <span style="color: ${accentColor};">Clients Say</span>
            </h2>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 40px;">
            <!-- Testimonial Card 1 -->
            <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); position: relative; transition: all 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.05);">
                ${showQuoteIcon ? `<!-- Quote Icon -->
                <div style="position: absolute; top: 24px; right: 24px; width: 40px; height: 40px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 16px;">"</div>` : ''}
                
                <!-- Client Profile -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    ${showImage ? `<div style="position: relative; flex-shrink: 0;">
                        <div style="position: absolute; top: -8px; left: -8px; width: 80px; height: 80px; background: ${accentColor}; border-radius: 50% 50% 50% 0; z-index: 1;"></div>
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: #e5e7eb; border: 3px solid ${accentColor}; position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 24px; font-weight: bold; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">👤</div>
                    </div>` : ''}
                    <div style="flex: 1;">
                        <h4 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; line-height: 1.3;">Leslie Alexander</h4>
                        ${showTitle ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; font-weight: 500;">Architecture</p>` : ''}
                        ${showRating ? `<div style="display: flex; align-items: center; gap: 8px;">
                            <div style="display: flex; gap: 2px;">
                                <span style="color: ${accentColor}; font-size: 14px;">★★★★★</span>
                            </div>
                            <span style="font-size: 14px; font-weight: 600; color: #1f2937;">5.0</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Testimonial Text -->
                <div style="margin-top: 20px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0; font-style: italic;">"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis."</p>
                </div>
            </div>
            
            <!-- Testimonial Card 2 -->
            <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); position: relative; transition: all 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.05);">
                ${showQuoteIcon ? `<!-- Quote Icon -->
                <div style="position: absolute; top: 24px; right: 24px; width: 40px; height: 40px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 16px;">"</div>` : ''}
                
                <!-- Client Profile -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    ${showImage ? `<div style="position: relative; flex-shrink: 0;">
                        <div style="position: absolute; top: -8px; left: -8px; width: 80px; height: 80px; background: ${accentColor}; border-radius: 50% 50% 50% 0; z-index: 1;"></div>
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: #e5e7eb; border: 3px solid ${accentColor}; position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 24px; font-weight: bold; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">👤</div>
                    </div>` : ''}
                    <div style="flex: 1;">
                        <h4 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; line-height: 1.3;">Jenny Wilson</h4>
                        ${showTitle ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; font-weight: 500;">Interior Designer</p>` : ''}
                        ${showRating ? `<div style="display: flex; align-items: center; gap: 8px;">
                            <div style="display: flex; gap: 2px;">
                                <span style="color: ${accentColor}; font-size: 14px;">★★★★★</span>
                            </div>
                            <span style="font-size: 14px; font-weight: 600; color: #1f2937;">5.0</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Testimonial Text -->
                <div style="margin-top: 20px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0; font-style: italic;">"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis."</p>
                </div>
            </div>
        </div>
        
        <!-- Navigation Indicators - Exact match to frontend -->
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 40px;">
            <div style="width: 40px; height: 4px; border: none; background: ${accentColor}; border-radius: 2px; cursor: pointer; transition: all 0.3s ease;"></div>
            <div style="width: 40px; height: 4px; border: none; background: #d1d5db; border-radius: 2px; cursor: pointer; transition: all 0.3s ease;"></div>
            <div style="width: 40px; height: 4px; border: none; background: #d1d5db; border-radius: 2px; cursor: pointer; transition: all 0.3s ease;"></div>
        </div>
    `;
}


// Handle testimonials design form submit
async function handleTestimonialsDesignFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Collect form data as an object - simplified to match current design
    const formData = {
        bgColor: form.querySelector('[name="bgColor"]').value,
        accentColor: form.querySelector('[name="accentColor"]').value,
        showRating: form.querySelector('[name="showRating"]').checked,
        showImage: form.querySelector('[name="showImage"]').checked,
        showTitle: form.querySelector('[name="showTitle"]').checked,
        showQuoteIcon: form.querySelector('[name="showQuoteIcon"]').checked
    };
    
    const statusDiv = document.getElementById('testimonials-design-status-message');
    
    try {
        await saveTestimonialsDesignSettings(formData);
        statusDiv.innerHTML = '<p style="color: green; margin-top: 1em;">Testimonials settings saved successfully!</p>';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (err) {
        statusDiv.innerHTML = '<p style="color: red; margin-top: 1em;">Failed to save testimonials settings.</p>';
    }
}

// --- Hero Banner Management ---

// Fetch hero banner settings from backend
async function fetchHeroBannerSettings() {
    const res = await fetch('/api/admin/hero-banner');
    if (!res.ok) throw new Error('Failed to fetch hero banner settings');
    return res.json();
}

// Save hero banner settings
async function saveHeroBannerSettings(formData) {
    const res = await fetch('/api/admin/hero-banner', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to save hero banner settings');
    return res.json();
}

// Load hero banner settings into form
async function loadHeroBannerSettings() {
    try {
        const settings = await fetchHeroBannerSettings();
        if (settings) {
            // Content
            document.getElementById('hero-main-heading').value = settings.mainHeading || '';
            document.getElementById('hero-description-line1').value = settings.descriptionLine1 || '';
            document.getElementById('hero-description-line2').value = settings.descriptionLine2 || '';
            document.getElementById('hero-button-text').value = settings.buttonText || '';
            document.getElementById('hero-button-link').value = settings.buttonLink || '';
            document.getElementById('hero-button2-text').value = settings.button2Text || '';
            document.getElementById('hero-button2-link').value = settings.button2Link || '';
            
            // Colors
            document.getElementById('hero-text-color').value = settings.textColor || '#ffffff';
            document.getElementById('hero-button-bg-color').value = settings.buttonBgColor || '#F0B21B';
            document.getElementById('hero-button-text-color').value = settings.buttonTextColor || '#333333';
            document.getElementById('hero-button2-bg-color').value = settings.button2BgColor || '#6c757d';
            document.getElementById('hero-button2-text-color').value = settings.button2TextColor || '#ffffff';
            
            // Update preview
            updateHeroBannerPreview();
            
            // Update image preview
            updateHeroImagesPreview(settings.heroBannerImages);
        }
    } catch (err) {
        console.error('Error loading hero banner settings:', err);
    }
}

// Update the preview of the hero banner
function updateHeroBannerPreview() {
    const mainHeading = document.getElementById('hero-main-heading').value || 'Transform Your Workspace with';
    const descriptionLine1 = document.getElementById('hero-description-line1').value || 'Discover our curated collection of ergonomic chairs, modern desks, and storage solutions designed to enhance productivity and comfort in your office.';
    const descriptionLine2 = document.getElementById('hero-description-line2').value || 'Premium Office Furniture';
    const buttonText = document.getElementById('hero-button-text').value || 'Shop Now';
    const button2Text = document.getElementById('hero-button2-text').value || 'Custom Design';
    const textColor = document.getElementById('hero-text-color').value || '#ffffff';
    const buttonBgColor = document.getElementById('hero-button-bg-color').value || '#F0B21B';
    const buttonTextColor = document.getElementById('hero-button-text-color').value || '#333333';
    const button2BgColor = document.getElementById('hero-button2-bg-color').value || '#6c757d';
    const button2TextColor = document.getElementById('hero-button2-text-color').value || '#ffffff';
    
    // Update preview content
    const previewMainText = document.getElementById('preview-hero-main-text');
    const previewHighlight = document.getElementById('preview-hero-highlight');
    const previewDesc1 = document.getElementById('preview-hero-desc1');
    const previewButton = document.getElementById('preview-hero-button');
    const previewButton2 = document.getElementById('preview-hero-button2');
    
    if (previewMainText) previewMainText.textContent = mainHeading;
    if (previewHighlight) previewHighlight.textContent = descriptionLine2;
    if (previewDesc1) previewDesc1.textContent = descriptionLine1;
    if (previewButton) {
        previewButton.textContent = buttonText;
        previewButton.style.backgroundColor = buttonBgColor;
        previewButton.style.color = buttonTextColor;
    }
    if (previewButton2) {
        previewButton2.textContent = button2Text;
        previewButton2.style.backgroundColor = button2BgColor;
        previewButton2.style.color = button2TextColor;
    }
    
    // Update preview container text color
    const previewContainer = document.getElementById('hero-banner-preview');
    if (previewContainer) {
        previewContainer.style.color = textColor;
    }
}

// Update hero images preview
function updateHeroImagesPreview(imageUrls) {
    const previewContainer = document.getElementById('hero-images-preview');
    const imagesContainer = document.getElementById('hero-images-container');
    const noImagesText = document.getElementById('no-hero-images-text');
    const removeBtn = document.getElementById('remove-hero-images-btn');
    
    if (imageUrls && imageUrls.length > 0) {
        // Show images container
        imagesContainer.style.display = 'block';
        noImagesText.style.display = 'none';
        removeBtn.style.display = 'inline-block';
        
        // Clear and populate images
        imagesContainer.innerHTML = imageUrls.map((url, index) => `
            <div style="position: relative; display: inline-block;">
                <img src="${url}" alt="Hero banner image ${index + 1}" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #ddd;">
                <span style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px;">${index + 1}</span>
            </div>
        `).join('');
        
        // Update carousel preview
        updateHeroCarouselPreview(imageUrls);
    } else {
        // Hide images container
        imagesContainer.style.display = 'none';
        noImagesText.style.display = 'block';
        removeBtn.style.display = 'none';
        
        // Remove carousel background
        const carouselPreview = document.getElementById('preview-hero-carousel');
        if (carouselPreview) {
            carouselPreview.style.backgroundImage = 'none';
            carouselPreview.style.backgroundColor = '#ffc107';
        }
        
        // Hide carousel dots
        const dotsContainer = document.getElementById('preview-carousel-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
        }
    }
}

// Update hero carousel preview
function updateHeroCarouselPreview(imageUrls) {
    const carouselPreview = document.getElementById('preview-hero-carousel');
    const dotsContainer = document.getElementById('preview-carousel-dots');
    
    if (!carouselPreview || !dotsContainer) return;
    
    if (imageUrls && imageUrls.length > 0) {
        // Set first image as background
        carouselPreview.style.backgroundImage = `url(${imageUrls[0]})`;
        carouselPreview.style.backgroundColor = 'transparent';
        
        // Create minimal navigation dots
        dotsContainer.innerHTML = imageUrls.map((_, index) => `
            <button class="carousel-dot ${index === 0 ? 'active' : ''}" 
                 onclick="switchCarouselImage(${index})" 
                 style="width: 8px; height: 8px; border-radius: 50%; border: none; background: ${index === 0 ? '#F0B21B' : 'rgba(255,255,255,0.4)'}; cursor: pointer; transition: all 0.3s ease; padding: 0; outline: none;"></button>
        `).join('');
        
        // Start auto-rotation if multiple images
        if (imageUrls.length > 1) {
            startCarouselRotation(imageUrls);
        }
    }
}

// Switch carousel image
function switchCarouselImage(index) {
    const carouselPreview = document.getElementById('preview-hero-carousel');
    const dots = document.querySelectorAll('.carousel-dot');
    const imageUrls = window.currentHeroImages || [];
    
    if (carouselPreview && imageUrls[index]) {
        carouselPreview.style.backgroundImage = `url(${imageUrls[index]})`;
        window.currentCarouselIndex = index;
        
        // Update active dot
        dots.forEach((dot, i) => {
            dot.style.background = i === index ? '#F0B21B' : 'rgba(255,255,255,0.4)';
            dot.style.transform = i === index ? 'scale(1.3)' : 'scale(1)';
            dot.classList.toggle('active', i === index);
        });
    }
}

// Start carousel rotation
function startCarouselRotation(imageUrls) {
    if (window.carouselInterval) {
        clearInterval(window.carouselInterval);
    }
    
    if (imageUrls.length <= 1) return;
    
    window.currentHeroImages = imageUrls;
    window.currentCarouselIndex = 0;
    
    window.carouselInterval = setInterval(() => {
        window.currentCarouselIndex = (window.currentCarouselIndex + 1) % imageUrls.length;
        switchCarouselImage(window.currentCarouselIndex);
    }, 5000); // Change every 5 seconds to match frontend
}

// Handle hero banner form submit
async function handleHeroBannerFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const statusDiv = document.getElementById('hero-banner-status-message');
    statusDiv.innerHTML = '<p style="color: #007bff;">Saving hero banner settings...</p>';
    
    try {
        const result = await saveHeroBannerSettings(formData);
        statusDiv.innerHTML = '<p style="color: green; margin-top: 1em;">Hero banner settings saved successfully!</p>';
        
        // Update preview
        updateHeroBannerPreview();
        
        // Update image preview if new image was uploaded
        if (result.heroBannerImages) {
            updateHeroImagesPreview(result.heroBannerImages);
        }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (err) {
        statusDiv.innerHTML = '<p style="color: red; margin-top: 1em;">Failed to save hero banner settings.</p>';
    }
}

// Remove hero banner images
async function removeHeroBannerImages() {
    if (!confirm('Are you sure you want to remove the hero banner image?')) return;
    
    try {
        const res = await fetch('/api/admin/hero-banner', {
            method: 'DELETE',
        });
        
        if (res.ok) {
            updateHeroImagesPreview(null);
            document.getElementById('hero-banner-status-message').innerHTML = '<p style="color: green;">Hero banner images removed successfully!</p>';
            
            setTimeout(() => {
                document.getElementById('hero-banner-status-message').innerHTML = '';
            }, 3000);
        }
    } catch (err) {
        document.getElementById('hero-banner-status-message').innerHTML = '<p style="color: red;">Error removing hero banner image.</p>';
    }
}

// --- Header Banner Management ---

// Fetch header banner settings from backend
async function fetchHeaderBannerSettings() {
    const res = await fetch('/api/admin/header-banner');
    if (!res.ok) throw new Error('Failed to fetch header banner settings');
    return res.json();
}

// Save header banner settings
async function saveHeaderBannerSettings(formData) {
    const res = await fetch('/api/admin/header-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to save header banner settings');
    return res.json();
}

// Load header banner settings into form
async function loadHeaderBannerSettings() {
    try {
        const settings = await fetchHeaderBannerSettings();
        if (settings) {
            // Main Header Row Colors
            document.getElementById('main-bg-color').value = settings.mainBgColor || '#ffffff';
            document.getElementById('main-text-color').value = settings.mainTextColor || '#333333';
            
            // Contact Information Colors
            document.getElementById('contact-text-color').value = settings.contactTextColor || '#6c757d';
            document.getElementById('contact-icon-color').value = settings.contactIconColor || '#F0B21B';
            
            // Navigation Bar Colors
            document.getElementById('nav-bg-color').value = settings.navBgColor || '#F0B21B';
            document.getElementById('nav-text-color').value = settings.navTextColor || '#333333';
            document.getElementById('nav-hover-color').value = settings.navHoverColor || '#d69e16';
            
            // Search Bar Colors
            document.getElementById('search-border-color').value = settings.searchBorderColor || '#ffc107';
            document.getElementById('search-btn-color').value = settings.searchBtnColor || '#ffc107';
            
            // Icon Colors
            document.getElementById('icon-color').value = settings.iconColor || '#F0B21B';
            
            // Contact Information Content
            document.getElementById('contact-email').value = settings.contactEmail || 'designexcellence1@gmail.com';
            document.getElementById('contact-phone').value = settings.contactPhone || '(02) 413-6682';
            document.getElementById('contact-address').value = settings.contactAddress || '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City';
            
            // Contact Information Display Settings
            document.getElementById('contact-font-size').value = settings.contactFontSize || '0.6rem';
            document.getElementById('contact-spacing').value = settings.contactSpacing || '0.8rem';
            document.getElementById('contact-show-icons').checked = settings.contactShowIcons !== false;
            
            // Search Settings
            document.getElementById('search-placeholder').value = settings.searchPlaceholder || 'Search';
            
            // Update preview
            updateHeaderBannerPreview();
        }
    } catch (err) {
        console.error('Error loading header banner settings:', err);
    }
}

// Update the preview of the header banner
function updateHeaderBannerPreview() {
    // Main Header Row Preview
    const mainBgColor = document.getElementById('main-bg-color').value || '#ffffff';
    const mainTextColor = document.getElementById('main-text-color').value || '#333333';
    
    const previewMainRow = document.getElementById('preview-main-row');
    if (previewMainRow) {
        previewMainRow.style.backgroundColor = mainBgColor;
        previewMainRow.style.color = mainTextColor;
    }
    
    // Contact Information Preview (in main header)
    const contactTextColor = document.getElementById('contact-text-color').value || '#6c757d';
    const contactIconColor = document.getElementById('contact-icon-color').value || '#F0B21B';
    const contactFontSize = document.getElementById('contact-font-size').value || '0.6rem';
    const contactSpacing = document.getElementById('contact-spacing').value || '0.8rem';
    const contactShowIcons = document.getElementById('contact-show-icons').checked;
    
    const previewMainLeft = document.getElementById('preview-main-left');
    if (previewMainLeft) {
        previewMainLeft.style.color = contactTextColor;
        previewMainLeft.style.fontSize = contactFontSize;
        previewMainLeft.style.gap = contactSpacing;
        
        // Update contact items
        const contactItems = previewMainLeft.querySelectorAll('span');
        contactItems.forEach(item => {
            item.style.color = contactTextColor;
            if (contactShowIcons) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Navigation Row Preview
    const navBgColor = document.getElementById('nav-bg-color').value || '#343a40';
    const navTextColor = document.getElementById('nav-text-color').value || '#ffffff';
    
    const previewNavRow = document.getElementById('preview-nav-row');
    if (previewNavRow) {
        previewNavRow.style.backgroundColor = navBgColor;
        previewNavRow.style.color = navTextColor;
    }
    
    // Search Bar Preview
    const searchBorderColor = document.getElementById('search-border-color').value || '#ffc107';
    const searchBtnColor = document.getElementById('search-btn-color').value || '#ffc107';
    
    const searchBarPreview = document.querySelector('#preview-main-row div[style*="border"]');
    if (searchBarPreview) {
        searchBarPreview.style.borderColor = searchBorderColor;
    }
    
    // Update contact information in preview
    const contactEmail = document.getElementById('contact-email').value || 'designexcellence1@gmail.com';
    const contactPhone = document.getElementById('contact-phone').value || '(02) 413-6682';
    const contactAddress = document.getElementById('contact-address').value || '#1 Binmaka Street Cor. Biak na Bato Brgy. Manresa, Quezon City';
    
    const previewEmail = document.getElementById('preview-email');
    const previewPhone = document.getElementById('preview-phone');
    const previewAddress = document.getElementById('preview-address');
    
    if (previewEmail) previewEmail.textContent = `✉️ ${contactEmail}`;
    if (previewPhone) previewPhone.textContent = `📞 ${contactPhone}`;
    if (previewAddress) previewAddress.textContent = `📍 ${contactAddress}`;
    
    // Update icon colors in preview
    const iconColor = document.getElementById('icon-color').value || '#F0B21B';
    const previewUserIcon = document.getElementById('preview-user-icon');
    const previewCartIcon = document.getElementById('preview-cart-icon');
    const previewMailIcon = document.getElementById('preview-mail-icon');
    const previewSearchIcon = document.getElementById('preview-search-icon');
    
    if (previewUserIcon) previewUserIcon.style.color = iconColor;
    if (previewCartIcon) previewCartIcon.style.color = iconColor;
    if (previewMailIcon) previewMailIcon.style.color = iconColor;
    if (previewSearchIcon) previewSearchIcon.style.color = iconColor;
    
    // Search placeholder
    const searchPlaceholder = document.getElementById('search-placeholder').value || 'Search';
    const previewSearchInput = document.getElementById('preview-search-input');
    if (previewSearchInput) previewSearchInput.placeholder = searchPlaceholder;
    
    // Update search container border color
    const previewSearchContainer = document.getElementById('preview-search-container');
    if (previewSearchContainer) previewSearchContainer.style.borderColor = searchBorderColor;
}

// Handle header banner form submit
async function handleHeaderBannerFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Collect form data as an object
    const formData = {
        contactBgColor: form.querySelector('[name="contactBgColor"]')?.value || '',
        mainBgColor: form.querySelector('[name="mainBgColor"]').value,
        mainTextColor: form.querySelector('[name="mainTextColor"]').value,
        contactTextColor: form.querySelector('[name="contactTextColor"]').value,
        iconColor: form.querySelector('[name="contactIconColor"]')?.value || form.querySelector('[name="iconColor"]')?.value || '',
        navBgColor: form.querySelector('[name="navBgColor"]').value,
        navTextColor: form.querySelector('[name="navTextColor"]').value,
        navHoverColor: form.querySelector('[name="navHoverColor"]').value,
        searchBorderColor: form.querySelector('[name="searchBorderColor"]').value,
        searchBtnColor: form.querySelector('[name="searchBtnColor"]').value,
        contactEmail: form.querySelector('[name="contactEmail"]')?.value || '',
        contactPhone: form.querySelector('[name="contactPhone"]')?.value || '',
        contactAddress: form.querySelector('[name="contactAddress"]')?.value || '',
        searchPlaceholder: form.querySelector('[name="searchPlaceholder"]')?.value || ''
    };
    
    const statusDiv = document.getElementById('header-banner-status-message');
    
    try {
        await saveHeaderBannerSettings(formData);
        statusDiv.innerHTML = '<p style="color: green; margin-top: 1em;">Header settings saved successfully!</p>';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (err) {
        statusDiv.innerHTML = '<p style="color: red; margin-top: 1em;">Failed to save header settings.</p>';
    }
}

// --- Auto Messages (FAQs) Management ---
async function fetchAutoMessages() {
	const res = await fetch('/api/admin/auto-messages');
	if (!res.ok) throw new Error('Failed to fetch auto messages');
	return res.json();
}

async function createAutoMessage(payload) {
	const res = await fetch('/api/admin/auto-messages', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to create auto message');
	return res.json();
}

async function updateAutoMessage(id, payload) {
	const res = await fetch(`/api/admin/auto-messages/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to update auto message');
	return res.json();
}

async function deleteAutoMessage(id) {
	const res = await fetch(`/api/admin/auto-messages/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete auto message');
	return res.json();
}

async function renderAutoMessagesList() {
	const container = document.getElementById('auto-messages-list');
	if (!container) return;
	container.innerHTML = 'Loading...';
	try {
		const data = await fetchAutoMessages();
		const items = (data && data.items) || [];
		if (items.length === 0) {
			container.innerHTML = '<p>No automated messages yet.</p>';
			return;
		}
		container.innerHTML = items.map(item => `
			<div class="auto-item" style="border:1px solid #e9ecef; padding:10px; border-radius:6px; margin-bottom:8px;">
				<div style="display:flex; justify-content:space-between; align-items:center;">
					<div>
						<strong>${item.Question}</strong>
						<div style="color:#666; font-size:0.9em;">${item.Answer}</div>
						<div style="color:#999; font-size:0.85em;">Keywords: ${item.Keywords || '-'}</div>
						<div style="color:${item.IsActive ? '#28a745' : '#dc3545'}; font-weight:600;">${item.IsActive ? 'Active' : 'Inactive'}</div>
					</div>
					<div>
						<button onclick="editAutoMessage(${item.ID})" style="margin-right:6px;">Edit</button>
						<button onclick="removeAutoMessage(${item.ID})" style="background:#dc3545; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Delete</button>
					</div>
				</div>
			</div>
		`).join('');
	} catch (err) {
		container.innerHTML = '<p style="color:red">Error loading automated messages.</p>';
	}
}

window.editAutoMessage = function(id) {
	const row = document.querySelector(`#auto-messages-list .auto-item button[onclick="editAutoMessage(${id})"]`).closest('.auto-item');
	const q = row.querySelector('strong').textContent;
	const a = row.querySelector('div div').textContent;
	const k = (row.querySelector('div div:nth-child(3)')?.textContent || '').replace('Keywords: ', '') || '';
	const activeText = row.querySelector('div div:nth-child(4)').textContent;
	const isActive = activeText.includes('Active');
	
	document.getElementById('auto-id').value = id;
	document.getElementById('auto-question').value = q;
	document.getElementById('auto-answer').value = a;
	document.getElementById('auto-keywords').value = k;
	document.getElementById('auto-active').checked = isActive;
};

window.removeAutoMessage = async function(id) {
	if (!confirm('Delete this automated message?')) return;
	try {
		await deleteAutoMessage(id);
		renderAutoMessagesList();
	} catch (err) {
		alert('Failed to delete.');
	}
};

async function handleAutoMessagesFormSubmit(e) {
	e.preventDefault();
	const id = document.getElementById('auto-id').value;
	const payload = {
		question: document.getElementById('auto-question').value,
		answer: document.getElementById('auto-answer').value,
		keywords: document.getElementById('auto-keywords').value,
		isActive: document.getElementById('auto-active').checked
	};
	const status = document.getElementById('auto-messages-status');
	status.textContent = 'Saving...';
	try {
		if (id) {
			await updateAutoMessage(parseInt(id), payload);
		} else {
			await createAutoMessage(payload);
		}
		status.textContent = 'Saved!';
		setTimeout(() => status.textContent = '', 1500);
		document.getElementById('auto-messages-form').reset();
		document.getElementById('auto-id').value = '';
		renderAutoMessagesList();
	} catch (err) {
		status.textContent = 'Failed to save.';
	}
}

// Hook into DOMContentLoaded
(function(){
	document.addEventListener('DOMContentLoaded', function(){
		const autoForm = document.getElementById('auto-messages-form');
		const autoReset = document.getElementById('auto-reset');
		if (autoForm) {
			autoForm.addEventListener('submit', handleAutoMessagesFormSubmit);
			renderAutoMessagesList();
		}
		if (autoReset) {
			autoReset.addEventListener('click', () => {
				document.getElementById('auto-messages-form').reset();
				document.getElementById('auto-id').value = '';
			});
		}
	});
})();

// --- Terms and Conditions Management ---

// Fetch terms and conditions from backend
async function fetchTermsAndConditions() {
    const res = await fetch('/api/admin/terms');
    if (!res.ok) throw new Error('Failed to fetch terms and conditions');
    return res.json();
}

// Save terms and conditions
async function saveTermsAndConditions(formData) {
    const res = await fetch('/api/admin/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}: Failed to save terms and conditions`);
    }
    
    return res.json();
}

// Load terms and conditions into form
async function loadTermsAndConditions() {
    try {
        const terms = await fetchTermsAndConditions();
        if (terms) {
            // Sign-up terms
            document.getElementById('signup-terms-title').value = terms.signupTermsTitle || '';
            document.getElementById('signup-terms-content').value = terms.signupTermsContent || '';
            document.getElementById('signup-terms-checkbox-text').value = terms.signupTermsCheckboxText || '';
            
            // Checkout terms
            document.getElementById('checkout-terms-title').value = terms.checkoutTermsTitle || '';
            document.getElementById('checkout-terms-content').value = terms.checkoutTermsContent || '';
            document.getElementById('checkout-terms-checkbox-text').value = terms.checkoutTermsCheckboxText || '';
            
            // General settings
            document.getElementById('terms-last-updated').value = terms.termsLastUpdated || '';
            document.getElementById('terms-version').value = terms.termsVersion || '';
            document.getElementById('terms-require-agreement').checked = terms.requireAgreement || false;
        }
    } catch (err) {
        console.error('Error loading terms and conditions:', err);
    }
}

// Handle terms and conditions form submit
async function handleTermsFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Collect form data as an object
    const formData = {
        signupTermsTitle: form.querySelector('[name="signupTermsTitle"]').value,
        signupTermsContent: form.querySelector('[name="signupTermsContent"]').value,
        signupTermsCheckboxText: form.querySelector('[name="signupTermsCheckboxText"]').value,
        checkoutTermsTitle: form.querySelector('[name="checkoutTermsTitle"]').value,
        checkoutTermsContent: form.querySelector('[name="checkoutTermsContent"]').value,
        checkoutTermsCheckboxText: form.querySelector('[name="checkoutTermsCheckboxText"]').value,
        termsLastUpdated: form.querySelector('[name="termsLastUpdated"]').value,
        termsVersion: form.querySelector('[name="termsVersion"]').value,
        requireAgreement: form.querySelector('[name="requireAgreement"]').checked
    };
    
    const statusDiv = document.getElementById('terms-status-message');
    statusDiv.innerHTML = '<p style="color: #007bff;">Saving terms and conditions...</p>';
    
    try {
        const result = await saveTermsAndConditions(formData);
        statusDiv.innerHTML = '<p style="color: green; margin-top: 1em;">Terms and conditions saved successfully!</p>';
        
        // Reload the terms to reflect the changes
        await loadTermsAndConditions();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (err) {
        console.error('Error saving terms:', err);
        statusDiv.innerHTML = '<p style="color: red; margin-top: 1em;">Failed to save terms and conditions: ' + (err.message || 'Unknown error') + '</p>';
    }
}

// --- Initialization for All Tabs ---
document.addEventListener('DOMContentLoaded', function() {
    // Testimonials
    const testimonialForm = document.getElementById('admin-testimonial-form');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', handleTestimonialFormSubmit);
        renderTestimonialsAdmin();
    }
    
    // Testimonials Design
    const testimonialsDesignForm = document.getElementById('testimonials-design-form');
    if (testimonialsDesignForm) {
        testimonialsDesignForm.addEventListener('submit', handleTestimonialsDesignFormSubmit);
        loadTestimonialsDesignSettings();
        
        // Add real-time preview updates for testimonials design
        const designInputs = [
            'testimonials-bg-color', 'testimonials-accent-color',
            'testimonials-show-rating', 'testimonials-show-image', 'testimonials-show-title', 'testimonials-show-quote-icon'
        ];
        designInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                if (input.type === 'checkbox') {
                    input.addEventListener('change', updateTestimonialsPreview);
                } else {
                    input.addEventListener('input', updateTestimonialsPreview);
                }
            }
        });
    }
    
    // Header Offer Bar
    const headerOfferForm = document.getElementById('header-offer-form');
    if (headerOfferForm) {
        headerOfferForm.addEventListener('submit', handleHeaderOfferFormSubmit);
        loadHeaderOfferBarSettings();
        
        // Add real-time preview updates
        const previewInputs = ['header-offer-text', 'header-offer-button-text', 'header-offer-background-color', 'header-offer-text-color'];
        previewInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateHeaderOfferPreview);
            }
        });
    }
    
    // Hero Banner
    const heroBannerForm = document.getElementById('hero-banner-form');
    if (heroBannerForm) {
        heroBannerForm.addEventListener('submit', handleHeroBannerFormSubmit);
        loadHeroBannerSettings();
        
        // Add real-time preview updates for hero banner
        const heroInputs = [
            'hero-main-heading', 'hero-description-line1', 'hero-description-line2',
            'hero-button-text', 'hero-button-link', 'hero-button2-text', 'hero-button2-link',
            'hero-text-color', 'hero-button-bg-color', 'hero-button-text-color',
            'hero-button2-bg-color', 'hero-button2-text-color'
        ];
        heroInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateHeroBannerPreview);
            }
        });
    }
    
    // Header Banner
    const headerBannerForm = document.getElementById('header-banner-form');
    if (headerBannerForm) {
        headerBannerForm.addEventListener('submit', handleHeaderBannerFormSubmit);
        loadHeaderBannerSettings();
        
        // Add real-time preview updates for banner colors
        const bannerColorInputs = [
            'main-bg-color', 'main-text-color', 'contact-text-color', 'contact-icon-color',
            'nav-bg-color', 'nav-text-color', 'nav-hover-color',
            'search-border-color', 'search-btn-color', 'icon-color',
            'contact-email', 'contact-phone', 'contact-address', 
            'contact-font-size', 'contact-spacing', 'contact-show-icons', 'search-placeholder'
        ];
        bannerColorInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                if (input.type === 'checkbox') {
                    input.addEventListener('change', updateHeaderBannerPreview);
                } else {
                    input.addEventListener('input', updateHeaderBannerPreview);
                }
            }
        });
    }
    
    // Gallery
    const galleryForm = document.getElementById('gallery-form');
    if (galleryForm) {
        galleryForm.addEventListener('submit', handleGalleryFormSubmit);
        renderGalleryAdmin();
        setupThumbnailPreview(); // Initialize thumbnail preview
    }
    
    // About Us
    const aboutForm = document.getElementById('about-form');
    if (aboutForm) {
        aboutForm.addEventListener('submit', handleAboutUsFormSubmit);
        loadAboutUsContent();
    }
    
    // Terms and Conditions
    const termsForm = document.getElementById('terms-form');
    if (termsForm) {
        termsForm.addEventListener('submit', handleTermsFormSubmit);
        loadTermsAndConditions();
    }
}); 