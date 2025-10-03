document.addEventListener('DOMContentLoaded', function() {
    // Check permissions before initializing
    if (window.userPermissions) {
        if (!window.userPermissions.hasPermission('materials')) {
            console.log('User does not have materials permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        window.userPermissions.updateUI();
    }
    // Add Material Modal
    document.getElementById('addMaterialBtn').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('addMaterialModal').style.display = 'block';
    });
    document.getElementById('cancelAddMaterial').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('addMaterialModal').style.display = 'none';
    });
    document.querySelector('#addMaterialModal .close-button').addEventListener('click', function() {
        document.getElementById('addMaterialModal').style.display = 'none';
    });
    window.onclick = function(event) {
        const addModal = document.getElementById('addMaterialModal');
        const editModal = document.getElementById('editMaterialModal');
        if (event.target === addModal && addModal) {
            addModal.style.display = 'none';
        }
        if (event.target === editModal && editModal) {
            editModal.style.display = 'none';
        }
    }
    // Edit Material Modal
    const editMaterialModal = document.getElementById('editMaterialModal');
    const closeEditMaterialModal = document.getElementById('closeEditMaterialModal');
    const cancelEditMaterial = document.getElementById('cancelEditMaterial');
    document.querySelectorAll('.edit-material-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('editMaterialID').value = btn.getAttribute('data-id');
            document.getElementById('editMaterialName').value = btn.getAttribute('data-name');
            document.getElementById('editQuantityAvailable').value = btn.getAttribute('data-quantity');
            document.getElementById('editUnit').value = btn.getAttribute('data-unit');
            editMaterialModal.style.display = 'block';
        });
    });
    closeEditMaterialModal.addEventListener('click', function() {
        editMaterialModal.style.display = 'none';
    });
    cancelEditMaterial.addEventListener('click', function(event) {
        event.preventDefault();
        editMaterialModal.style.display = 'none';
    });
    window.addEventListener('click', function(event) {
        if (event.target == editMaterialModal) {
            editMaterialModal.style.display = 'none';
        }
    });
    // Delete Material Confirmation Modal
    const deleteMaterialConfirmationModal = document.getElementById('deleteMaterialConfirmationModal');
    const cancelMaterialDeleteBtn = document.getElementById('cancelMaterialDelete');
    const confirmMaterialDeleteBtn = document.getElementById('confirmMaterialDelete');
    let deleteMaterialForm = null;
    document.querySelectorAll('.delete-material-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            deleteMaterialForm = this.closest('form');
            deleteMaterialConfirmationModal.classList.add('show');
        });
    });
    cancelMaterialDeleteBtn.addEventListener('click', function() {
        deleteMaterialConfirmationModal.classList.remove('show');
        deleteMaterialForm = null;
    });
    confirmMaterialDeleteBtn.addEventListener('click', function() {
        if (deleteMaterialForm) {
            deleteMaterialForm.submit();
        }
        deleteMaterialConfirmationModal.classList.remove('show');
        deleteMaterialForm = null;
    });
    window.addEventListener('click', function(event) {
        if (event.target === deleteMaterialConfirmationModal) {
            deleteMaterialConfirmationModal.classList.remove('show');
            deleteMaterialForm = null;
        }
    });
    // Custom popup
    function showCustomPopup(message, isError = false) {
        const popup = document.getElementById('customPopup');
        const popupMessage = popup.querySelector('.custom-popup-message');
        const popupIcon = popup.querySelector('.custom-popup-icon');
        popupMessage.textContent = message;
        popupIcon.textContent = isError ? '✕' : '✓';
        popup.className = 'custom-popup' + (isError ? ' error' : '');
        popup.style.display = 'block';
        setTimeout(() => {
            popup.classList.add('hide');
            setTimeout(() => {
                popup.style.display = 'none';
                popup.classList.remove('hide');
            }, 500);
        }, 3000);
    }
}); 