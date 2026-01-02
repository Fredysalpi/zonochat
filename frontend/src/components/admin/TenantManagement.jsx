import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TenantManagement.css';

const TenantManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        plan: 'free',
        maxAgents: 5,
        adminEmail: '',
        adminPassword: ''
    });

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tenants');
            setTenants(response.data.tenants);
        } catch (error) {
            console.error('Error cargando tenants:', error);
            alert('Error al cargar las empresas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();

        try {
            await api.post('/tenants', formData);
            alert('Empresa creada exitosamente');
            setShowCreateModal(false);
            resetForm();
            loadTenants();
        } catch (error) {
            console.error('Error creando tenant:', error);
            alert(error.response?.data?.error || 'Error al crear la empresa');
        }
    };

    const handleUpdateTenant = async (tenantId, updates) => {
        try {
            await api.put(`/tenants/${tenantId}`, updates);
            alert('Empresa actualizada exitosamente');
            loadTenants();
        } catch (error) {
            console.error('Error actualizando tenant:', error);
            alert('Error al actualizar la empresa');
        }
    };

    const handleDeleteTenant = async (tenantId) => {
        if (!confirm('¿Está seguro de desactivar esta empresa?')) return;

        try {
            await api.delete(`/tenants/${tenantId}`);
            alert('Empresa desactivada exitosamente');
            loadTenants();
        } catch (error) {
            console.error('Error eliminando tenant:', error);
            alert('Error al desactivar la empresa');
        }
    };

    const loadTenantStats = async (tenantId) => {
        try {
            const response = await api.get(`/tenants/${tenantId}/stats`);
            setSelectedTenant(response.data.stats);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subdomain: '',
            plan: 'free',
            maxAgents: 5,
            adminEmail: '',
            adminPassword: ''
        });
    };

    const getPlanBadgeClass = (plan) => {
        const classes = {
            free: 'plan-badge-free',
            basic: 'plan-badge-basic',
            pro: 'plan-badge-pro',
            enterprise: 'plan-badge-enterprise'
        };
        return classes[plan] || 'plan-badge-free';
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            active: 'status-badge-active',
            trial: 'status-badge-trial',
            suspended: 'status-badge-suspended',
            inactive: 'status-badge-inactive'
        };
        return classes[status] || 'status-badge-inactive';
    };

    if (loading) {
        return (
            <div className="tenant-management">
                <div className="loading-spinner">Cargando empresas...</div>
            </div>
        );
    }

    return (
        <div className="tenant-management">
            <div className="tenant-header">
                <h1>Gestión de Empresas</h1>
                <button
                    className="btn-create-tenant"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="fas fa-plus"></i> Nueva Empresa
                </button>
            </div>

            <div className="tenants-grid">
                {tenants.map(tenant => (
                    <div key={tenant.id} className="tenant-card">
                        <div className="tenant-card-header">
                            <div className="tenant-info">
                                <h3>{tenant.name}</h3>
                                <span className="tenant-subdomain">
                                    {tenant.subdomain}.zonochat.com
                                </span>
                            </div>
                            <div className="tenant-badges">
                                <span className={`plan-badge ${getPlanBadgeClass(tenant.plan)}`}>
                                    {tenant.plan.toUpperCase()}
                                </span>
                                <span className={`status-badge ${getStatusBadgeClass(tenant.status)}`}>
                                    {tenant.status}
                                </span>
                            </div>
                        </div>

                        <div className="tenant-stats">
                            <div className="stat-item">
                                <i className="fas fa-users"></i>
                                <div>
                                    <span className="stat-value">{tenant.total_agents || 0}</span>
                                    <span className="stat-label">Agentes</span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-user-check"></i>
                                <div>
                                    <span className="stat-value">{tenant.online_agents || 0}</span>
                                    <span className="stat-label">Online</span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-ticket-alt"></i>
                                <div>
                                    <span className="stat-value">{tenant.max_agents}</span>
                                    <span className="stat-label">Max Agentes</span>
                                </div>
                            </div>
                        </div>

                        <div className="tenant-actions">
                            <button
                                className="btn-view-stats"
                                onClick={() => loadTenantStats(tenant.id)}
                            >
                                <i className="fas fa-chart-bar"></i> Estadísticas
                            </button>
                            <button
                                className="btn-edit"
                                onClick={() => {
                                    setFormData({
                                        name: tenant.name,
                                        subdomain: tenant.subdomain,
                                        plan: tenant.plan,
                                        maxAgents: tenant.max_agents
                                    });
                                    setShowCreateModal(true);
                                }}
                            >
                                <i className="fas fa-edit"></i> Editar
                            </button>
                            {tenant.status === 'active' && (
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteTenant(tenant.id)}
                                >
                                    <i className="fas fa-ban"></i> Desactivar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Crear/Editar Empresa */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-building"></i> Nueva Empresa
                            </h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleCreateTenant}>
                            <div className="form-group">
                                <label>Nombre de la Empresa *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Mi Empresa S.A."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Subdominio *</label>
                                <div className="subdomain-input">
                                    <input
                                        type="text"
                                        value={formData.subdomain}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                        })}
                                        placeholder="miempresa"
                                        required
                                    />
                                    <span>.zonochat.com</span>
                                </div>
                                <small>Solo letras minúsculas, números y guiones</small>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Plan</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    >
                                        <option value="free">Free</option>
                                        <option value="basic">Basic</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Máximo de Agentes</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formData.maxAgents}
                                        onChange={(e) => setFormData({ ...formData, maxAgents: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email del Administrador *</label>
                                <input
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    placeholder="admin@miempresa.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Contraseña del Administrador *</label>
                                <input
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    placeholder="Mínimo 8 caracteres"
                                    minLength="8"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    <i className="fas fa-save"></i> Crear Empresa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Estadísticas */}
            {selectedTenant && (
                <div className="modal-overlay" onClick={() => setSelectedTenant(null)}>
                    <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-chart-bar"></i> Estadísticas - {selectedTenant.name}
                            </h2>
                            <button
                                className="modal-close"
                                onClick={() => setSelectedTenant(null)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <i className="fas fa-users stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.total_agents}</h3>
                                    <p>Total Agentes</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-user-check stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.online_agents}</h3>
                                    <p>Agentes Online</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-ticket-alt stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.total_tickets}</h3>
                                    <p>Total Tickets</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-tasks stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.active_tickets}</h3>
                                    <p>Tickets Activos</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-check-circle stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.resolved_tickets}</h3>
                                    <p>Tickets Resueltos</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-clock stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.queued_tickets}</h3>
                                    <p>En Cola</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-broadcast-tower stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.active_channels}</h3>
                                    <p>Canales Activos</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-network-wired stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedTenant.total_channels}</h3>
                                    <p>Total Canales</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManagement;
