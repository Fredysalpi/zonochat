import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import api from '../services/api';
import './SupervisorPanel.css';

function SupervisorPanel({ onSelectAgent, socket }) {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });
    const [holdingTickets, setHoldingTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [filteredAgents, setFilteredAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [onlineAgents, setOnlineAgents] = useState(new Set());

    useEffect(() => {
        loadSupervisorData();
        // Actualizar cada 60 segundos (reducido de 30)
        const interval = setInterval(loadSupervisorData, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (socket) {
            // Escuchar cuando un agente se conecta
            socket.on('agent:online', (data) => {
                setOnlineAgents(prev => new Set([...prev, data.agentId]));
                updateAgentStatus(data.agentId, true);
                // Recargar datos para actualizar estadísticas
                loadSupervisorData();
            });

            // Escuchar cuando un agente se desconecta
            socket.on('agent:offline', (data) => {
                setOnlineAgents(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.agentId);
                    return newSet;
                });
                updateAgentStatus(data.agentId, false);
                // Recargar datos para actualizar estadísticas
                loadSupervisorData();
            });

            // Recibir lista inicial de agentes conectados
            socket.on('agents:online', (onlineAgentsList) => {
                const agentIds = onlineAgentsList.map(a => a.agentId);
                setOnlineAgents(new Set(agentIds));
                // Actualizar estado de todos los agentes
                agentIds.forEach(id => updateAgentStatus(id, true));
                // Recargar datos para tener la info completa
                loadSupervisorData();
            });

            // Escuchar cambios de estado de agentes
            socket.on('agent:status_changed', (data) => {
                console.log('🔄 Estado de agente cambiado:', data);
                // Recargar datos para actualizar el estado
                loadSupervisorData();
            });

            // Escuchar cuando se crea un nuevo ticket
            socket.on('ticket:created', () => {
                console.log('🎫 Nuevo ticket creado, recargando estadísticas');
                loadSupervisorData();
            });

            // Escuchar cuando se actualiza un ticket
            socket.on('ticket:updated', () => {
                console.log('🔄 Ticket actualizado, recargando estadísticas');
                loadSupervisorData();
            });

            // Escuchar cuando se asigna un ticket
            socket.on('ticket:assigned', () => {
                console.log('✅ Ticket asignado, recargando estadísticas');
                loadSupervisorData();
            });

            return () => {
                socket.off('agent:online');
                socket.off('agent:offline');
                socket.off('agents:online');
                socket.off('agent:status_changed');
                socket.off('ticket:created');
                socket.off('ticket:updated');
                socket.off('ticket:assigned');
            };
        }
    }, [socket]);

    const updateAgentStatus = (agentId, isOnline) => {
        setAgents(prevAgents =>
            prevAgents.map(agent =>
                agent.id === agentId ? { ...agent, is_online: isOnline } : agent
            )
        );
    };

    useEffect(() => {
        filterAgents();
    }, [agents, searchTerm, statusFilter, onlineAgents]);

    const loadSupervisorData = async () => {
        try {
            // Cargar estadísticas de agentes
            const statsResponse = await api.get('/supervisor/agents/stats');
            setStats(statsResponse.data);

            // Cargar tickets en holding
            const holdingResponse = await api.get('/supervisor/holding');
            setHoldingTickets(holdingResponse.data.tickets || []);

            // Cargar lista de agentes con sus métricas
            // El backend ya devuelve is_online correctamente
            const agentsResponse = await api.get('/supervisor/agents');
            const agentsData = agentsResponse.data.agents || [];

            console.log('📊 Datos de agentes recibidos:', agentsData);
            console.log('📊 Primer agente:', agentsData[0]);

            setAgents(agentsData);
        } catch (error) {
            console.error('Error al cargar datos del supervisor:', error);
        }
    };

    const filterAgents = () => {
        let filtered = [...agents];

        // Filtrar por búsqueda
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(agent =>
                `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(search) ||
                agent.email?.toLowerCase().includes(search)
            );
        }

        // Filtrar por estado
        if (statusFilter === 'active') {
            filtered = filtered.filter(agent => agent.is_online);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(agent => !agent.is_online);
        }

        setFilteredAgents(filtered);
    };

    const handleAgentClick = (agent) => {
        setSelectedAgent(agent.id);
        if (onSelectAgent) {
            onSelectAgent(agent);
        }
    };

    const handleShowAll = () => {
        setSelectedAgent(null);
        if (onSelectAgent) {
            onSelectAgent(null);
        }
    };

    const handleStatClick = (filter) => {
        setStatusFilter(filter);
    };

    const getChannelIcon = (channel) => {
        const icons = {
            whatsapp: '📱',
            messenger: '💬',
            instagram: '📷',
            email: '📧',
            web: '🌐'
        };
        return icons[channel] || '💬';
    };

    const formatTime = (date) => {
        if (!date) return '';
        try {
            const msgDate = new Date(date);
            return msgDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <div className="supervisor-panel">
            {/* Header con estadísticas */}
            <div className="supervisor-header">
                <h2>Supervisor</h2>
                <div className="supervisor-stats">
                    <div
                        className={`stat-item ${statusFilter === 'all' ? 'active-filter' : ''}`}
                        onClick={() => handleStatClick('all')}
                    >
                        <Users size={16} />
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div
                        className={`stat-item active ${statusFilter === 'active' ? 'active-filter' : ''}`}
                        onClick={() => handleStatClick('active')}
                    >
                        <CheckCircle size={16} />
                        <span className="stat-value">{stats.active}</span>
                        <span className="stat-label">Activos</span>
                    </div>
                    <div
                        className={`stat-item inactive ${statusFilter === 'inactive' ? 'active-filter' : ''}`}
                        onClick={() => handleStatClick('inactive')}
                    >
                        <XCircle size={16} />
                        <span className="stat-value">{stats.inactive}</span>
                        <span className="stat-label">Inactivos</span>
                    </div>
                </div>
            </div>

            {/* Sección de Holding */}
            <div className="holding-section">
                <div className="section-header">
                    <Clock size={16} />
                    <h3>Holding</h3>
                    <span className="holding-count">{holdingTickets.length}</span>
                </div>
                <div className="holding-tickets">
                    {holdingTickets.length === 0 ? (
                        <div className="empty-holding">
                            <p>No hay tickets en espera</p>
                        </div>
                    ) : (
                        holdingTickets.map(ticket => (
                            <div key={ticket.id} className="holding-ticket">
                                <div className="holding-ticket-info">
                                    <span className="channel-icon">{getChannelIcon(ticket.channel_type)}</span>
                                    <span className="ticket-contact">{ticket.contact_name}</span>
                                </div>
                                <span className="holding-time">{formatTime(ticket.created_at)}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Lista de Agentes */}
            <div className="agents-section">
                <div className="section-header">
                    <Users size={16} />
                    <h3>Agentes</h3>
                </div>

                {/* Buscador de agentes */}
                <div className="agent-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Buscar agente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Botón Ver Todos */}
                {selectedAgent && (
                    <button
                        className="show-all-btn"
                        onClick={handleShowAll}
                    >
                        <Users size={14} />
                        Ver todos los chats
                    </button>
                )}

                <div className="agents-list">
                    {filteredAgents.map(agent => (
                        <div
                            key={agent.id}
                            className={`agent-card ${selectedAgent === agent.id ? 'selected' : ''}`}
                            onClick={() => handleAgentClick(agent)}
                        >
                            <div className="agent-header">
                                <div className="agent-avatar-container">
                                    <div className="agent-avatar">
                                        {agent.first_name?.[0] || '?'}
                                    </div>
                                    <span className={`status-dot ${!agent.is_online ? 'offline' :
                                        agent.status === 'busy' ? 'busy' :
                                            'available'
                                        }`}></span>
                                </div>
                                <div className="agent-info">
                                    <h4>{agent.first_name} {agent.last_name}</h4>
                                    <div className="agent-channels">
                                        {agent.channels && agent.channels.map(channel => (
                                            <span key={channel} className="channel-badge">
                                                {getChannelIcon(channel)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="agent-metrics">
                                <div className="metric-badge attention">
                                    <span className="metric-text">En atención: {agent.available || 0}</span>
                                </div>
                                <div className="metric-badge pending">
                                    <span className="metric-text">Pendiente: {agent.resolving || 0}</span>
                                </div>
                                <div className="metric-badge closed">
                                    <span className="metric-text">Cerrados: {agent.resolved || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SupervisorPanel;
