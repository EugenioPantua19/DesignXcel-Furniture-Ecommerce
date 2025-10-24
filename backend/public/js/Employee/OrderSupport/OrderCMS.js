// Order Support CMS JavaScript
// Handles content management system functionality for order manager users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize order manager CMS functionality
    initializeOrderCMS();
    
    // Load CMS data
    loadCMSData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeOrderCMS() {
    console.log('Initializing Order Support CMS...');
    
    // Order Support system - no permission checking needed
    // Initialize CMS-specific features
    initializeContentEditor();
    initializeMediaManager();
    initializePageManager();
    initializeTemplateManager();
}

function loadCMSData() {
    // Load content types
    loadContentTypes();
    
    // Load recent content
    loadRecentContent();
    
    // Load media library
    loadMediaLibrary();
    
    // Load page structure
    loadPageStructure();
}

function loadContentTypes() {
    fetch('/api/cms/content-types')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayContentTypes(data.contentTypes);
            }
        })
        .catch(error => {
            console.error('Error loading content types:', error);
        });
}

function displayContentTypes(contentTypes) {
    const container = document.getElementById('contentTypesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    contentTypes.forEach(type => {
        const typeElement = document.createElement('div');
        typeElement.className = 'content-type-item';
        typeElement.innerHTML = `
            <div class="type-header">
                <div class="type-name">${type.name}</div>
                <div class="type-count">${type.count} items</div>
            </div>
            <div class="type-description">${type.description}</div>
            <div class="type-actions">
                <button class="btn-view" data-type="${type.id}">View All</button>
                <button class="btn-create" data-type="${type.id}">Create New</button>
            </div>
        `;
        container.appendChild(typeElement);
    });
    
    // Add event listeners
    setupContentTypeActions();
}

function loadRecentContent() {
    fetch('/api/cms/recent-content')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRecentContent(data.content);
            }
        })
        .catch(error => {
            console.error('Error loading recent content:', error);
        });
}

function displayRecentContent(content) {
    const container = document.getElementById('recentContentList');
    if (!container) return;
    
    container.innerHTML = '';
    
    content.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'content-item';
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${item.title}</div>
                <div class="item-status status-${item.status}">${item.status}</div>
            </div>
            <div class="item-meta">
                <span class="item-type">${item.type}</span>
                <span class="item-author">By ${item.author}</span>
                <span class="item-date">${formatDate(item.updatedAt)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-edit" data-id="${item.id}">Edit</button>
                <button class="btn-preview" data-id="${item.id}">Preview</button>
                <button class="btn-delete" data-id="${item.id}">Delete</button>
            </div>
        `;
        container.appendChild(itemElement);
    });
    
    // Add event listeners
    setupContentActions();
}

function loadMediaLibrary() {
    fetch('/api/cms/media')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayMediaLibrary(data.media);
            }
        })
        .catch(error => {
            console.error('Error loading media library:', error);
        });
}

function displayMediaLibrary(media) {
    const container = document.getElementById('mediaLibraryList');
    if (!container) return;
    
    container.innerHTML = '';
    
    media.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'media-item';
        itemElement.innerHTML = `
            <div class="media-preview">
                ${item.type === 'image' ? 
                    `<img src="${item.url}" alt="${item.name}" style="width: 100%; height: 120px; object-fit: cover;">` :
                    `<div class="file-icon">📄</div>`
                }
            </div>
            <div class="media-info">
                <div class="media-name">${item.name}</div>
                <div class="media-size">${formatFileSize(item.size)}</div>
                <div class="media-date">${formatDate(item.uploadedAt)}</div>
            </div>
            <div class="media-actions">
                <button class="btn-use" data-url="${item.url}">Use</button>
                <button class="btn-delete" data-id="${item.id}">Delete</button>
            </div>
        `;
        container.appendChild(itemElement);
    });
    
    // Add event listeners
    setupMediaActions();
}

function loadPageStructure() {
    fetch('/api/cms/pages')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPageStructure(data.pages);
            }
        })
        .catch(error => {
            console.error('Error loading page structure:', error);
        });
}

function displayPageStructure(pages) {
    const container = document.getElementById('pageStructureList');
    if (!container) return;
    
    container.innerHTML = '';
    
    pages.forEach(page => {
        const pageElement = document.createElement('div');
        pageElement.className = 'page-item';
        pageElement.innerHTML = `
            <div class="page-header">
                <div class="page-title">${page.title}</div>
                <div class="page-status status-${page.status}">${page.status}</div>
            </div>
            <div class="page-meta">
                <span class="page-url">/${page.slug}</span>
                <span class="page-template">${page.template}</span>
                <span class="page-date">${formatDate(page.updatedAt)}</span>
            </div>
            <div class="page-actions">
                <button class="btn-edit" data-id="${page.id}">Edit</button>
                <button class="btn-preview" data-id="${page.id}">Preview</button>
                <button class="btn-publish" data-id="${page.id}">Publish</button>
            </div>
        `;
        container.appendChild(pageElement);
    });
    
    // Add event listeners
    setupPageActions();
}

function initializeContentEditor() {
    console.log('Content editor initialized');
    
    // Initialize rich text editor
    initializeRichTextEditor();
    
    // Setup content validation
    setupContentValidation();
}

function initializeRichTextEditor() {
    const editorElement = document.getElementById('contentEditor');
    if (editorElement) {
        // Initialize a simple rich text editor
        editorElement.contentEditable = true;
        editorElement.style.cssText = `
            min-height: 300px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 4px;
            font-family: Arial, sans-serif;
        `;
        
        // Add toolbar
        addEditorToolbar(editorElement);
    }
}

function addEditorToolbar(editorElement) {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.style.cssText = `
        border: 1px solid #ddd;
        border-bottom: none;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px 4px 0 0;
    `;
    
    toolbar.innerHTML = `
        <button type="button" class="btn-bold" title="Bold">B</button>
        <button type="button" class="btn-italic" title="Italic">I</button>
        <button type="button" class="btn-underline" title="Underline">U</button>
        <button type="button" class="btn-link" title="Link">🔗</button>
        <button type="button" class="btn-image" title="Image">🖼️</button>
        <button type="button" class="btn-list" title="List">•</button>
    `;
    
    editorElement.parentNode.insertBefore(toolbar, editorElement);
    
    // Add toolbar functionality
    setupEditorToolbar(toolbar, editorElement);
}

function setupEditorToolbar(toolbar, editor) {
    toolbar.addEventListener('click', function(e) {
        e.preventDefault();
        
        const button = e.target.closest('button');
        if (!button) return;
        
        const command = button.className.replace('btn-', '');
        
        switch (command) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'underline':
                document.execCommand('underline');
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand('createLink', false, url);
                }
                break;
            case 'image':
                openMediaSelector();
                break;
            case 'list':
                document.execCommand('insertUnorderedList');
                break;
        }
    });
}

function initializeMediaManager() {
    console.log('Media manager initialized');
    
    // Setup file upload
    setupFileUpload();
    
    // Setup media organization
    setupMediaOrganization();
}

function setupFileUpload() {
    const uploadForm = document.getElementById('mediaUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFileUpload(this);
        });
    }
}

function handleFileUpload(form) {
    const formData = new FormData(form);
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('mediaUploadStatus', 'Uploading files...');
    }
    
    fetch('/api/cms/media/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Files uploaded successfully!');
            }
            loadMediaLibrary(); // Refresh media library
            form.reset();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Upload failed: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Upload error', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('mediaUploadStatus');
        }
    });
}

function initializePageManager() {
    console.log('Page manager initialized');
    
    // Setup page creation
    setupPageCreation();
    
    // Setup page editing
    setupPageEditing();
}

function initializeTemplateManager() {
    console.log('Template manager initialized');
    
    // Load available templates
    loadTemplates();
    
    // Setup template selection
    setupTemplateSelection();
}

function loadTemplates() {
    fetch('/api/cms/templates')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTemplates(data.templates);
            }
        })
        .catch(error => {
            console.error('Error loading templates:', error);
        });
}

function displayTemplates(templates) {
    const container = document.getElementById('templatesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-item';
        templateElement.innerHTML = `
            <div class="template-preview">
                <img src="${template.preview}" alt="${template.name}" style="width: 100%; height: 150px; object-fit: cover;">
            </div>
            <div class="template-info">
                <div class="template-name">${template.name}</div>
                <div class="template-description">${template.description}</div>
            </div>
            <div class="template-actions">
                <button class="btn-use" data-id="${template.id}">Use Template</button>
                <button class="btn-preview" data-id="${template.id}">Preview</button>
            </div>
        `;
        container.appendChild(templateElement);
    });
    
    // Add event listeners
    setupTemplateActions();
}

function setupEventListeners() {
    // Setup content type actions
    setupContentTypeActions();
    
    // Setup content actions
    setupContentActions();
    
    // Setup media actions
    setupMediaActions();
    
    // Setup page actions
    setupPageActions();
    
    // Setup template actions
    setupTemplateActions();
    
    // Setup projects form submission
    setTimeout(() => {
        setupProjectsForm();
    }, 100);
    
    // Setup testimonials form submission
    setTimeout(() => {
        setupTestimonialsForm();
    }, 100);
    
    // Setup testimonials design form submission
    setTimeout(() => {
        setupTestimonialsDesignForm();
    }, 100);
    
    // Setup testimonials edit form submission
    setTimeout(() => {
        setupTestimonialEditForm();
    }, 100);
    
    // Setup thumbnail preview
    setupThumbnailPreview();
}

function setupContentTypeActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view')) {
            const typeId = e.target.getAttribute('data-type');
            viewContentType(typeId);
        }
        
        if (e.target.classList.contains('btn-create')) {
            const typeId = e.target.getAttribute('data-type');
            createContent(typeId);
        }
    });
}

function setupContentActions() {
    document.addEventListener('click', function(e) {
        // Only handle content edit buttons, not project edit buttons
        if (e.target.classList.contains('btn-edit') && e.target.hasAttribute('data-id') && !e.target.hasAttribute('data-project-id')) {
            const contentId = e.target.getAttribute('data-id');
            if (contentId && contentId !== 'null') {
            editContent(contentId);
            }
        }
        
        if (e.target.classList.contains('btn-preview') && e.target.hasAttribute('data-id')) {
            const contentId = e.target.getAttribute('data-id');
            if (contentId && contentId !== 'null') {
            previewContent(contentId);
            }
        }
        
        if (e.target.classList.contains('btn-delete')) {
            const contentId = e.target.getAttribute('data-id');
            deleteContent(contentId);
        }
    });
}

function setupMediaActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-use')) {
            const mediaUrl = e.target.getAttribute('data-url');
            useMedia(mediaUrl);
        }
        
        if (e.target.classList.contains('btn-delete')) {
            const mediaId = e.target.getAttribute('data-id');
            deleteMedia(mediaId);
        }
    });
}

function setupPageActions() {
    document.addEventListener('click', function(e) {
        // Only handle page edit buttons, not project edit buttons
        if (e.target.classList.contains('btn-edit') && e.target.hasAttribute('data-id') && !e.target.hasAttribute('data-project-id')) {
            const pageId = e.target.getAttribute('data-id');
            if (pageId && pageId !== 'null') {
            editPage(pageId);
            }
        }
        
        if (e.target.classList.contains('btn-preview') && e.target.hasAttribute('data-id')) {
            const pageId = e.target.getAttribute('data-id');
            if (pageId && pageId !== 'null') {
            previewPage(pageId);
            }
        }
        
        if (e.target.classList.contains('btn-publish')) {
            const pageId = e.target.getAttribute('data-id');
            publishPage(pageId);
        }
    });
}

function setupTemplateActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-use')) {
            const templateId = e.target.getAttribute('data-id');
            useTemplate(templateId);
        }
        
        if (e.target.classList.contains('btn-preview')) {
            const templateId = e.target.getAttribute('data-id');
            previewTemplate(templateId);
        }
    });
}

// Action functions
function viewContentType(typeId) {
    window.location.href = `/Employee/OrderSupport/CMS/ContentType/${typeId}`;
}

function createContent(typeId) {
    window.location.href = `/Employee/OrderSupport/CMS/CreateContent?type=${typeId}`;
}

function editContent(contentId) {
    window.location.href = `/Employee/OrderSupport/CMS/EditContent/${contentId}`;
}

function previewContent(contentId) {
    window.open(`/Employee/OrderSupport/CMS/PreviewContent/${contentId}`, '_blank');
}

function deleteContent(contentId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this content?', 'Delete Content')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/cms/content/${contentId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Content deleted successfully!');
                            loadRecentContent(); // Refresh content list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete content', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting content:', error);
                        window.EmployeeUtils.showNotification('Error deleting content', 'error');
                    });
                }
            });
    }
}

function useMedia(mediaUrl) {
    // Insert media into content editor
    const editor = document.getElementById('contentEditor');
    if (editor) {
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.style.maxWidth = '100%';
        editor.appendChild(img);
    }
}

function deleteMedia(mediaId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this media file?', 'Delete Media')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/cms/media/${mediaId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Media deleted successfully!');
                            loadMediaLibrary(); // Refresh media library
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete media', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting media:', error);
                        window.EmployeeUtils.showNotification('Error deleting media', 'error');
                    });
                }
            });
    }
}

function editPage(pageId) {
    window.location.href = `/Employee/OrderSupport/CMS/EditPage/${pageId}`;
}

function previewPage(pageId) {
    window.open(`/Employee/OrderSupport/CMS/PreviewPage/${pageId}`, '_blank');
}

function publishPage(pageId) {
    fetch(`/api/cms/pages/${pageId}/publish`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Page published successfully!');
            }
            loadPageStructure(); // Refresh page list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to publish page', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error publishing page:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error publishing page', 'error');
        }
    });
}

function useTemplate(templateId) {
    window.location.href = `/Employee/OrderSupport/CMS/CreatePage?template=${templateId}`;
}

function previewTemplate(templateId) {
    window.open(`/Employee/OrderSupport/CMS/PreviewTemplate/${templateId}`, '_blank');
}

function openMediaSelector() {
    // Open media selector modal
    const modal = document.getElementById('mediaSelectorModal');
    if (modal) {
        modal.style.display = 'block';
        loadMediaLibrary(); // Load media for selection
    }
}

function setupContentValidation() {
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            validateAndSaveContent(this);
        });
    }
}

function validateAndSaveContent(form) {
    const formData = new FormData(form);
    const contentData = Object.fromEntries(formData);
    
    // Basic validation
    if (!contentData.title || contentData.title.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Title is required', 'error');
        }
        return;
    }
    
    if (!contentData.content || contentData.content.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Content is required', 'error');
        }
        return;
    }
    
    // Save content
    saveContent(contentData);
}

function saveContent(contentData) {
    fetch('/api/cms/content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Content saved successfully!');
            }
            loadRecentContent(); // Refresh content list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to save content', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error saving content:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error saving content', 'error');
        }
    });
}

function setupMediaOrganization() {
    // Setup media categorization
    setupMediaCategories();
    
    // Setup media search
    setupMediaSearch();
}

function setupMediaCategories() {
    const categoryFilter = document.getElementById('mediaCategoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterMediaByCategory(this.value);
        });
    }
}

function filterMediaByCategory(category) {
    const mediaItems = document.querySelectorAll('.media-item');
    
    mediaItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupMediaSearch() {
    const searchInput = document.getElementById('mediaSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchMedia(this.value);
        });
    }
}

function searchMedia(searchTerm) {
    const mediaItems = document.querySelectorAll('.media-item');
    
    mediaItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupPageCreation() {
    const createPageForm = document.getElementById('createPageForm');
    if (createPageForm) {
        createPageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreatePage(this);
        });
    }
}

function handleCreatePage(form) {
    const formData = new FormData(form);
    const pageData = Object.fromEntries(formData);
    
    fetch('/api/cms/pages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Page created successfully!');
            }
            loadPageStructure(); // Refresh page list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create page', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating page:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating page', 'error');
        }
    });
}

function setupPageEditing() {
    // Setup page editing functionality
    console.log('Page editing setup completed');
}

function setupTemplateSelection() {
    // Setup template selection functionality
    console.log('Template selection setup completed');
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Core CMS Tab Navigation Function
function showTab(tab) {
    const tabs = ['banner', 'hero-banner', 'products', 'testimonials', 'offer', 'projects', 'about', 'auto-messages', 'terms', 'theme', 'messages'];
    tabs.forEach(t => {
        const content = document.getElementById('tab-content-' + t);
        const button = document.getElementById('tab-' + t);
        if (content) content.style.display = (t === tab) ? '' : 'none';
        if (button) button.classList.toggle('active', t === tab);
    });
    
    // Load data when switching to specific tabs
    if (tab === 'products') {
        loadProducts();
    } else if (tab === 'testimonials') {
        loadTestimonials();
    } else if (tab === 'projects') {
        loadProjects();
    } else if (tab === 'about') {
        loadAboutContent();
    } else if (tab === 'theme') {
        loadThemeSettings();
    } else if (tab === 'messages') {
        loadContactMessages();
    }
}

// Products Tab Functionality
async function fetchProducts() {
    try {
        const response = await fetch('/api/admin/products');
        const result = await response.json();
        return result.success ? result.products : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

function loadProducts() {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    fetchProducts().then(products => {
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.ProductID}</td>
                <td>${p.Name}</td>
                <td>${p.Category || 'N/A'}</td>
                <td>₱${parseFloat(p.Price).toFixed(2)}</td>
                <td>
                    <input type="checkbox" ${p.IsFeatured ? 'checked' : ''} 
                           onchange="toggleProductFeatured(${p.ProductID}, this.checked)">
                </td>
                <td>
                    <button onclick="editProduct(${p.ProductID})" class="btn-edit">Edit</button>
                    <button onclick="deleteProduct(${p.ProductID})" class="btn-delete">Delete</button>
                </td>
            </tr>
        `).join('');
    }).catch(error => {
        tbody.innerHTML = '<tr><td colspan="6">Error loading products</td></tr>';
        console.error('Error loading products:', error);
    });
}

function toggleProductFeatured(productId, featured) {
    fetch(`/api/admin/products/${productId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Product featured status updated');
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to update product', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error updating product:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error updating product', 'error');
        }
    });
}

function editProduct(productId) {
    // Open product edit modal or redirect to product edit page
    window.open(`/Employee/OrderSupport/Products?edit=${productId}`, '_blank');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Product deleted successfully');
                }
                loadProducts(); // Refresh the list
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to delete product', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error deleting product', 'error');
            }
        });
    }
}

// Testimonials Tab Functionality
async function fetchTestimonials() {
    try {
        const response = await fetch('/api/cms/testimonials');
        const result = await response.json();
        return result.success ? result.testimonials : [];
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }
}

function loadTestimonials() {
    const container = document.getElementById('admin-testimonials-list');
    if (!container) {
        console.error('Testimonials container not found');
        return;
    }
    
    container.innerHTML = 'Loading testimonials...';
    
    fetchTestimonials().then(testimonials => {
        if (testimonials.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2em;">No testimonials found. Add your first testimonial above!</p>';
            return;
        }
        
        container.innerHTML = testimonials.map(t => `
            <div class="testimonial-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5em; margin-bottom: 1em; background: #fff;">
                <div style="display: flex; align-items: center; margin-bottom: 1em;">
                    ${t.imageUrl ? `<img src="${t.imageUrl}" alt="${t.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-right: 1em;">` : ''}
                    <div>
                        <h4 style="margin: 0; color: #333; font-size: 1.1em;">${t.name}</h4>
                        ${t.profession ? `<p style="margin: 0.25em 0 0 0; color: #666; font-size: 0.9em;">${t.profession}</p>` : ''}
                        ${t.rating ? `<div style="color: #F0B21B; font-size: 0.9em; margin-top: 0.25em;">${'★'.repeat(Math.floor(t.rating))}${t.rating}</div>` : ''}
                    </div>
                </div>
                <p style="color: #555; line-height: 1.6; margin-bottom: 1em;">${t.content}</p>
                <div class="testimonial-actions" style="display: flex; gap: 0.5em;">
                    <button onclick="editTestimonial(${t.id})" class="btn-edit" style="background: #F0B21B; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Edit</button>
                    <button onclick="deleteTestimonial(${t.id})" class="btn-delete" style="background: #dc3545; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Delete</button>
                </div>
            </div>
        `).join('');
    }).catch(error => {
        container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 2em;">Error loading testimonials. Please try again.</p>';
        console.error('Error loading testimonials:', error);
    });
}

function editTestimonial(testimonialId) {
    console.log('Edit testimonial:', testimonialId);
    
    // Fetch testimonial data
    fetch(`/api/cms/testimonials/${testimonialId}`, {
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.testimonial) {
            const testimonial = data.testimonial;
            
            // Populate the modal form
            document.getElementById('edit-testimonial-id').value = testimonialId;
            document.getElementById('edit-testimonial-name').value = testimonial.name || '';
            document.getElementById('edit-testimonial-profession').value = testimonial.profession || '';
            document.getElementById('edit-testimonial-text').value = testimonial.content || '';
            document.getElementById('edit-testimonial-rating').value = testimonial.rating || '5.0';
            document.getElementById('edit-testimonial-display-order').value = testimonial.displayOrder || 0;
            
            // Set current image
            const currentImage = document.getElementById('edit-current-testimonial-image');
            if (testimonial.imageUrl) {
                currentImage.src = testimonial.imageUrl;
                currentImage.style.display = 'block';
            } else {
                currentImage.style.display = 'none';
            }
            
            // Show the modal
            document.getElementById('testimonial-edit-modal').style.display = 'block';
        } else {
            showNotification('Failed to load testimonial data', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading testimonial:', error);
        showNotification('Error loading testimonial', 'error');
    });
}

function closeTestimonialEditModal() {
    document.getElementById('testimonial-edit-modal').style.display = 'none';
    // Clear form
    document.getElementById('testimonial-edit-form').reset();
    document.getElementById('edit-current-testimonial-image').src = '';
}

function handleTestimonialEditFormSubmit(event) {
    event.preventDefault();
    console.log('Testimonial edit form submitted');
    
    const formData = new FormData(event.target);
    const testimonialId = formData.get('testimonialId');
    console.log('Form data:', Object.fromEntries(formData));
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Updating Testimonial...';
    submitButton.disabled = true;
    
    fetch(`/api/cms/testimonials/${testimonialId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.success) {
            showNotification('Testimonial updated successfully!', 'success');
            // Close modal
            closeTestimonialEditModal();
            // Reload testimonials list
            loadTestimonials();
        } else {
            showNotification('Failed to update testimonial: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating testimonial:', error);
        showNotification('Error updating testimonial', 'error');
    })
    .finally(() => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function deleteTestimonial(testimonialId) {
    if (confirm('Are you sure you want to delete this testimonial?')) {
        fetch(`/api/cms/testimonials/${testimonialId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Testimonial deleted successfully', 'success');
                loadTestimonials();
            } else {
                showNotification('Failed to delete testimonial', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting testimonial:', error);
            showNotification('Error deleting testimonial', 'error');
        });
    }
}

// Projects Tab Functionality
async function fetchProjects() {
    try {
        console.log('Fetching projects from /api/cms/projects...');
        const response = await fetch('/api/cms/projects', {
            credentials: 'same-origin' // Ensure cookies are sent
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success && result.projects) {
            return result.projects;
        } else {
            console.warn('API response missing projects data:', result);
            return [];
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

function loadProjects() {
    const container = document.getElementById('projects-status');
    if (!container) {
        console.error('Projects container element not found: #projects-status');
        return;
    }
    
    container.innerHTML = 'Loading projects...';
    
    fetchProjects().then(projects => {
        console.log('Projects data received:', projects);
        if (!projects || !Array.isArray(projects)) {
            console.error('Invalid projects data:', projects);
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error: Invalid projects data received.</div>';
            return;
        }
        if (projects.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No projects found. Create your first project above!</div>';
        } else {
            container.innerHTML = projects.map(item => `
                <div class="project-item" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 6px; background: white;">
                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <img src="${item.imageUrl}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #333;">${item.title}</h4>
                            <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.5;">${item.description}</p>
                            <div style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">
                                Created: ${new Date(item.createdAt).toLocaleDateString()}
                            </div>
                            <div class="project-actions" style="display: flex; gap: 0.5rem;">
                                <button class="btn-edit" data-project-id="${item.id}" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Edit</button>
                                <button class="btn-delete" data-project-id="${item.id}" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Delete</button>
                            </div>
                        </div>
                </div>
            </div>
        `).join('');
        }
        
        // Add event delegation for edit and delete buttons
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                const projectId = e.target.getAttribute('data-project-id');
                console.log('Edit button clicked for project ID:', projectId);
                editProjectItem(parseInt(projectId));
            } else if (e.target.classList.contains('btn-delete')) {
                const projectId = e.target.getAttribute('data-project-id');
                console.log('Delete button clicked for project ID:', projectId);
                deleteProjectItem(parseInt(projectId));
            }
        });
    }).catch(error => {
        console.error('Error loading projects:', error);
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading projects. Please try again.</div>';
    });
}

function editProjectItem(itemId) {
    console.log('Edit project item:', itemId);
    
    // Find the project item element by data attribute
    const targetItem = document.querySelector(`[data-project-id="${itemId}"]`)?.closest('.project-item');
    
    if (!targetItem) {
        console.error('Project item not found for ID:', itemId);
        return;
    }
    
    // Get current data
    const titleElement = targetItem.querySelector('h4');
    const descriptionElement = targetItem.querySelector('p');
    const imageElement = targetItem.querySelector('img');
    const currentTitle = titleElement.textContent;
    const currentDescription = descriptionElement.textContent;
    const currentImageUrl = imageElement.src;
    
    // Populate the modal form
    document.getElementById('edit-project-id').value = itemId;
    document.getElementById('edit-project-title').value = currentTitle;
    document.getElementById('edit-project-description').value = currentDescription;
    document.getElementById('edit-current-image').src = currentImageUrl;
    
    // Clear previous thumbnail previews
    document.getElementById('current-edit-thumbnails').innerHTML = '<span id="no-current-thumbnails">Loading current thumbnails...</span>';
    document.getElementById('edit-thumbnail-preview-container').innerHTML = '<span id="no-edit-thumbnails-text">No new thumbnails selected</span>';
    
    // Load current thumbnails (we'll need to fetch this from the API)
    loadCurrentThumbnails(itemId);
    
    // Show the modal
    document.getElementById('project-edit-modal').style.display = 'block';
}

function closeProjectEditModal() {
    document.getElementById('project-edit-modal').style.display = 'none';
    // Clear form
    document.getElementById('project-edit-form').reset();
    document.getElementById('edit-current-image').src = '';
    document.getElementById('current-edit-thumbnails').innerHTML = '<span id="no-current-thumbnails">No thumbnails</span>';
    document.getElementById('edit-thumbnail-preview-container').innerHTML = '<span id="no-edit-thumbnails-text">No new thumbnails selected</span>';
}

function cancelEdit() {
    closeProjectEditModal();
}

function loadCurrentThumbnails(projectId) {
    // For now, we'll show a placeholder since we need to fetch from API
    // In a real implementation, you'd fetch the thumbnails from the API
    document.getElementById('current-edit-thumbnails').innerHTML = '<span id="no-current-thumbnails">Current thumbnails will be loaded here</span>';
}

function previewEditThumbnails(files) {
    const container = document.getElementById('edit-thumbnail-preview-container');
    container.innerHTML = '';
    
    if (files.length === 0) {
        container.innerHTML = '<span id="no-edit-thumbnails-text">No new thumbnails selected</span>';
        return;
    }
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '60px';
                img.style.height = '60px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                img.style.border = '1px solid #ddd';
                img.title = file.name;
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function saveProjectItem(itemId, form) {
    const formData = new FormData(form);
    const title = formData.get('title');
    const description = formData.get('description');
    const mainImage = formData.get('mainImage');
    const thumbnails = formData.getAll('thumbnails');
    
    if (!title || !description) {
        alert('Title and description are required');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Updating...';
    submitButton.disabled = true;
    
    // Prepare the request
    const requestData = new FormData();
    requestData.append('title', title);
    requestData.append('description', description);
    
    // Add new main image if provided
    if (mainImage && mainImage.size > 0) {
        requestData.append('mainImage', mainImage);
    }
    
    // Add new thumbnails if provided
    thumbnails.forEach(thumbnail => {
        if (thumbnail.size > 0) {
            requestData.append('thumbnails', thumbnail);
        }
    });
    
    fetch(`/api/cms/projects/${itemId}`, {
        method: 'PUT',
        body: requestData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Project updated successfully!');
            } else {
                alert('Project updated successfully!');
            }
            
            // Close modal and reload projects
            closeProjectEditModal();
            loadProjects();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to update project: ' + data.message, 'error');
            } else {
                alert('Failed to update project: ' + data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error updating project:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error updating project', 'error');
        } else {
            alert('Error updating project');
        }
    })
    .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function deleteProjectItem(itemId) {
    if (confirm('Are you sure you want to delete this project item?')) {
        fetch(`/api/cms/projects/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Project deleted successfully');
                }
                loadProjects();
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to delete project item', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error deleting project item:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error deleting project item', 'error');
            }
        });
    }
}

// About Us Tab Functionality
function loadAboutContent() {
    fetch('/api/cms/about')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.content) {
                const content = result.content;
                // Populate all form fields with existing data
                document.getElementById('about-layout').value = content.layout || 'default';
                document.getElementById('our-story-title').value = content.ourStoryTitle || '';
                document.getElementById('our-story-content').value = content.ourStoryContent || '';
                document.getElementById('story-subtitle').value = content.storySubtitle || '';
                document.getElementById('projects-count').value = content.projectsCount || '';
                document.getElementById('clients-count').value = content.clientsCount || '';
                document.getElementById('mission-title').value = content.missionTitle || '';
                document.getElementById('mission-content').value = content.missionContent || '';
                document.getElementById('feature-1').value = content.feature1 || '';
                document.getElementById('feature-2').value = content.feature2 || '';
                document.getElementById('feature-3').value = content.feature3 || '';
                document.getElementById('vision-title').value = content.visionTitle || '';
                document.getElementById('vision-content').value = content.visionContent || '';
                document.getElementById('value-1-title').value = content.value1Title || '';
                document.getElementById('value-1-description').value = content.value1Description || '';
                document.getElementById('value-2-title').value = content.value2Title || '';
                document.getElementById('value-2-description').value = content.value2Description || '';
                document.getElementById('value-3-title').value = content.value3Title || '';
                document.getElementById('value-3-description').value = content.value3Description || '';
                document.getElementById('value-4-title').value = content.value4Title || '';
                document.getElementById('value-4-description').value = content.value4Description || '';
                document.getElementById('philosophy-title').value = content.philosophyTitle || '';
                document.getElementById('philosophy-subtitle').value = content.philosophySubtitle || '';
                document.getElementById('philosophy-description').value = content.philosophyDescription || '';
                document.getElementById('typo-1-title').value = content.typo1Title || '';
                document.getElementById('typo-1-description').value = content.typo1Description || '';
                document.getElementById('typo-2-title').value = content.typo2Title || '';
                document.getElementById('typo-2-description').value = content.typo2Description || '';
                document.getElementById('typo-3-title').value = content.typo3Title || '';
                document.getElementById('typo-3-description').value = content.typo3Description || '';
            }
        })
        .catch(error => {
            console.error('Error loading about content:', error);
        });
}

// Save About Us Content
function saveAboutContent(formData) {
    return fetch('/api/cms/about', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('About Us content saved successfully');
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to save content: ' + result.message, 'error');
            }
        }
        return result;
    })
    .catch(error => {
        console.error('Error saving about content:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error saving content', 'error');
        }
        return { success: false, error: error.message };
    });
}

// Theme Tab Functionality
function loadThemeSettings() {
    fetch('/api/theme/active')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.theme) {
                const theme = result.theme;
                document.getElementById('main-bg-color').value = theme.mainBgColor || '#ffffff';
                document.getElementById('main-text-color').value = theme.mainTextColor || '#333333';
                document.getElementById('contact-text-color').value = theme.contactTextColor || '#6c757d';
                document.getElementById('contact-icon-color').value = theme.contactIconColor || '#f0b21b';
                document.getElementById('nav-bg-color').value = theme.navBgColor || '#343a40';
                document.getElementById('nav-text-color').value = theme.navTextColor || '#ffffff';
                document.getElementById('nav-hover-color').value = theme.navHoverColor || '#007bff';
                document.getElementById('search-border-color').value = theme.searchBorderColor || '#ffc107';
                document.getElementById('search-btn-color').value = theme.searchBtnColor || '#ffc107';
                document.getElementById('icon-color').value = theme.iconColor || '#f0b21b';
            }
        })
        .catch(error => {
            console.error('Error loading theme settings:', error);
        });
}

// Messages Tab Functionality
function loadContactMessages() {
    const container = document.getElementById('messages-list');
    if (!container) return;
    
    container.innerHTML = 'Loading messages...';
    
    // Load statistics first
    fetch('/api/admin/contact-messages/stats')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const stats = result.stats;
                document.getElementById('total-messages').textContent = stats.total || 0;
                document.getElementById('new-messages').textContent = stats.new || 0;
                document.getElementById('read-messages').textContent = stats.read || 0;
                document.getElementById('replied-messages').textContent = stats.replied || 0;
            }
        })
        .catch(error => {
            console.error('Error loading message statistics:', error);
        });
    
    fetch('/api/admin/contact-messages')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                container.innerHTML = result.messages.map(msg => `
                    <div class="message-item" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 6px; background: white;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #333;">${msg.name}</h4>
                        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.5;">${msg.message}</p>
                        <div class="message-meta" style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                            <span><strong>Email:</strong> ${msg.email}</span>
                            <span><strong>Date:</strong> ${new Date(msg.createdAt).toLocaleDateString()}</span>
                            <span><strong>Status:</strong> <span style="color: ${msg.status === 'New' ? '#dc3545' : msg.status === 'Read' ? '#007bff' : '#28a745'};">${msg.status}</span></span>
                        </div>
                        <div class="message-actions" style="display: flex; gap: 0.5rem;">
                            <button onclick="markMessageRead(${msg.id})" class="btn-mark-read" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Mark as Read</button>
                            <a href="mailto:${msg.email}?subject=Re: Your inquiry&body=Dear ${msg.name},%0D%0A%0D%0AThank you for contacting Design Excellence.%0D%0A%0D%0A" target="_blank" class="btn-reply" style="background: #17a2b8; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block;">Reply</a>
                            <button onclick="markMessageReplied(${msg.id})" class="btn-mark-replied" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Mark as Replied</button>
                            <button onclick="deleteMessage(${msg.id})" class="btn-delete" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No messages found</div>';
            }
        })
        .catch(error => {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading messages</div>';
            console.error('Error loading messages:', error);
        });
}

function markMessageRead(messageId) {
    console.log('Mark as Read clicked for message ID:', messageId);
    fetch(`/api/admin/contact-messages/${messageId}/read`, {
        method: 'PUT'
    })
    .then(response => {
        console.log('Mark as Read response status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('Mark as Read result:', result);
        if (result.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Message marked as read');
            } else {
                alert('Message marked as read');
            }
            loadContactMessages();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to mark message as read', 'error');
            } else {
                alert('Failed to mark message as read: ' + result.message);
            }
        }
    })
    .catch(error => {
        console.error('Error marking message as read:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error marking message as read', 'error');
        } else {
            alert('Error marking message as read: ' + error.message);
        }
    });
}

function markMessageReplied(messageId) {
    console.log('Mark as Replied clicked for message ID:', messageId);
    fetch(`/api/admin/contact-messages/${messageId}/replied`, {
        method: 'PUT'
    })
    .then(response => {
        console.log('Mark as Replied response status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('Mark as Replied result:', result);
        if (result.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Message marked as replied');
            } else {
                alert('Message marked as replied');
            }
            loadContactMessages();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to mark message as replied', 'error');
            } else {
                alert('Failed to mark message as replied: ' + result.message);
            }
        }
    })
    .catch(error => {
        console.error('Error marking message as replied:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error marking message as replied', 'error');
        } else {
            alert('Error marking message as replied: ' + error.message);
        }
    });
}

function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        fetch(`/api/admin/contact-messages/${messageId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Message deleted successfully');
                }
                loadContactMessages();
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to delete message', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error deleting message:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error deleting message', 'error');
            }
        });
    }
}

// Missing functions that are called in the template
function handleAutoMessagesFormSubmit(event) {
    event.preventDefault();
    console.log('Auto messages form submitted');
    
    const formData = new FormData(event.target);
    const autoMessagesData = Object.fromEntries(formData);
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('autoMessagesStatus', 'Saving auto messages...');
    }
    
    fetch('/api/cms/auto-messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoMessagesData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Auto messages saved successfully!');
            }
            renderAutoMessagesList(); // Refresh the list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to save auto messages: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error saving auto messages:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error saving auto messages', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('autoMessagesStatus');
        }
    });
}

function handleHeaderOfferFormSubmit(event) {
    event.preventDefault();
    console.log('Header offer form submitted');
    
    const formData = new FormData(event.target);
    const headerOfferData = Object.fromEntries(formData);
    
    console.log('Form data:', headerOfferData);
    
    // Show loading state
    const statusDiv = document.getElementById('header-offer-status-message');
    if (statusDiv) {
        statusDiv.innerHTML = '<p style="color: #007bff;">Saving header offer settings...</p>';
    }
    
    fetch('/api/cms/header-offer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(headerOfferData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.success) {
            if (statusDiv) {
                statusDiv.innerHTML = '<p style="color: #28a745;">✅ Header offer saved successfully!</p>';
            }
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Header offer saved successfully!');
            }
            // Refresh the settings after a short delay
            setTimeout(() => {
                if (typeof loadHeaderOfferBarSettings === 'function') {
                    loadHeaderOfferBarSettings();
                }
            }, 1000);
        } else {
            if (statusDiv) {
                statusDiv.innerHTML = `<p style="color: #dc3545;">❌ Failed to save header offer: ${data.message}</p>`;
            }
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to save header offer: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error saving header offer:', error);
        if (statusDiv) {
            statusDiv.innerHTML = '<p style="color: #dc3545;">❌ Error saving header offer. Please try again.</p>';
        }
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error saving header offer', 'error');
        }
    });
}

function renderAutoMessagesList() {
    fetch('/api/cms/auto-messages')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayAutoMessages(data.messages);
            }
        })
        .catch(error => {
            console.error('Error loading auto messages:', error);
        });
}

function displayAutoMessages(messages) {
    const container = document.getElementById('auto-messages-list');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No FAQs found. Create your first FAQ above.</div>';
        return;
    }
    
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'auto-message-item';
        messageElement.style.cssText = `
            border: 1px solid #ddd;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 6px;
            background: white;
        `;
        messageElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div style="font-weight: 600; color: #333; flex: 1;">${message.question}</div>
                <div style="color: ${message.isActive ? '#28a745' : '#dc3545'}; font-size: 0.9rem; margin-left: 1rem;">
                    ${message.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div style="color: #666; margin-bottom: 1rem; line-height: 1.5;">${message.answer}</div>
            ${message.keywords ? `<div style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;"><strong>Keywords:</strong> ${message.keywords}</div>` : ''}
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editAutoMessage(${message.id})" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Edit</button>
                <button onclick="deleteAutoMessage(${message.id})" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        `;
        container.appendChild(messageElement);
    });
}

function editAutoMessage(id) {
    // Fetch the FAQ data first
    fetch(`/api/cms/auto-messages/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.faq) {
                // Populate the edit modal with the FAQ data
                document.getElementById('edit-faq-id').value = data.faq.id;
                document.getElementById('edit-faq-question').value = data.faq.question;
                document.getElementById('edit-faq-answer').value = data.faq.answer;
                document.getElementById('edit-faq-keywords').value = data.faq.keywords || '';
                document.getElementById('edit-faq-active').checked = data.faq.isActive;
                
                // Show the modal
                document.getElementById('faq-edit-modal').style.display = 'block';
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to load FAQ data', 'error');
                } else {
                    alert('Failed to load FAQ data');
                }
            }
        })
        .catch(error => {
            console.error('Error loading FAQ:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error loading FAQ', 'error');
            } else {
                alert('Error loading FAQ');
            }
        });
}

function closeEditModal() {
    document.getElementById('faq-edit-modal').style.display = 'none';
    document.getElementById('faq-edit-form').reset();
    document.getElementById('edit-faq-status').innerHTML = '';
}

function handleEditFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const faqData = {
        id: formData.get('id'),
        question: formData.get('question'),
        answer: formData.get('answer'),
        keywords: formData.get('keywords'),
        isActive: formData.get('isActive') === 'on'
    };
    
    const statusDiv = document.getElementById('edit-faq-status');
    statusDiv.innerHTML = '<div style="color: #007bff;">Updating FAQ...</div>';
    
    fetch(`/api/cms/auto-messages/${faqData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(faqData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusDiv.innerHTML = '<div style="color: #28a745;">FAQ updated successfully!</div>';
            setTimeout(() => {
                closeEditModal();
                renderAutoMessagesList(); // Refresh the list
            }, 1500);
        } else {
            statusDiv.innerHTML = `<div style="color: #dc3545;">Failed to update FAQ: ${data.message}</div>`;
        }
    })
    .catch(error => {
        console.error('Error updating FAQ:', error);
        statusDiv.innerHTML = '<div style="color: #dc3545;">Error updating FAQ</div>';
    });
}

function deleteAutoMessage(id) {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
        return;
    }
    
    fetch(`/api/cms/auto-messages/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('FAQ deleted successfully!');
            }
            renderAutoMessagesList(); // Refresh the list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to delete FAQ: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error deleting FAQ:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error deleting FAQ', 'error');
        }
    });
}

function loadHeaderOfferBarSettings() {
    fetch('/api/cms/header-offer')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayHeaderOfferSettings(data.settings);
            }
        })
        .catch(error => {
            console.error('Error loading header offer settings:', error);
        });
}

function displayHeaderOfferSettings(settings) {
    if (!settings) return;
    
    // Populate form fields with existing settings
    const form = document.getElementById('header-offer-form');
    if (form) {
        Object.keys(settings).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = settings[key];
            }
        });
    }
}

// =============================================================================
// HERO BANNER MANAGEMENT
// =============================================================================

// Load hero banner settings
async function loadHeroBannerSettings() {
    try {
        console.log('Loading hero banner settings...');
        const response = await fetch('/api/admin/hero-banner');
        const data = await response.json();
        
        if (data.success) {
            const heroBanner = data.heroBanner;
            
            // Populate form fields
            document.getElementById('hero-main-heading').value = heroBanner.mainHeading || '';
            document.getElementById('hero-description-1').value = heroBanner.descriptionLine1 || '';
            document.getElementById('hero-description-2').value = heroBanner.descriptionLine2 || '';
            document.getElementById('hero-button-text').value = heroBanner.buttonText || '';
            document.getElementById('hero-button-link').value = heroBanner.buttonLink || '';
            document.getElementById('hero-button2-text').value = heroBanner.button2Text || '';
            document.getElementById('hero-button2-link').value = heroBanner.button2Link || '';
            document.getElementById('hero-button2-bg-color').value = heroBanner.button2BgColor || '#007bff';
            document.getElementById('hero-button2-text-color').value = heroBanner.button2TextColor || '#ffffff';
            document.getElementById('hero-text-color').value = heroBanner.textColor || '#ffffff';
            document.getElementById('hero-button-bg-color').value = heroBanner.buttonBgColor || '#007bff';
            document.getElementById('hero-button-text-color').value = heroBanner.buttonTextColor || '#ffffff';
            
            // Display current images
            displayHeroBannerImages(heroBanner.heroBannerImages || []);
            
            // Update preview
            updateHeroBannerPreview(heroBanner);
            
            console.log('Hero banner settings loaded successfully');
        } else {
            console.error('Failed to load hero banner settings:', data.error);
        }
    } catch (error) {
        console.error('Error loading hero banner settings:', error);
    }
}

// Save hero banner settings
async function saveHeroBannerSettings() {
    try {
        const formData = new FormData();
        
        // Get form data
        formData.append('mainHeading', document.getElementById('hero-main-heading').value);
        formData.append('descriptionLine1', document.getElementById('hero-description-1').value);
        formData.append('descriptionLine2', document.getElementById('hero-description-2').value);
        formData.append('buttonText', document.getElementById('hero-button-text').value);
        formData.append('buttonLink', document.getElementById('hero-button-link').value);
        formData.append('button2Text', document.getElementById('hero-button2-text').value);
        formData.append('button2Link', document.getElementById('hero-button2-link').value);
        formData.append('button2BgColor', document.getElementById('hero-button2-bg-color').value);
        formData.append('button2TextColor', document.getElementById('hero-button2-text-color').value);
        formData.append('textColor', document.getElementById('hero-text-color').value);
        formData.append('buttonBgColor', document.getElementById('hero-button-bg-color').value);
        formData.append('buttonTextColor', document.getElementById('hero-button-text-color').value);
        
        // Handle file uploads
        const fileInput = document.getElementById('hero-banner-images');
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('heroBannerImages', fileInput.files[i]);
            }
        }
        
        const response = await fetch('/api/admin/hero-banner', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Hero banner settings saved successfully');
            showHeroBannerStatusMessage('Hero banner settings saved successfully!', 'success');
            
            // Reload settings to get updated data
            await loadHeroBannerSettings();
        } else {
            console.error('Failed to save hero banner settings:', data.error);
            showHeroBannerStatusMessage('Failed to save hero banner settings: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error saving hero banner settings:', error);
        showHeroBannerStatusMessage('Error saving hero banner settings: ' + error.message, 'error');
    }
}

// Delete hero banner images
async function deleteHeroBannerImages() {
    try {
        if (confirm('Are you sure you want to remove all hero banner images?')) {
            const response = await fetch('/api/admin/hero-banner', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Hero banner images removed successfully');
                showHeroBannerStatusMessage('Hero banner images removed successfully!', 'success');
                
                // Reload settings
                await loadHeroBannerSettings();
            } else {
                console.error('Failed to remove hero banner images:', data.error);
                showHeroBannerStatusMessage('Failed to remove hero banner images: ' + data.error, 'error');
            }
        }
    } catch (error) {
        console.error('Error removing hero banner images:', error);
        showHeroBannerStatusMessage('Error removing hero banner images: ' + error.message, 'error');
    }
}

// Display hero banner images
function displayHeroBannerImages(images) {
    const container = document.getElementById('hero-images-container');
    const noImagesText = document.getElementById('no-hero-images-text');
    
    if (images && images.length > 0) {
        noImagesText.style.display = 'none';
        container.style.display = 'block';
        container.innerHTML = '';
        
        images.forEach((image, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = 'position: relative; display: inline-block; margin: 5px;';
            
            const img = document.createElement('img');
            img.src = `/uploads/hero-banners/${image.filename}`;
            img.style.cssText = 'width: 150px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #ddd;';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px;';
            removeBtn.onclick = () => deleteHeroBannerImages();
            
            imageDiv.appendChild(img);
            imageDiv.appendChild(removeBtn);
            container.appendChild(imageDiv);
        });
    } else {
        noImagesText.style.display = 'block';
        container.style.display = 'none';
    }
}

// Update hero banner preview
function updateHeroBannerPreview(heroBanner) {
    const preview = document.getElementById('hero-banner-preview');
    const heading = document.getElementById('preview-hero-heading');
    const desc1 = document.getElementById('preview-hero-desc-1');
    const desc2 = document.getElementById('preview-hero-desc-2');
    const button1 = document.getElementById('preview-hero-button-1');
    const button2 = document.getElementById('preview-hero-button-2');
    
    // Update heading with modern design
    if (heading) {
        const mainText = heroBanner.mainHeading || 'Transform Your Workspace with';
        const highlightText = 'Premium Office Furniture';
        heading.innerHTML = `
            <span id="preview-hero-main-text">${mainText}</span><br>
            <span id="preview-hero-highlight" style="color: #F0B21B; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">${highlightText}</span>
        `;
    }
    
    if (desc1) desc1.textContent = heroBanner.descriptionLine1 || 'Discover our curated collection of ergonomic chairs, modern desks, and storage solutions designed to enhance productivity and comfort in your office.';
    if (desc2) desc2.textContent = heroBanner.descriptionLine2 || 'Designed for modern professionals who demand excellence in every detail.';
    
    if (button1) {
        button1.textContent = heroBanner.buttonText || 'Shop Now';
        button1.style.backgroundColor = heroBanner.buttonBgColor || '#F0B21B';
        button1.style.color = heroBanner.buttonTextColor || '#333';
        button1.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        button1.style.borderRadius = '12px';
        button1.style.boxShadow = '0 4px 12px rgba(240, 178, 27, 0.3)';
    }
    
    if (button2) {
        button2.textContent = heroBanner.button2Text || 'Custom Design';
        button2.style.backgroundColor = heroBanner.button2BgColor || '#6c757d';
        button2.style.color = heroBanner.button2TextColor || '#fff';
        button2.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        button2.style.borderRadius = '12px';
        button2.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
    }
    
    // Update text color for all text elements
    const textColor = heroBanner.textColor || '#ffffff';
    const textElements = preview.querySelectorAll('h1, p, span');
    textElements.forEach(el => {
        el.style.color = textColor;
    });
    
    // Update background images and carousel
    if (heroBanner.heroBannerImages && heroBanner.heroBannerImages.length > 0) {
        window.currentHeroImages = heroBanner.heroBannerImages;
        const carousel = document.getElementById('preview-hero-carousel');
        if (carousel) {
            const firstImage = heroBanner.heroBannerImages[0];
            const filename = typeof firstImage === 'string' ? firstImage : firstImage.filename;
            carousel.style.backgroundImage = `url(/uploads/hero-banners/${filename})`;
        }
        
        // Create carousel dots and start autoplay
        createCarouselDots();
        currentCarouselIndex = 0;
        startCarouselAutoPlay();
        
        // Show/hide navigation arrows based on image count
        const leftArrow = document.getElementById('preview-arrow-left');
        const rightArrow = document.getElementById('preview-arrow-right');
        if (leftArrow && rightArrow) {
            const showArrows = heroBanner.heroBannerImages.length > 1;
            leftArrow.style.display = showArrows ? 'flex' : 'none';
            rightArrow.style.display = showArrows ? 'flex' : 'none';
        }
    } else {
        // No images - hide carousel elements
        window.currentHeroImages = [];
        stopCarouselAutoPlay();
        
        const leftArrow = document.getElementById('preview-arrow-left');
        const rightArrow = document.getElementById('preview-arrow-right');
        const dotsContainer = document.getElementById('preview-carousel-dots');
        
        if (leftArrow) leftArrow.style.display = 'none';
        if (rightArrow) rightArrow.style.display = 'none';
        if (dotsContainer) dotsContainer.innerHTML = '';
        
        // Set default gradient background
        const carousel = document.getElementById('preview-hero-carousel');
        if (carousel) {
            carousel.style.backgroundImage = 'linear-gradient(135deg, #6c757d 0%, #ffc107 100%)';
        }
    }
}

// Show hero banner status message
function showHeroBannerStatusMessage(message, type) {
    const statusDiv = document.getElementById('hero-banner-status-message');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="alert alert-${type === 'success' ? 'success' : 'danger'}" style="margin-top: 1em; padding: 0.75em; border-radius: 4px; background: ${type === 'success' ? '#d4edda' : '#f8d7da'}; color: ${type === 'success' ? '#155724' : '#721c24'}; border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};">${message}</div>`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

// Carousel functionality for hero banner preview
let currentCarouselIndex = 0;
let carouselInterval = null;

function switchCarouselImage(index) {
    const carousel = document.getElementById('preview-hero-carousel');
    const dots = document.querySelectorAll('#preview-carousel-dots .carousel-dot');
    
    if (!carousel || !window.currentHeroImages || window.currentHeroImages.length === 0) {
        return;
    }
    
    currentCarouselIndex = index;
    
    // Update background image
    const image = window.currentHeroImages[currentCarouselIndex];
    if (image) {
        const filename = typeof image === 'string' ? image : image.filename;
        carousel.style.backgroundImage = `url(/uploads/hero-banners/${filename})`;
    }
    
    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentCarouselIndex);
    });
}

function startCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    if (window.currentHeroImages && window.currentHeroImages.length > 1) {
        carouselInterval = setInterval(() => {
            const nextIndex = (currentCarouselIndex + 1) % window.currentHeroImages.length;
            switchCarouselImage(nextIndex);
        }, 4000); // Change every 4 seconds
    }
}

function stopCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function createCarouselDots() {
    const dotsContainer = document.getElementById('preview-carousel-dots');
    if (!dotsContainer || !window.currentHeroImages || window.currentHeroImages.length <= 1) {
        return;
    }
    
    dotsContainer.innerHTML = '';
    
    window.currentHeroImages.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.5);
            background: ${index === 0 ? 'rgba(255, 255, 255, 0.8)' : 'transparent'};
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0 4px;
        `;
        
        dot.addEventListener('click', () => {
            switchCarouselImage(index);
            stopCarouselAutoPlay();
            startCarouselAutoPlay();
        });
        
        dotsContainer.appendChild(dot);
    });
}

// Setup real-time preview updates for hero banner form
function setupHeroBannerPreviewListeners() {
    const form = document.getElementById('hero-banner-form');
    if (!form) return;
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input[type="text"], input[type="color"]');
    
    inputs.forEach(input => {
        input.addEventListener('input', updateHeroBannerPreviewFromForm);
        input.addEventListener('change', updateHeroBannerPreviewFromForm);
    });
}

// Update preview based on current form values
function updateHeroBannerPreviewFromForm() {
    const form = document.getElementById('hero-banner-form');
    if (!form) return;
    
    // Get current form values
    const heroBanner = {
        mainHeading: document.getElementById('hero-main-heading')?.value || '',
        descriptionLine1: document.getElementById('hero-description-1')?.value || '',
        descriptionLine2: document.getElementById('hero-description-2')?.value || '',
        buttonText: document.getElementById('hero-button-text')?.value || '',
        buttonLink: document.getElementById('hero-button-link')?.value || '',
        button2Text: document.getElementById('hero-button2-text')?.value || '',
        button2Link: document.getElementById('hero-button2-link')?.value || '',
        button2BgColor: document.getElementById('hero-button2-bg-color')?.value || '#6c757d',
        button2TextColor: document.getElementById('hero-button2-text-color')?.value || '#ffffff',
        textColor: document.getElementById('hero-text-color')?.value || '#ffffff',
        buttonBgColor: document.getElementById('hero-button-bg-color')?.value || '#F0B21B',
        buttonTextColor: document.getElementById('hero-button-text-color')?.value || '#333',
        heroBannerImages: window.currentHeroImages || []
    };
    
    // Update preview
    updateHeroBannerPreview(heroBanner);
}

// Gallery Form Management
function setupProjectsForm() {
    const projectForm = document.getElementById('projects-form');
    console.log('Setting up projects form:', projectForm);
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            console.log('Form submitted!');
            e.preventDefault();
            handleProjectsFormSubmit(this);
        });
        console.log('Form event listener added');
    } else {
        console.error('Projects form not found: #projects-form');
    }
    
    // Setup modal edit form
    const editForm = document.getElementById('project-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const projectId = document.getElementById('edit-project-id').value;
            saveProjectItem(projectId, this);
        });
        console.log('Edit form event listener added');
    } else {
        console.error('Project edit form not found: #project-edit-form');
    }
    
    // Setup thumbnail preview for edit form
    const editThumbnailInput = document.getElementById('edit-thumbnails');
    if (editThumbnailInput) {
        editThumbnailInput.addEventListener('change', function(e) {
            previewEditThumbnails(e.target.files);
        });
    }
}

function handleProjectsFormSubmit(form) {
    console.log('handleProjectsFormSubmit called with form:', form);
    const formData = new FormData(form);
    
    // Validate required fields
    const title = formData.get('title');
    const description = formData.get('description');
    const mainImage = formData.get('mainImage');
    
    console.log('Form data:', { title, description, mainImage });
    console.log('All form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }
    
    if (!title || title.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Title is required', 'error');
        } else {
            alert('Title is required');
        }
        return;
    }
    
    if (!description || description.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Description is required', 'error');
        } else {
            alert('Description is required');
        }
        return;
    }
    
    if (!mainImage || mainImage.size === 0) {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Main image is required', 'error');
        } else {
            alert('Main image is required');
        }
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Adding Project...';
    submitButton.disabled = true;
    
    fetch('/api/cms/projects', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin' // Ensure cookies are sent with the request
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response URL:', response.url);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            // Try to get the response text to see what we're actually getting
            return response.text().then(text => {
                console.log('Non-JSON response body:', text.substring(0, 200));
                throw new Error('Server returned non-JSON response. You may need to log in first.');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Project added successfully!');
            } else {
                alert('Project added successfully!');
            }
            
            // Reset form
            form.reset();
            clearThumbnailPreview();
            
            // Reload project list
            loadProjects();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to add project: ' + data.message, 'error');
            } else {
                alert('Failed to add project: ' + data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error adding project:', error);
        let errorMessage = 'Error adding project';
        
        if (error.message.includes('non-JSON response')) {
            errorMessage = 'Authentication required. Please log in first and try again.';
        } else if (error.message.includes('Unexpected token')) {
            errorMessage = 'Server error. Please check if you are logged in and try again.';
        }
        
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    })
    .finally(() => {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function setupThumbnailPreview() {
    const thumbnailInput = document.getElementById('project-thumbnails');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function(e) {
            handleThumbnailPreview(e.target.files);
        });
    }
}

function handleThumbnailPreview(files) {
    const previewContainer = document.getElementById('thumbnail-preview-container');
    const noThumbnailsText = document.getElementById('no-thumbnails-text');
    
    if (!previewContainer) return;
    
    // Clear existing previews
    previewContainer.innerHTML = '';
    
    if (files.length === 0) {
        noThumbnailsText.style.display = 'block';
        return;
    }
    
    noThumbnailsText.style.display = 'none';
    
    // Limit to 8 thumbnails
    const filesToShow = Array.from(files).slice(0, 8);
    
    filesToShow.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.style.cssText = `
                    position: relative;
                    width: 80px;
                    height: 60px;
                    margin: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                `;
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '×';
                removeBtn.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                `;
                removeBtn.onclick = function() {
                    thumbnailDiv.remove();
                    updateThumbnailInput();
                };
                
                thumbnailDiv.appendChild(img);
                thumbnailDiv.appendChild(removeBtn);
                previewContainer.appendChild(thumbnailDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

function clearThumbnailPreview() {
    const previewContainer = document.getElementById('thumbnail-preview-container');
    const noThumbnailsText = document.getElementById('no-thumbnails-text');
    const thumbnailInput = document.getElementById('project-thumbnails');
    
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    if (noThumbnailsText) {
        noThumbnailsText.style.display = 'block';
    }
    
    if (thumbnailInput) {
        thumbnailInput.value = '';
    }
}

function updateThumbnailInput() {
    // This function would be used to update the file input when thumbnails are removed
    // For now, we'll just clear the preview
    const previewContainer = document.getElementById('thumbnail-preview-container');
    if (previewContainer && previewContainer.children.length === 0) {
        const noThumbnailsText = document.getElementById('no-thumbnails-text');
        if (noThumbnailsText) {
            noThumbnailsText.style.display = 'block';
        }
    }
}

// Testimonials Form Functions
function setupTestimonialsForm() {
    const testimonialForm = document.getElementById('admin-testimonial-form');
    console.log('Setting up testimonials form:', testimonialForm);
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', handleTestimonialFormSubmit);
    }
}

function handleTestimonialFormSubmit(event) {
    event.preventDefault();
    console.log('Testimonial form submitted');
    
    const formData = new FormData(event.target);
    console.log('Form data:', Object.fromEntries(formData));
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Adding Testimonial...';
    submitButton.disabled = true;
    
    fetch('/api/cms/testimonials', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.success) {
            showNotification('Testimonial added successfully!', 'success');
            // Reset form
            event.target.reset();
            // Reload testimonials list
            loadTestimonials();
        } else {
            showNotification('Failed to add testimonial: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error adding testimonial:', error);
        showNotification('Error adding testimonial', 'error');
    })
    .finally(() => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function setupTestimonialsDesignForm() {
    const designForm = document.getElementById('testimonials-design-form');
    console.log('Setting up testimonials design form:', designForm);
    if (designForm) {
        designForm.addEventListener('submit', handleTestimonialsDesignFormSubmit);
        // Load existing settings
        loadTestimonialsDesignSettings();
        
        // Add real-time preview listeners
        setupTestimonialsPreviewListeners();
    }
}

function setupTestimonialsPreviewListeners() {
    // Get all form inputs that affect the preview
    const bgColorInput = document.getElementById('testimonials-bg-color');
    const accentColorInput = document.getElementById('testimonials-accent-color');
    const showRatingInput = document.getElementById('testimonials-show-rating');
    const showImageInput = document.getElementById('testimonials-show-image');
    const showTitleInput = document.getElementById('testimonials-show-title');
    const showQuoteIconInput = document.getElementById('testimonials-show-quote-icon');
    
    // Add event listeners for real-time preview
    if (bgColorInput) {
        bgColorInput.addEventListener('input', updateTestimonialsPreviewFromForm);
    }
    
    if (accentColorInput) {
        accentColorInput.addEventListener('input', updateTestimonialsPreviewFromForm);
    }
    
    if (showRatingInput) {
        showRatingInput.addEventListener('change', updateTestimonialsPreviewFromForm);
    }
    
    if (showImageInput) {
        showImageInput.addEventListener('change', updateTestimonialsPreviewFromForm);
    }
    
    if (showTitleInput) {
        showTitleInput.addEventListener('change', updateTestimonialsPreviewFromForm);
    }
    
    if (showQuoteIconInput) {
        showQuoteIconInput.addEventListener('change', updateTestimonialsPreviewFromForm);
    }
}

function updateTestimonialsPreviewFromForm() {
    // Get current form values
    const bgColor = document.getElementById('testimonials-bg-color')?.value || '#f8f9fa';
    const accentColor = document.getElementById('testimonials-accent-color')?.value || '#F0B21B';
    const showRating = document.getElementById('testimonials-show-rating')?.checked || false;
    const showImage = document.getElementById('testimonials-show-image')?.checked || false;
    const showTitle = document.getElementById('testimonials-show-title')?.checked || false;
    const showQuoteIcon = document.getElementById('testimonials-show-quote-icon')?.checked || false;
    
    const settings = {
        bgColor,
        accentColor,
        showRating,
        showImage,
        showTitle,
        showQuoteIcon
    };
    
    console.log('Real-time preview update:', settings);
    updateTestimonialsPreview(settings);
}

function handleTestimonialsDesignFormSubmit(event) {
    event.preventDefault();
    console.log('Testimonials design form submitted');
    
    const formData = new FormData(event.target);
    const designData = Object.fromEntries(formData);
    console.log('Design data:', designData);
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Saving Settings...';
    submitButton.disabled = true;
    
    fetch('/api/cms/testimonials-design', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(designData),
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.success) {
            // Show success notification
            showNotification('Testimonials design settings saved successfully!', 'success');
            // Update preview
            updateTestimonialsPreview(designData);
        } else {
            showNotification('Failed to save design settings: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving testimonials design settings:', error);
        showNotification('Error saving design settings', 'error');
    })
    .finally(() => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function loadTestimonialsDesignSettings() {
    fetch('/api/cms/testimonials-design', {
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.settings) {
            const settings = data.settings;
            document.getElementById('testimonials-bg-color').value = settings.bgColor || '#f8f9fa';
            document.getElementById('testimonials-accent-color').value = settings.accentColor || '#F0B21B';
            document.getElementById('testimonials-show-rating').checked = settings.showRating || false;
            document.getElementById('testimonials-show-image').checked = settings.showImage || false;
            document.getElementById('testimonials-show-title').checked = settings.showTitle || false;
            document.getElementById('testimonials-show-quote-icon').checked = settings.showQuoteIcon || false;
            
            // Update preview
            updateTestimonialsPreview(settings);
        }
    })
    .catch(error => {
        console.error('Error loading testimonials design settings:', error);
    });
}

function updateTestimonialsPreview(settings) {
    console.log('Updating testimonials preview with settings:', settings);
    
    const preview = document.getElementById('testimonials-preview');
    if (preview) {
        preview.style.backgroundColor = settings.bgColor || '#f8f9fa';
        console.log('Updated preview background color:', settings.bgColor);
    }
    
    // Update preview content styling
    const previewContent = document.getElementById('testimonials-preview-content');
    if (previewContent) {
        const accentColor = settings.accentColor || '#F0B21B';
        console.log('Updating accent color to:', accentColor);
        
        // Find and update all elements with accent color
        const allElements = previewContent.querySelectorAll('*');
        allElements.forEach(element => {
            const style = element.style;
            const cssText = style.cssText;
            
            // Update elements that have #F0B21B in their inline styles
            if (cssText.includes('#F0B21B')) {
                style.cssText = cssText.replace(/#F0B21B/g, accentColor);
            }
            
            // Update elements that have rgb(240, 178, 27) in their inline styles
            if (cssText.includes('rgb(240, 178, 27)')) {
                style.cssText = cssText.replace(/rgb\(240, 178, 27\)/g, accentColor);
            }
        });
        
        // Update text color if available
        if (settings.textColor) {
            previewContent.style.color = settings.textColor;
        }
        
        console.log('Updated preview accent color:', accentColor);
    }
}

// Simple notification function
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    `;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.backgroundColor = '#007bff';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

function setupTestimonialEditForm() {
    const editForm = document.getElementById('testimonial-edit-form');
    console.log('Setting up testimonial edit form:', editForm);
    if (editForm) {
        editForm.addEventListener('submit', handleTestimonialEditFormSubmit);
    }
}

// Export functions for use in other modules
window.OrderCMS = {
    loadCMSData,
    loadContentTypes,
    loadRecentContent,
    loadMediaLibrary,
    loadPageStructure,
    loadTemplates,
    createContent,
    editContent,
    deleteContent,
    useMedia,
    deleteMedia,
    editPage,
    previewPage,
    publishPage,
    useTemplate,
    previewTemplate,
    initializeOrderCMS,
    handleAutoMessagesFormSubmit,
    handleHeaderOfferFormSubmit,
    renderAutoMessagesList,
    displayAutoMessages,
    editAutoMessage,
    deleteAutoMessage,
    closeEditModal,
    handleEditFormSubmit,
    loadHeaderOfferBarSettings,
    // Tab Navigation
    showTab,
    // Products Management
    fetchProducts,
    loadProducts,
    toggleProductFeatured,
    editProduct,
    deleteProduct,
    // Testimonials Management
    fetchTestimonials,
    loadTestimonials,
    editTestimonial,
    deleteTestimonial,
    setupTestimonialsForm,
    handleTestimonialFormSubmit,
    setupTestimonialsDesignForm,
    handleTestimonialsDesignFormSubmit,
    loadTestimonialsDesignSettings,
    updateTestimonialsPreview,
    setupTestimonialEditForm,
    handleTestimonialEditFormSubmit,
    closeTestimonialEditModal,
    setupTestimonialsPreviewListeners,
    updateTestimonialsPreviewFromForm,
    showNotification,
    // Projects Management
    fetchProjects,
    loadProjects,
    editProjectItem,
    cancelEdit,
    saveProjectItem,
    deleteProjectItem,
    setupProjectsForm,
    handleProjectsFormSubmit,
    setupThumbnailPreview,
    handleThumbnailPreview,
    clearThumbnailPreview,
    // About Us Management
    loadAboutContent,
    // Theme Management
    loadThemeSettings,
    // Messages Management
    loadContactMessages,
    markMessageRead,
    markMessageReplied,
    deleteMessage,
    // Hero Banner Management
    loadHeroBannerSettings,
    saveHeroBannerSettings,
    deleteHeroBannerImages,
    updateHeroBannerPreview,
    switchCarouselImage,
    startCarouselAutoPlay,
    stopCarouselAutoPlay,
    createCarouselDots,
    setupHeroBannerPreviewListeners,
    updateHeroBannerPreviewFromForm
};

// Make functions globally available for onclick handlers
window.editProjectItem = editProjectItem;
window.deleteProjectItem = deleteProjectItem;
window.removeHeroBannerImages = deleteHeroBannerImages; // Alias for the onclick handler
window.cancelEdit = cancelEdit;
window.saveProjectItem = saveProjectItem;
window.closeProjectEditModal = closeProjectEditModal;
window.switchCarouselImage = switchCarouselImage; // For carousel navigation

// Debug: Log that functions are available
console.log('Project functions made globally available:', {
    editProjectItem: typeof window.editProjectItem,
    deleteProjectItem: typeof window.deleteProjectItem,
    cancelEdit: typeof window.cancelEdit,
    saveProjectItem: typeof window.saveProjectItem,
    closeProjectEditModal: typeof window.closeProjectEditModal
});

