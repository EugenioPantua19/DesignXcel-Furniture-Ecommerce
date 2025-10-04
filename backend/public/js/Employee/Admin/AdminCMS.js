// Admin CMS JavaScript
// Handles content management system functionality for admin users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin CMS functionality
    initializeAdminCMS();
    
    // Load CMS data
    loadCMSData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeAdminCMS() {
    console.log('Initializing Admin CMS...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has content management permissions
        if (!window.userPermissions.hasPermission('content')) {
            console.log('User does not have content management permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeAdminCMS, 100);
        return;
    }
    
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
        if (e.target.classList.contains('btn-edit')) {
            const contentId = e.target.getAttribute('data-id');
            editContent(contentId);
        }
        
        if (e.target.classList.contains('btn-preview')) {
            const contentId = e.target.getAttribute('data-id');
            previewContent(contentId);
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
        if (e.target.classList.contains('btn-edit')) {
            const pageId = e.target.getAttribute('data-id');
            editPage(pageId);
        }
        
        if (e.target.classList.contains('btn-preview')) {
            const pageId = e.target.getAttribute('data-id');
            previewPage(pageId);
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
    window.location.href = `/Employee/Admin/CMS/ContentType/${typeId}`;
}

function createContent(typeId) {
    window.location.href = `/Employee/Admin/CMS/CreateContent?type=${typeId}`;
}

function editContent(contentId) {
    window.location.href = `/Employee/Admin/CMS/EditContent/${contentId}`;
}

function previewContent(contentId) {
    window.open(`/Employee/Admin/CMS/PreviewContent/${contentId}`, '_blank');
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
    window.location.href = `/Employee/Admin/CMS/EditPage/${pageId}`;
}

function previewPage(pageId) {
    window.open(`/Employee/Admin/CMS/PreviewPage/${pageId}`, '_blank');
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
    window.location.href = `/Employee/Admin/CMS/CreatePage?template=${templateId}`;
}

function previewTemplate(templateId) {
    window.open(`/Employee/Admin/CMS/PreviewTemplate/${templateId}`, '_blank');
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

// Export functions for use in other modules
window.AdminCMS = {
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
    initializeAdminCMS
};