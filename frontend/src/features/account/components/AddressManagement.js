import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../shared/services/api/apiClient';
import { LoadingSpinner, InlineLoader } from '../../../shared/components/ui';

const emptyForm = {
    label: '',
    houseNumber: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    postalCode: '',
    country: 'Philippines',
    isDefault: false
};

const AddressManagement = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [defaultSettingId, setDefaultSettingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const defaultAddressId = useMemo(() => addresses.find(a => a.IsDefault)?.AddressID || null, [addresses]);

    const fetchAddresses = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/api/customer/addresses');
            if (res.success && Array.isArray(res.addresses)) {
                setAddresses(res.addresses);
            } else {
                setAddresses([]);
            }
        } catch (e) {
            setError('Failed to load addresses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAddresses(); }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const onChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const required = ['label', 'street', 'city', 'province', 'postalCode'];
        for (const key of required) {
            if (!String(form[key] || '').trim()) return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setError('Please complete all required fields.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await apiClient.put(`/api/customer/addresses/${editingId}`, form);
            } else {
                await apiClient.post('/api/customer/addresses', form);
            }
            await fetchAddresses();
            resetForm();
        } catch (e) {
            setError('Failed to save address.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (address) => {
        setEditingId(address.AddressID);
        setForm({
            label: address.Label || '',
            houseNumber: address.HouseNumber || '',
            street: address.Street || '',
            barangay: address.Barangay || '',
            city: address.City || '',
            province: address.Province || '',
            region: address.Region || '',
            postalCode: address.PostalCode || '',
            country: address.Country || 'Philippines',
            isDefault: !!address.IsDefault
        });
    };

    const handleDelete = async (addressId) => {
        setDeletingId(addressId);
        setError('');
        try {
            await apiClient.delete(`/api/customer/addresses/${addressId}`);
            await fetchAddresses();
        } catch (e) {
            setError('Failed to delete address.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (addressId) => {
        setDefaultSettingId(addressId);
        setError('');
        try {
            // Update existing address as default
            const address = addresses.find(a => a.AddressID === addressId);
            if (!address) return;
            await apiClient.put(`/api/customer/addresses/${addressId}`, {
                label: address.Label,
                houseNumber: address.HouseNumber,
                street: address.Street,
                barangay: address.Barangay,
                city: address.City,
                province: address.Province,
                region: address.Region,
                postalCode: address.PostalCode,
                country: address.Country || 'Philippines',
                isDefault: true
            });
            await fetchAddresses();
        } catch (e) {
            setError('Failed to set default address.');
        } finally {
            setDefaultSettingId(null);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: 12 }}>Manage Addresses</h2>

            {error && (
                <div className="error-alert" style={{ marginBottom: 12 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <LoadingSpinner size="large" text="Loading addresses..." color="#F0B21B" />
                </div>
            ) : (
                <div className="address-grid">
                    {addresses.length === 0 ? (
                        <div className="no-address-message">
                            You have no saved addresses. Add one below.
                        </div>
                    ) : (
                        addresses.map(addr => (
                            <div key={addr.AddressID} className="address-card">
                                <div className="address-card-header">
                                    <div>
                                        <span className="label-badge">{addr.Label || 'Address'}</span>
                                        {addr.IsDefault && <span className="default-badge" style={{ marginLeft: 8 }}>Default</span>}
                                    </div>
                                    <div className="address-card-actions">
                                        <InlineLoader isLoading={defaultSettingId === addr.AddressID} text="Setting..." size="small">
                                            <button 
                                                className="btn-secondary-small"
                                                disabled={addr.IsDefault}
                                                onClick={() => handleSetDefault(addr.AddressID)}
                                            >
                                                Set Default
                                            </button>
                                        </InlineLoader>
                                        <button 
                                            className="btn-secondary-small"
                                            onClick={() => handleEdit(addr)}
                                        >
                                            Edit
                                        </button>
                                        <InlineLoader isLoading={deletingId === addr.AddressID} text="Deleting..." size="small">
                                            <button 
                                                className="btn-danger-small"
                                                onClick={() => handleDelete(addr.AddressID)}
                                            >
                                                Delete
                                            </button>
                                        </InlineLoader>
                                    </div>
                                </div>
                                <div className="address-card-body">
                                    <div className="address-name">
                                        {[addr.FirstName, addr.LastName].filter(Boolean).join(' ') || ''}
                                    </div>
                                    <div className="address-full">
                                        {[addr.HouseNumber, addr.Street, addr.Barangay, addr.City, addr.Province, addr.Region, addr.PostalCode, addr.Country || 'Philippines']
                                            .filter(Boolean).join(', ')}
                                    </div>
                                    {addr.PhoneNumber && (
                                        <div className="address-phone">{addr.PhoneNumber}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="address-form" style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 8 }}>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Label*</label>
                            <input value={form.label} onChange={e => onChange('label', e.target.value)} placeholder="Home, Office" />
                        </div>
                        <div className="form-field">
                            <label>House Number</label>
                            <input value={form.houseNumber} onChange={e => onChange('houseNumber', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Street*</label>
                            <input value={form.street} onChange={e => onChange('street', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Barangay</label>
                            <input value={form.barangay} onChange={e => onChange('barangay', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>City*</label>
                            <input value={form.city} onChange={e => onChange('city', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Province*</label>
                            <input value={form.province} onChange={e => onChange('province', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Region</label>
                            <input value={form.region} onChange={e => onChange('region', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Postal Code*</label>
                            <input value={form.postalCode} onChange={e => onChange('postalCode', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Country</label>
                            <input value={form.country} onChange={e => onChange('country', e.target.value)} />
                        </div>
                        <div className="form-field checkbox">
                            <label>
                                <input type="checkbox" checked={form.isDefault} onChange={e => onChange('isDefault', e.target.checked)} />
                                <span style={{ marginLeft: 6 }}>Set as default</span>
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <InlineLoader isLoading={saving} text={editingId ? 'Saving...' : 'Adding...'} size="small">
                            <button className="btn-primary" type="submit" disabled={saving}>
                                {editingId ? 'Save Changes' : 'Add Address'}
                            </button>
                        </InlineLoader>
                        {editingId && (
                            <button type="button" className="btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressManagement;


