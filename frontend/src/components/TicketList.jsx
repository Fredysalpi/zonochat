import { useState, useEffect } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import api from '../services/api';
import TicketCard from './TicketCard';
import AssignTicketModal from './AssignTicketModal';
import './TicketList.css';

function TicketList({ tickets, setTickets, selectedTicket, onSelectTicket, user, selectedAgent }) {
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [ticketToAssign, setTicketToAssign] = useState(null);

    useEffect(() => {
        loadTickets();
    }, [filter, selectedAgent]);

    const loadTickets = async () => {
        try {
            setLoading(true);

            // Si el filtro es "sin asignar", cargar tickets en holding
            if (filter === 'unassigned') {
                const response = await api.get('/supervisor/holding');
                setTickets(response.data.tickets || []);
            }
            // Si hay un agente seleccionado, cargar sus tickets
            else if (selectedAgent) {
                const response = await api.get(`/supervisor/agents/${selectedAgent.id}/tickets`);
                setTickets(response.data.tickets || []);
            } else {
                // Si no hay agente seleccionado, cargar todos los tickets del usuario actual
                const params = {};
                if (filter !== 'all' && filter !== 'unassigned') {
                    params.status = filter;
                }
                const response = await api.get('/tickets', { params });
                setTickets(response.data.tickets || []);
            }
        } catch (error) {
            console.error('Error al cargar tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            ticket.contact_name?.toLowerCase().includes(search) ||
            ticket.subject?.toLowerCase().includes(search) ||
            ticket.ticket_number?.toLowerCase().includes(search)
        );
    });

    const handleAssignClick = (ticket) => {
        setTicketToAssign(ticket);
        setShowAssignModal(true);
    };

    const handleAssignSuccess = (agent) => {
        // Recargar tickets después de asignar
        loadTickets();
        setShowAssignModal(false);
        setTicketToAssign(null);
    };

    const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin';

    return (
        <div className="ticket-list">
            <div className="ticket-list-header">
                <div className="ticket-list-header-info">
                    <h2>{user?.first_name} {user?.last_name}</h2>
                    <p>{user?.role === 'admin' ? 'Supervisor' : 'Agente'}</p>
                </div>
                <button className="btn-new-ticket" title="Nueva conversación">
                    <Plus size={20} />
                </button>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="filter-tabs">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                {isSupervisorOrAdmin && (
                    <button
                        className={filter === 'unassigned' ? 'active' : ''}
                        onClick={() => setFilter('unassigned')}
                    >
                        Sin Asignar
                    </button>
                )}
                <button
                    className={filter === 'open' ? 'active' : ''}
                    onClick={() => setFilter('open')}
                >
                    Abiertas
                </button>
                <button
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    Pendientes
                </button>
                {isSupervisorOrAdmin && (
                    <button
                        className={filter === 'resolved' ? 'active' : ''}
                        onClick={() => setFilter('resolved')}
                    >
                        Resueltas
                    </button>
                )}
                {!isSupervisorOrAdmin && (
                    <button
                        className={filter === 'closed' ? 'active' : ''}
                        onClick={() => setFilter('closed')}
                    >
                        Cerradas
                    </button>
                )}
            </div>

            <div className="tickets-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando conversaciones...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay conversaciones</p>
                    </div>
                ) : (
                    filteredTickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isSelected={selectedTicket?.id === ticket.id}
                            onClick={() => onSelectTicket(ticket)}
                            onAssign={handleAssignClick}
                            showAssignButton={isSupervisorOrAdmin}
                        />
                    ))
                )}
            </div>

            {showAssignModal && ticketToAssign && (
                <AssignTicketModal
                    ticket={ticketToAssign}
                    onClose={() => {
                        setShowAssignModal(false);
                        setTicketToAssign(null);
                    }}
                    onAssign={handleAssignSuccess}
                />
            )}
        </div>
    );
}

export default TicketList;
