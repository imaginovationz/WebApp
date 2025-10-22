import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import functionalfrontendconfig from './functionalfrontendconfig';
import '../../styles/RecordEntry.css';

const DeletionPage = () => {
    const history = useNavigate();
    const [deletionType, setDeletionType] = useState('');
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Deletion type options
    const deletionTypeOptions = {
        'resource': 'Resource',
        'project': 'Project (Coming Soon)',
        'allocation': 'Resource Allocation (Coming Soon)'
    };

    // Check user role and authorization on component mount
    useEffect(() => {
        const storedSession = localStorage.getItem('cbptSession');
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                const currentRole = session.role || '';
                setUserRole(currentRole);
                
                // Check if user is admin (case insensitive)
                const isAdmin = currentRole.toLowerCase() === 'admin';
                setIsAuthorized(isAdmin);
                
                if (!isAdmin) {
                    setErrorMessage('Access Denied: Only Admin users can delete records.');
                }
            } catch (error) {
                console.error('Error parsing session data:', error);
                setErrorMessage('Session error. Please login again.');
                setIsAuthorized(false);
            }
        } else {
            setErrorMessage('No valid session found. Please login.');
            setIsAuthorized(false);
        }
    }, []);

    // Fetch resources when deletion type is 'resource'
    useEffect(() => {
        if (deletionType === 'resource') {
            fetchResources();
        } else {
            setResources([]);
            setSelectedResource('');
        }
    }, [deletionType]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${functionalfrontendconfig.backendUrl}/resources`);
            setResources(response.data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setErrorMessage('Error fetching resources. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletionTypeChange = (e) => {
        setDeletionType(e.target.value);
        setSelectedResource('');
        setErrorMessage('');
    };

    const handleResourceChange = (e) => {
        setSelectedResource(e.target.value);
        setErrorMessage('');
    };

    const handleDeleteClick = () => {
        // Double-check authorization
        if (!isAuthorized) {
            setErrorMessage('Access Denied: Only Admin users can delete records.');
            return;
        }
        
        if (!selectedResource) {
            setErrorMessage('Please select a resource to delete.');
            return;
        }
        setShowConfirmation(true);
    };

    const confirmDelete = async () => {
        // Final authorization check before deletion
        if (!isAuthorized) {
            setErrorMessage('Access Denied: Only Admin users can delete records.');
            setShowConfirmation(false);
            return;
        }
        
        try {
            setLoading(true);
            setShowConfirmation(false);
            
            // API call to delete resource
            const response = await axios.delete(
                `${functionalfrontendconfig.backendUrl}/resources/${encodeURIComponent(selectedResource)}`
            );

            if (response.status === 200) {
                setErrorMessage(''); // Clear any previous errors
                alert(`Resource "${selectedResource}" has been successfully deleted.`);
                setSelectedResource('');
                // Refresh the resources list
                fetchResources();
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setErrorMessage(`Error: ${error.response.data.message}`);
            } else {
                setErrorMessage('Error deleting resource. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowConfirmation(false);
    };

    const handleGoBack = () => {
        history.push('/');
    };

    return (
        <div className="form-page" style={{ minHeight: '95vh', minWidth: '98vw', padding: 24 }}>
            {loading && <div className="loading-spinner"></div>}
            {errorMessage && (
                <div className="error-message" style={{
                    color: '#ffffff',
                    background: '#C41F3E',
                    borderRadius: 4,
                    padding: '10px 16px',
                    margin: '12px 0',
                }}>
                    {errorMessage}
                </div>
            )}
            {!loading && (
                <>
                    <h1>Record Delete Page</h1>
                    
                    {/* Show authorization message if not admin */}
                    {!isAuthorized && (
                        <div style={{
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            padding: '15px',
                            margin: '20px 0',
                            textAlign: 'center'
                        }}>
                            <h3>🚫 Access Restricted</h3>
                            <p>Only users with <strong>Admin</strong> role can delete records.</p>
                            <p>Your current role: <strong>{userRole || 'Unknown'}</strong></p>
                            <p>Please contact an administrator if you need to delete records.</p>
                        </div>
                    )}

                    {/* Only show deletion interface if authorized */}
                    {isAuthorized && (
                        <>
                            <div className="form-type-row">
                                <label htmlFor="deletionType">Select Record Type to be deleted:</label>
                                <select id="deletionType" className="select-form-type-row" value={deletionType} onChange={handleDeletionTypeChange}>
                                    <option value="">Select</option>
                                    {Object.entries(deletionTypeOptions).map(([value, label]) => (
                                        <option key={value} value={value} disabled={value !== 'resource'}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Resource Selection - Only show when deletion type is 'resource' */}
                            {deletionType === 'resource' && (
                                <div className="form-type-row">
                                    <label htmlFor="resource-select">Select Resource to Delete:</label>
                                    <select 
                                        id="resource-select" 
                                        value={selectedResource} 
                                        onChange={handleResourceChange}
                                        disabled={loading}
                                    >
                                        <option value="">Choose a resource to delete...</option>
                                        {resources.map((resource, index) => (
                                            <option key={index} value={resource.name}>
                                                {resource.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Coming Soon Message for other types */}
                            {deletionType && deletionType !== 'resource' && (
                                <div style={{ 
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    border: '2px dashed #dee2e6',
                                    marginTop: '20px',
                                    color: '#6c757d'
                                }}>
                                    <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
                                        🚧 This deletion type is coming soon!
                                    </p>
                                    <p style={{ margin: '10px 0' }}>
                                        Currently, only resource deletion is available.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="button-row" style={{ marginTop: '20px' }}>
                        {isAuthorized && deletionType === 'resource' && (
                            <button 
                                onClick={handleDeleteClick}
                                disabled={loading || !selectedResource}
                                className="back-button"
                                style={{ 
                                    backgroundColor: '#dc3545',
                                    marginRight: '10px'
                                }}
                            >
                                {loading ? 'Processing...' : 'Delete Resource'}
                            </button>
                        )}
                        <button onClick={handleGoBack} className="back-button">Back to Main Menu</button>
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '2rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '20px' }}>
                            Confirm Deletion
                        </h3>
                        <p style={{ color: '#666', marginBottom: '15px', lineHeight: '1.5' }}>
                            Are you sure you want to delete the resource 
                            <strong> "{selectedResource}"</strong>?
                        </p>
                        <p style={{ 
                            color: '#e67e22', 
                            fontWeight: 'bold', 
                            fontSize: '14px', 
                            marginTop: '10px',
                            marginBottom: '25px'
                        }}>
                            ⚠️ This action cannot be undone!
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button 
                                onClick={confirmDelete}
                                disabled={loading}
                                style={{ 
                                    backgroundColor: '#dc3545',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button 
                                onClick={cancelDelete}
                                disabled={loading}
                                style={{ 
                                    backgroundColor: '#6c757d',
                                    padding: '10px 20px',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeletionPage;
