import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../shared/services/api/apiClient';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Bars } from 'react-loader-spinner';
import { EditIcon, TrashIcon, CameraIcon, UploadIcon } from '../../../shared/components/ui/SvgIcons';
// LoadingSpinner and InlineLoader removed as requested
import { getImageUrl } from '../../../shared/utils/imageUtils';

const ProfileManagement = () => {
  const [profile, setProfile] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    gender: '' 
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isCustomer, setIsCustomer] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Monitor editingProfile state changes
  useEffect(() => {
    console.log('editingProfile state changed to:', editingProfile);
  }, [editingProfile]);



  // Fetch profile on mount
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        // Try customer endpoint first
        let profRes;
        try {
          profRes = await apiClient.get('/api/customer/profile');
        } catch (err) {
          if (err.message && err.message.toLowerCase().includes('404')) {
            profRes = null;
          } else {
            throw err;
          }
        }
        if (profRes && profRes.success && profRes.customer) {
          // Transform backend data to match frontend expectations
          const customerData = profRes.customer;
          const fullName = customerData.FullName || '';
          const nameParts = fullName.split(' ');
          if (isMounted) {
            setProfile({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: customerData.Email || '',
              phone: customerData.PhoneNumber || '',
              gender: customerData.Gender || ''
            });
            // Persist profile image between sessions/refreshes
            setProfileImage(customerData.ProfileImage || null);
            // Optionally reflect in auth context so other parts can use it
            if (setUser && user) {
              setUser({
                ...user,
                profilePicture: customerData.ProfileImage || null
              });
            }
            setIsCustomer(true);
          }
        } else {
          // Not a customer, try user endpoint
          let userRes;
          try {
            userRes = await apiClient.get('/api/user/profile');
          } catch (err) {
            setMessage('Failed to load profile.');
            setIsCustomer(false);
            return;
          }
          if (userRes && userRes.success && userRes.user) {
            // Transform backend data to match frontend expectations
            const userData = userRes.user;
            const fullName = userData.fullName || '';
            const nameParts = fullName.split(' ');
            if (isMounted) {
              setProfile({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: userData.email || '',
                phone: userData.phoneNumber || '',
                gender: userData.gender || ''
              });
              setIsCustomer(false);
            }
          } else {
            if (isMounted) {
              setMessage('Failed to load profile.');
              setIsCustomer(false);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setMessage('Failed to load profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Profile update
  const handleProfileChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload image
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await apiClient.post('/api/customer/upload-profile-image', formData, {
        headers: {
          // Don't set Content-Type - let axios set it automatically for FormData
        },
      });

      if (response.success) {
        setProfileImage(response.imageUrl);
        setMessage('Profile image updated successfully!');
        
        // Update user context
        if (setUser && user) {
          setUser({
            ...user,
            profilePicture: response.imageUrl
          });
        }
      } else {
        setMessage(response.message || 'Failed to upload image.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setMessage('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true);
      const response = await apiClient.delete('/api/customer/remove-profile-image');
      
      if (response.success) {
        setProfileImage(null);
        setImagePreview(null);
        setMessage('Profile image removed successfully!');
        
        // Update user context
        if (setUser && user) {
          setUser({
            ...user,
            profilePicture: null
          });
        }
      } else {
        setMessage(response.message || 'Failed to remove image.');
      }
    } catch (error) {
      console.error('Remove image error:', error);
      setMessage('Failed to remove image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    
    // Validate required fields
    if (!profile.firstName || !profile.lastName || !profile.email) {
      setMessage('Please fill in all required fields.');
      return;
    }
    
    if (!profile.gender) {
      setMessage('Please select a gender.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      
      if (isCustomer) {
        const res = await apiClient.put('/api/customer/profile', {
          fullName: fullName,
          email: profile.email,
          phoneNumber: profile.phone,
          gender: profile.gender
        });
        
        if (res.success) {
          setMessage('Profile updated successfully.');
          // Update user context if available
          if (setUser && user) {
            setUser({
              ...user,
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email
            });
          }
        } else {
          setMessage(res.message || 'Failed to update profile.');
        }
      } else {
        const res = await apiClient.put('/api/user/profile', {
          fullName: fullName,
          email: profile.email,
          phoneNumber: profile.phone,
          gender: profile.gender
        });
        
        if (res.success) {
          setMessage('Profile updated successfully.');
          // Update user context if available
          if (setUser && user) {
            setUser({
              ...user,
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email
            });
          }
        } else {
          setMessage(res.message || 'Failed to update profile.');
        }
      }
      setEditingProfile(false);
    } catch (err) {
      setMessage(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <Bars 
          color="#F0B21B" 
          height={window.innerWidth < 768 ? 32 : 40} 
          width={window.innerWidth < 768 ? 32 : 40} 
        />
        <div style={{ 
          fontSize: window.innerWidth < 768 ? '14px' : '16px', 
          color: '#6b7280', 
          marginTop: '16px',
          fontWeight: '500',
          maxWidth: '280px',
          lineHeight: '1.5'
        }}>
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-management">
      <div className="section-header">
        <div>
          <h2 className="section-title">Personal Information</h2>
          <p className="section-subtitle">Manage your personal details and preferences</p>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}



      {/* Profile Picture Section */}
      <div className="profile-picture-container">
        <div className="profile-picture">
          {imagePreview || user?.profilePicture || profileImage ? (
            <img 
              src={getImageUrl(imagePreview || user?.profilePicture || profileImage)} 
              alt="Profile" 
            />
          ) : (
            <div className="profile-picture-placeholder">
              {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          
          <div className="profile-picture-actions">
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={uploadingImage}
            />
            <label htmlFor="profile-image-upload" className="edit-picture-btn" title="Upload new image">
              <CameraIcon size={16} color="#ffffff" />
            </label>
            
            {(user?.profilePicture || profileImage) && (
              <button 
                className="remove-picture-btn" 
                type="button"
                onClick={handleRemoveImage}
                disabled={uploadingImage}
                title="Remove image"
              >
                <TrashIcon size={16} color="#ffffff" />
              </button>
            )}
          </div>
        </div>
        
        <div className="profile-picture-info">
          <p className="image-upload-hint">
            Click the edit button to upload a new profile picture. 
            Maximum file size: 5MB. Supported formats: JPG, PNG, GIF.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form className="account-form" onSubmit={handleProfileUpdate}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input 
              className="form-input" 
              name="firstName" 
              type="text" 
              value={profile.firstName || ''} 
              onChange={handleProfileChange} 
              disabled={loading || !editingProfile} 
              placeholder="Ex. John"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input 
              className="form-input" 
              name="lastName" 
              type="text" 
              value={profile.lastName || ''} 
              onChange={handleProfileChange} 
              disabled={loading || !editingProfile} 
              placeholder="Ex. Doe"
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input 
            className="form-input" 
            name="email" 
            type="email" 
            value={profile.email || ''} 
            onChange={handleProfileChange} 
            disabled={loading || !editingProfile} 
            placeholder="example@gmail.com"
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input 
            className="form-input" 
            name="phone" 
            type="tel" 
            value={profile.phone || ''} 
            onChange={handleProfileChange} 
            disabled={loading || !editingProfile} 
            placeholder="+0123-456-789"
            required={isCustomer} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Gender *</label>
          <select 
            className="form-input" 
            name="gender" 
            value={profile.gender || ''} 
            onChange={handleProfileChange} 
            disabled={loading || !editingProfile}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="form-actions">
          {editingProfile ? (
            <>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Changes'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setEditingProfile(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                console.log('Edit Profile clicked - current state:', { editingProfile, loading });
                setEditingProfile(true);
                console.log('Set editingProfile to true');
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileManagement;