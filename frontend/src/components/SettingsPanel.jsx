import { useState, useEffect } from 'react';
import { Settings, Users, MessageSquare, Save, Plus, Edit2, Trash2, Key, Phone } from 'lucide-react';
import api from '../services/api';
import './SettingsPanel.css';

function SettingsPanel({ user }) {
    const [activeTab, setActiveTab] = useState('agents');
    const [agents, setAgents] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState(null);
    const [editingChannel, setEditingChannel] = useState(null);

    useEffect(() => {
        if (activeTab === 'agents') {
            loadAgents();
        } else if (activeTab === 'channels') {
            loadChannels();
        }
    }, [activeTab]);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users?role=agent');
            setAgents(response.data.users || []);
        } catch (error) {
            console.error('Error al cargar agentes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChannels = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/channels');
            setChannels(response.data.channels || []);
        } catch (error) {
            console.error('Error al cargar canales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAgent = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este agente?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            loadAgents();
        } catch (error) {
            console.error('Error al eliminar agente:', error);
            alert('Error al eliminar el agente');
        }
    };

    const handleDeleteChannel = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este canal?')) return;
        try {
            await api.delete(`/admin/channels/${id}`);
            loadChannels();
        } catch (error) {
            console.error('Error al eliminar canal:', error);
            alert('Error al eliminar el canal');
        }
    };

    if (user.role !== 'admin' && user.role !== 'supervisor') {
        return (
            <div className="settings-panel">
                <div className="access-denied">
                    <Settings size={64} />
                    <h2>Acceso Denegado</h2>
                    <p>No tienes permisos para acceder a esta sección</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-panel">
            <div className="settings-header">
                <div className="header-left">
                    <Settings size={24} />
                    <h1>Configuración</h1>
                </div>
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('agents')}
                >
                    <Users size={18} />
                    Agentes
                </button>
                <button
                    className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('channels')}
                >
                    <MessageSquare size={18} />
                    Canales
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'agents' && (
                    <AgentsTab
                        agents={agents}
                        loading={loading}
                        onAdd={() => {
                            setEditingAgent(null);
                            setShowAgentModal(true);
                        }}
                        onEdit={(agent) => {
                            setEditingAgent(agent);
                            setShowAgentModal(true);
                        }}
                        onDelete={handleDeleteAgent}
                        onRefresh={loadAgents}
                    />
                )}

                {activeTab === 'channels' && (
                    <ChannelsTab
                        channels={channels}
                        loading={loading}
                        onAdd={() => {
                            setEditingChannel(null);
                            setShowChannelModal(true);
                        }}
                        onEdit={(channel) => {
                            setEditingChannel(channel);
                            setShowChannelModal(true);
                        }}
                        onDelete={handleDeleteChannel}
                        onRefresh={loadChannels}
                    />
                )}
            </div>

            {showAgentModal && (
                <AgentModal
                    agent={editingAgent}
                    onClose={() => {
                        setShowAgentModal(false);
                        setEditingAgent(null);
                    }}
                    onSave={() => {
                        setShowAgentModal(false);
                        setEditingAgent(null);
                        loadAgents();
                    }}
                />
            )}

            {showChannelModal && (
                <ChannelModal
                    channel={editingChannel}
                    onClose={() => {
                        setShowChannelModal(false);
                        setEditingChannel(null);
                    }}
                    onSave={() => {
                        setShowChannelModal(false);
                        setEditingChannel(null);
                        loadChannels();
                    }}
                />
            )}
        </div>
    );
}

function AgentsTab({ agents, loading, onAdd, onEdit, onDelete, onRefresh }) {
    return (
        <div className="tab-content">
            <div className="content-header">
                <h2>Gestión de Agentes</h2>
                <button className="btn-primary" onClick={onAdd}>
                    <Plus size={18} />
                    Nuevo Agente
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando agentes...</p>
                </div>
            ) : agents.length === 0 ? (
                <div className="empty-state">
                    <Users size={64} />
                    <p>No hay agentes registrados</p>
                    <button className="btn-primary" onClick={onAdd}>
                        Crear primer agente
                    </button>
                </div>
            ) : (
                <div className="items-grid">
                    {agents.map(agent => (
                        <div key={agent.id} className="item-card">
                            <div className="item-avatar">
                                {agent.avatar ? (
                                    <img src={agent.avatar} alt={agent.first_name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {agent.first_name?.[0]}{agent.last_name?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="item-info">
                                <h3>{agent.first_name} {agent.last_name}</h3>
                                <p className="item-email">{agent.email}</p>
                                <span className={`status-badge ${agent.is_active ? 'active' : 'inactive'}`}>
                                    {agent.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="item-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => onEdit(agent)}
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon delete"
                                    onClick={() => onDelete(agent.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ChannelsTab({ channels, loading, onAdd, onEdit, onDelete, onRefresh }) {
    const getChannelIcon = (type) => {
        const icons = {
            whatsapp: '💬',
            messenger: '💬',
            instagram: '📷',
            telegram: '✈️',
            email: '📧'
        };
        return icons[type] || '📱';
    };

    return (
        <div className="tab-content">
            <div className="content-header">
                <h2>Gestión de Canales</h2>
                <button className="btn-primary" onClick={onAdd}>
                    <Plus size={18} />
                    Nuevo Canal
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando canales...</p>
                </div>
            ) : channels.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare size={64} />
                    <p>No hay canales configurados</p>
                    <button className="btn-primary" onClick={onAdd}>
                        Configurar primer canal
                    </button>
                </div>
            ) : (
                <div className="items-grid">
                    {channels.map(channel => (
                        <div key={channel.id} className="item-card channel-card">
                            <div className="channel-icon">
                                {getChannelIcon(channel.type)}
                            </div>
                            <div className="item-info">
                                <h3>{channel.name}</h3>
                                <p className="channel-type">{channel.type.toUpperCase()}</p>
                                <span className={`status-badge ${channel.is_active ? 'active' : 'inactive'}`}>
                                    {channel.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="item-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => onEdit(channel)}
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon delete"
                                    onClick={() => onDelete(channel.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AgentModal({ agent, onClose, onSave }) {
    const [formData, setFormData] = useState({
        first_name: agent?.first_name || '',
        last_name: agent?.last_name || '',
        email: agent?.email || '',
        password: '',
        role: agent?.role || 'agent',
        is_active: agent?.is_active !== undefined ? agent.is_active : true
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name || !formData.email) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        if (!agent && !formData.password) {
            alert('La contraseña es requerida para nuevos agentes');
            return;
        }

        try {
            setSaving(true);
            const dataToSend = { ...formData };
            if (agent && !formData.password) {
                delete dataToSend.password;
            }

            if (agent) {
                await api.put(`/admin/users/${agent.id}`, dataToSend);
            } else {
                await api.post('/admin/users', dataToSend);
            }
            onSave();
        } catch (error) {
            console.error('Error al guardar agente:', error);
            alert(error.response?.data?.error || 'Error al guardar el agente');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{agent ? 'Editar' : 'Nuevo'} Agente</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña {!agent && '*'}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={agent ? 'Dejar en blanco para no cambiar' : ''}
                            required={!agent}
                        />
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
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                Activo
                            </label>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : (agent ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ChannelModal({ channel, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: channel?.name || '',
        type: channel?.type || 'whatsapp',
        config: channel?.config ? JSON.parse(channel.config) : {
            api_key: '',
            api_secret: '',
            phone_number: '',
            webhook_url: ''
        },
        is_active: channel?.is_active !== undefined ? channel.is_active : true
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            setSaving(true);
            const dataToSend = {
                ...formData,
                config: JSON.stringify(formData.config)
            };

            if (channel) {
                await api.put(`/admin/channels/${channel.id}`, dataToSend);
            } else {
                await api.post('/admin/channels', dataToSend);
            }
            onSave();
        } catch (error) {
            console.error('Error al guardar canal:', error);
            alert(error.response?.data?.error || 'Error al guardar el canal');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{channel ? 'Editar' : 'Nuevo'} Canal</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nombre del Canal *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: WhatsApp Principal"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo de Canal *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="messenger">Facebook Messenger</option>
                            <option value="instagram">Instagram</option>
                            <option value="telegram">Telegram</option>
                            <option value="email">Email</option>
                        </select>
                    </div>

                    <div className="config-section">
                        <h3><Key size={18} /> Configuración de API</h3>

                        <div className="form-group">
                            <label>API Key / Token</label>
                            <input
                                type="text"
                                value={formData.config.api_key}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, api_key: e.target.value }
                                })}
                                placeholder="Tu API Key o Token de acceso"
                            />
                        </div>

                        <div className="form-group">
                            <label>API Secret (opcional)</label>
                            <input
                                type="password"
                                value={formData.config.api_secret}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, api_secret: e.target.value }
                                })}
                                placeholder="API Secret si es requerido"
                            />
                        </div>

                        {formData.type === 'whatsapp' && (
                            <div className="form-group">
                                <label><Phone size={16} /> Número de Teléfono</label>
                                <input
                                    type="text"
                                    value={formData.config.phone_number}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        config: { ...formData.config, phone_number: e.target.value }
                                    })}
                                    placeholder="+1234567890"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Webhook URL</label>
                            <input
                                type="url"
                                value={formData.config.webhook_url}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, webhook_url: e.target.value }
                                })}
                                placeholder="https://tu-servidor.com/webhook"
                            />
                            <small className="form-hint">
                                URL donde recibirás los mensajes de este canal
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Canal Activo
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            <Save size={18} />
                            {saving ? 'Guardando...' : (channel ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SettingsPanel;
