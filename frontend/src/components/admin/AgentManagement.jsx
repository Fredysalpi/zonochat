import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AgentManagement.css';

const AgentManagement = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAgentId, setEditingAgentId] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'agent',
        assignedChannels: [],
        maxConcurrentTickets: 5
    });

    const availableChannels = [
        {
            id: 'messenger',
            name: 'Messenger',
            icon: '/img/facebook.png',
            color: '#0084ff'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: '/img/whatsapp.png',
            color: '#25d366'
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: '/img/instagram.png',
            color: '#e4405f'
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: '/img/telegram.png',
            color: '#0088cc'
        }
    ];

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/agents');
            setAgents(response.data.agents);
        } catch (error) {
            console.error('Error cargando agentes:', error);
            alert('Error al cargar los agentes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                // Editar agente - no enviar password si está vacío
                const updateData = {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    role: formData.role,
                    assigned_channels: formData.assignedChannels,
                    max_concurrent_tickets: formData.maxConcurrentTickets
                };

                // Solo incluir password si se ingresó uno nuevo
                if (formData.password && formData.password.trim() !== '') {
                    updateData.password = formData.password;
                }

                await api.put(`/agents/${editingAgentId}`, updateData);
                alert('Agente actualizado exitosamente');
            } else {
                // Crear agente nuevo
                await api.post('/agents', formData);
                alert('Agente creado exitosamente');
            }

            setShowModal(false);
            resetForm();
            loadAgents();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.error || 'Error al procesar la solicitud');
        }
    };

    const handleEdit = (agent) => {
        // Parsear assigned_channels si es string
        let channels = agent.assigned_channels;
        if (typeof channels === 'string') {
            try {
                channels = JSON.parse(channels);
            } catch (e) {
                channels = [];
            }
        }
        if (!Array.isArray(channels)) {
            channels = [];
        }

        setIsEditing(true);
        setEditingAgentId(agent.id);
        setFormData({
            email: agent.email,
            password: '', // Dejar vacío
            firstName: agent.first_name,
            lastName: agent.last_name,
            role: agent.role,
            assignedChannels: channels,
            maxConcurrentTickets: agent.max_concurrent_tickets
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setIsEditing(false);
        setEditingAgentId(null);
        resetForm();
        setShowModal(true);
    };

    const handleToggleActive = async (agentId, currentStatus) => {
        const action = currentStatus ? 'desactivar' : 'activar';
        if (!confirm(`¿Está seguro de ${action} este agente?`)) return;

        try {
            await api.put(`/agents/${agentId}`, { is_active: !currentStatus });
            alert(`Agente ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
            loadAgents();
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al ${action} el agente`);
        }
    };

    const handleDelete = async (agentId) => {
        if (!confirm('¿Está seguro de eliminar permanentemente este agente? Esta acción no se puede deshacer.')) return;

        try {
            await api.delete(`/agents/${agentId}`);
            alert('Agente eliminado exitosamente');
            loadAgents();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el agente');
        }
    };

    const loadAgentStats = async (agentId) => {
        try {
            const response = await api.get(`/agents/${agentId}/stats`);
            setSelectedAgent({
                ...agents.find(a => a.id === agentId),
                stats: response.data.stats
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const toggleChannel = (channelId) => {
        setFormData(prev => ({
            ...prev,
            assignedChannels: prev.assignedChannels.includes(channelId)
                ? prev.assignedChannels.filter(c => c !== channelId)
                : [...prev.assignedChannels, channelId]
        }));
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: 'agent',
            assignedChannels: [],
            maxConcurrentTickets: 5
        });
        setIsEditing(false);
        setEditingAgentId(null);
    };

    const getStatusClass = (status) => {
        const classes = {
            online: 'status-online',
            offline: 'status-offline',
            busy: 'status-busy',
            away: 'status-away'
        };
        return classes[status] || 'status-offline';
    };

    const getStatusIcon = (status) => {
        const icons = {
            online: 'fa-circle',
            offline: 'fa-circle',
            busy: 'fa-circle',
            away: 'fa-moon'
        };
        return icons[status] || 'fa-circle';
    };

    if (loading) {
        return (
            <div className="agent-management">
                <div className="loading-spinner">Cargando agentes...</div>
            </div>
        );
    }

    return (
        <div className="agent-management">
            <div className="agent-header">
                <h1>Gestión de Agentes</h1>
                <button className="btn-create-agent" onClick={handleCreate}>
                    <i className="fas fa-user-plus"></i> Nuevo Agente
                </button>
            </div>

            <div className="agents-grid">
                {agents.map(agent => (
                    <div key={agent.id} className={`agent-card ${!agent.is_active ? 'inactive' : ''}`}>
                        <div className="agent-card-header">
                            <div className="agent-avatar-container">
                                {agent.avatar ? (
                                    <img src={agent.avatar} alt={agent.first_name} className="agent-avatar" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {agent.first_name[0]}{agent.last_name[0]}
                                    </div>
                                )}
                                <span className={`status-indicator ${getStatusClass(agent.status)}`}>
                                    <i className={`fas ${getStatusIcon(agent.status)}`}></i>
                                </span>
                            </div>
                            <div className="agent-info">
                                <h3>{agent.first_name} {agent.last_name}</h3>
                                <p className="agent-email">{agent.email}</p>
                                <div className="badges-row">
                                    <span className={`role-badge role-${agent.role}`}>
                                        {agent.role === 'agent' ? 'Agente' :
                                            agent.role === 'supervisor' ? 'Supervisor' : 'Admin'}
                                    </span>
                                    {!agent.is_active && (
                                        <span className="inactive-badge">Inactivo</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="agent-channels">
                            <label>Canales:</label>
                            <div className="channels-list">
                                {(() => {
                                    console.log('🎯 RENDERIZANDO CANALES PARA:', agent.first_name);
                                    console.log('🎯 assigned_channels:', agent.assigned_channels);
                                    console.log('🎯 Es array?:', Array.isArray(agent.assigned_channels));
                                    console.log('🎯 Length:', agent.assigned_channels?.length);

                                    if (!agent.assigned_channels || !Array.isArray(agent.assigned_channels) || agent.assigned_channels.length === 0) {
                                        console.log('❌ NO HAY CANALES - Mostrando "Sin canales"');
                                        return <span className="no-channels">Sin canales</span>;
                                    }

                                    console.log('✅ HAY CANALES - Renderizando:', agent.assigned_channels);

                                    return agent.assigned_channels.map(channelId => {
                                        const channel = availableChannels.find(c => c.id === channelId);
                                        console.log('🔎 Canal ID:', channelId, '→ Encontrado:', channel?.name);

                                        if (!channel) {
                                            console.warn('⚠️ Canal no encontrado:', channelId);
                                            return null;
                                        }

                                        return (
                                            <span
                                                key={channelId}
                                                className="channel-badge"
                                                style={{ borderColor: channel.color }}
                                                title={channel.name}
                                            >
                                                <img
                                                    src={channel.icon}
                                                    alt={channel.name}
                                                    className="channel-icon"
                                                />
                                                {channel.name}
                                            </span>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className="agent-stats">
                            <div className="stat-item">
                                <i className="fas fa-ticket-alt"></i>
                                <div>
                                    <span className="stat-value">
                                        {agent.current_tickets_count}/{agent.max_concurrent_tickets}
                                    </span>
                                    <span className="stat-label">Tickets Activos</span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-check-circle"></i>
                                <div>
                                    <span className="stat-value">{agent.available_slots}</span>
                                    <span className="stat-label">Slots Disponibles</span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-chart-line"></i>
                                <div>
                                    <span className="stat-value">{agent.total_tickets_handled || 0}</span>
                                    <span className="stat-label">Total Manejados</span>
                                </div>
                            </div>
                        </div>

                        <div className="agent-actions">
                            <button
                                className="btn-view-stats"
                                onClick={() => loadAgentStats(agent.id)}
                            >
                                <i className="fas fa-chart-bar"></i> Stats
                            </button>
                            <button
                                className="btn-edit"
                                onClick={() => handleEdit(agent)}
                            >
                                <i className="fas fa-edit"></i> Editar
                            </button>
                            <button
                                className={agent.is_active ? "btn-deactivate" : "btn-activate"}
                                onClick={() => handleToggleActive(agent.id, agent.is_active)}
                            >
                                <i className={`fas ${agent.is_active ? 'fa-ban' : 'fa-check-circle'}`}></i>
                                {agent.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                                className="btn-delete"
                                onClick={() => handleDelete(agent.id)}
                            >
                                <i className="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Crear/Editar Agente */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className={`fas ${isEditing ? 'fa-user-edit' : 'fa-user-plus'}`}></i>
                                {isEditing ? 'Editar Agente' : 'Nuevo Agente'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="Juan"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Apellido *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Pérez"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="agente@empresa.com"
                                    required
                                    disabled={isEditing}
                                />
                                {isEditing && <small>El email no se puede modificar</small>}
                            </div>

                            <div className="form-group">
                                <label>Contraseña {!isEditing && '*'}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
                                    minLength="8"
                                    required={!isEditing}
                                />
                                {isEditing && <small>Dejar vacío si no desea cambiar la contraseña</small>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="agent">Agente</option>
                                        <option value="supervisor">Supervisor</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Máximo de Tickets Simultáneos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={formData.maxConcurrentTickets}
                                        onChange={(e) => setFormData({ ...formData, maxConcurrentTickets: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Canales Asignados *</label>
                                <div className="channels-selector">
                                    {availableChannels.map(channel => (
                                        <div
                                            key={channel.id}
                                            className={`channel-option ${formData.assignedChannels.includes(channel.id) ? 'selected' : ''}`}
                                            onClick={() => toggleChannel(channel.id)}
                                        >
                                            <img
                                                src={channel.icon}
                                                alt={channel.name}
                                                className="channel-option-icon"
                                            />
                                            <span>{channel.name}</span>
                                            {formData.assignedChannels.includes(channel.id) && (
                                                <span className="check-icon">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <small>Selecciona al menos un canal</small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={formData.assignedChannels.length === 0}
                                >
                                    <i className="fas fa-save"></i>
                                    {isEditing ? 'Actualizar Agente' : 'Crear Agente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Estadísticas */}
            {selectedAgent && selectedAgent.stats && (
                <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
                    <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-chart-bar"></i> Estadísticas - {selectedAgent.first_name} {selectedAgent.last_name}
                            </h2>
                            <button className="modal-close" onClick={() => setSelectedAgent(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <i className="fas fa-ticket-alt stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedAgent.stats.total_tickets}</h3>
                                    <p>Total Tickets</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-check-circle stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedAgent.stats.resolved_tickets}</h3>
                                    <p>Resueltos</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-tasks stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedAgent.stats.active_tickets}</h3>
                                    <p>Activos</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-clock stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedAgent.stats.avg_resolution_time_minutes?.toFixed(1) || 0}</h3>
                                    <p>Tiempo Promedio (min)</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <i className="fas fa-calendar-day stat-icon"></i>
                                <div className="stat-content">
                                    <h3>{selectedAgent.stats.tickets_today}</h3>
                                    <p>Tickets Hoy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentManagement;
