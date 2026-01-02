import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import './TicketCard.css';

function TicketCard({ ticket, isSelected, onClick, onAssign, showAssignButton = false }) {
    const [responseTime, setResponseTime] = useState(0);

    useEffect(() => {
        // Calcular tiempo desde el último mensaje del cliente
        if (ticket.last_message_at) {
            const updateTimer = () => {
                const now = new Date();
                const lastMsg = new Date(ticket.last_message_at);
                const diffInMinutes = Math.floor((now - lastMsg) / (1000 * 60));
                setResponseTime(diffInMinutes);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000); // Actualizar cada minuto

            return () => clearInterval(interval);
        }
    }, [ticket.last_message_at]);

    const formatTicketNumber = (number) => {
        return number ? `#${number}` : '#0000';
    };

    const formatAgentTime = (date) => {
        if (!date) return '00:00:00';
        try {
            const now = new Date();
            const assignedDate = new Date(date);
            const diffInSeconds = Math.floor((now - assignedDate) / 1000);

            const hours = Math.floor(diffInSeconds / 3600);
            const minutes = Math.floor((diffInSeconds % 3600) / 60);
            const seconds = diffInSeconds % 60;

            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } catch {
            return '00:00:00';
        }
    };

    const formatResponseTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const getResponseTimeClass = () => {
        if (ticket.last_sender_type === 'agent') {
            return 'response-time-agent'; // Morado
        }
        if (responseTime >= 5) {
            return 'response-time-critical'; // Rojo
        }
        return 'response-time-normal'; // Normal
    };

    const handleAssignClick = (e) => {
        e.stopPropagation();
        if (onAssign) {
            onAssign(ticket);
        }
    };

    return (
        <div
            className={`ticket-card ${isSelected ? 'selected' : ''} ${!ticket.assigned_to ? 'unassigned' : ''}`}
            onClick={onClick}
        >
            <div className="ticket-card-content">
                <div className="avatar-container">
                    <div className="contact-avatar">
                        {ticket.contact_avatar ? (
                            <img
                                src={ticket.contact_avatar}
                                alt={ticket.contact_name}
                                className="avatar-image"
                                onError={(e) => {
                                    // Si la imagen falla, mostrar inicial
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <span className="avatar-initial" style={{ display: ticket.contact_avatar ? 'none' : 'flex' }}>
                            {ticket.contact_name?.[0] || '?'}
                        </span>
                    </div>
                    {ticket.unread_count > 0 && (
                        <div className="message-counter">
                            {ticket.unread_count}
                        </div>
                    )}
                </div>

                <div className="ticket-info">
                    <div className="contact-name">{ticket.contact_name || 'Sin nombre'}</div>
                    <div className="last-message">
                        {ticket.last_message || 'Sin mensajes'}
                    </div>
                    <div className="ticket-indicators">
                        <span className="indicator ticket-number">{formatTicketNumber(ticket.ticket_number)}</span>
                        <span className="indicator agent-time">{formatAgentTime(ticket.assigned_at || ticket.created_at)}</span>
                        <span className={`indicator response-time ${getResponseTimeClass()}`}>
                            {formatResponseTime(responseTime)}
                        </span>
                        <span className="indicator status-label">{ticket.status === 'pending' ? 'PENDIENTE' : 'INBOUND'}</span>
                    </div>
                </div>

                {showAssignButton && !ticket.assigned_to && (
                    <button
                        className="assign-btn"
                        onClick={handleAssignClick}
                        title="Asignar ticket"
                    >
                        <UserPlus size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default TicketCard;
