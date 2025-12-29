import { useState, useEffect } from 'react';
import { X, User, Search } from 'lucide-react';
import api from '../services/api';
import './AssignTicketModal.css';

function AssignTicketModal({ ticket, onClose, onAssign }) {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/supervisor/agents');
            setAgents(response.data.agents || []);
        } catch (error) {
            console.error('Error al cargar agentes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAgents = agents.filter(agent =>
        `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = async () => {
        if (!selectedAgent) return;

        try {
            setAssigning(true);
            await api.put(`/tickets/${ticket.id}/assign`, {
                agent_id: selectedAgent.id
            });
            onAssign(selectedAgent);
            onClose();
        } catch (error) {
            console.error('Error al asignar ticket:', error);
            alert('Error al asignar el ticket');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Asignar Ticket</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="ticket-info">
                        <p className="ticket-number">#{ticket.ticket_number}</p>
                        <p className="contact-name">{ticket.contact_name}</p>
                        <p className="ticket-subject">{ticket.subject}</p>
                    </div>

                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar agente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="agents-list">
                        {loading ? (
                            <div className="loading">Cargando agentes...</div>
                        ) : filteredAgents.length === 0 ? (
                            <div className="no-agents">No se encontraron agentes</div>
                        ) : (
                            filteredAgents.map(agent => (
                                <div
                                    key={agent.id}
                                    className={`agent-item ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedAgent(agent)}
                                >
                                    <div className="agent-avatar">
                                        {agent.first_name[0]}{agent.last_name[0]}
                                    </div>
                                    <div className="agent-info">
                                        <p className="agent-name">{agent.first_name} {agent.last_name}</p>
                                        <p className="agent-email">{agent.email}</p>
                                    </div>
                                    <div className="agent-stats">
                                        <span className="stat">En atención: {agent.available || 0}</span>
                                        <span className="stat">Pendiente: {agent.resolving || 0}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn-assign"
                        onClick={handleAssign}
                        disabled={!selectedAgent || assigning}
                    >
                        {assigning ? 'Asignando...' : 'Asignar Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AssignTicketModal;
