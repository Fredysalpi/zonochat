import { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, Tag, MessageSquare, Clock, X, Save, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './ContactInfo.css';

function ContactInfo({ ticket }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editedContact, setEditedContact] = useState({
        name: ticket.contact_name || '',
        phone: ticket.contact_phone || '',
        email: ticket.contact_email || ''
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: es });
        } catch {
            return 'N/A';
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            open: 'Abierto',
            pending: 'Pendiente',
            resolved: 'Resuelto',
            closed: 'Cerrado'
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Baja',
            medium: 'Media',
            high: 'Alta',
            urgent: 'Urgente'
        };
        return labels[priority] || priority;
    };

    const handleEditContact = () => {
        setEditedContact({
            name: ticket.contact_name || '',
            phone: ticket.contact_phone || '',
            email: ticket.contact_email || ''
        });
        setShowEditModal(true);
    };

    const handleSaveContact = async () => {
        // TODO: Implementar llamada a API para actualizar contacto
        console.log('Guardando contacto:', editedContact);
        setShowEditModal(false);
        // Aquí iría la llamada a la API
        // await api.put(`/contacts/${ticket.contact_id}`, editedContact);
    };

    const handleViewHistory = () => {
        setShowHistoryModal(true);
    };

    return (
        <div className="contact-info">
            <div className="contact-info-header">
                <h3>Información del Contacto</h3>
            </div>

            <div className="contact-info-body">
                {/* Avatar y Nombre */}
                <div className="contact-avatar-section">
                    <div className="contact-avatar-large">
                        {ticket.contact_name?.[0] || '?'}
                    </div>
                    <h2 className="contact-name">{ticket.contact_name || 'Sin nombre'}</h2>
                    <p className="contact-ticket-number">#{ticket.ticket_number}</p>
                </div>

                {/* Información de Contacto */}
                <div className="info-section">
                    <h4 className="section-title">Datos de Contacto</h4>

                    {ticket.contact_phone && (
                        <div className="info-item">
                            <Phone size={16} />
                            <div className="info-content">
                                <span className="info-label">Teléfono</span>
                                <span className="info-value">{ticket.contact_phone}</span>
                            </div>
                        </div>
                    )}

                    {ticket.contact_email && (
                        <div className="info-item">
                            <Mail size={16} />
                            <div className="info-content">
                                <span className="info-label">Email</span>
                                <span className="info-value">{ticket.contact_email}</span>
                            </div>
                        </div>
                    )}

                    <div className="info-item">
                        <MessageSquare size={16} />
                        <div className="info-content">
                            <span className="info-label">Canal</span>
                            <span className="info-value">{ticket.channel_type || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Información del Ticket */}
                <div className="info-section">
                    <h4 className="section-title">Detalles del Ticket</h4>

                    <div className="info-item">
                        <Tag size={16} />
                        <div className="info-content">
                            <span className="info-label">Estado</span>
                            <span className="info-value">{getStatusLabel(ticket.status)}</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <Tag size={16} />
                        <div className="info-content">
                            <span className="info-label">Prioridad</span>
                            <span className="info-value">{getPriorityLabel(ticket.priority)}</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <Calendar size={16} />
                        <div className="info-content">
                            <span className="info-label">Creado</span>
                            <span className="info-value">{formatDate(ticket.created_at)}</span>
                        </div>
                    </div>

                    {ticket.assigned_to && (
                        <div className="info-item">
                            <MessageSquare size={16} />
                            <div className="info-content">
                                <span className="info-label">Asignado a</span>
                                <span className="info-value">{ticket.agent_name || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Asunto */}
                {ticket.subject && (
                    <div className="info-section">
                        <h4 className="section-title">Asunto</h4>
                        <p className="subject-text">{ticket.subject}</p>
                    </div>
                )}

                {/* Acciones */}
                <div className="contact-actions">
                    <button className="action-btn primary" onClick={handleEditContact}>
                        Editar Contacto
                    </button>
                    <button className="action-btn secondary" onClick={handleViewHistory}>
                        Ver Historial
                    </button>
                </div>
            </div>

            {/* Modal de Editar Contacto */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar Contacto</h3>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={editedContact.name}
                                    onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                                    placeholder="Nombre del contacto"
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    value={editedContact.phone}
                                    onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                                    placeholder="+52 55 1234 5678"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editedContact.email}
                                    onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-save" onClick={handleSaveContact}>
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Historial de Conversaciones</h3>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="history-item">
                                <FileText size={18} />
                                <div className="history-content">
                                    <h4>{ticket.subject}</h4>
                                    <p>Ticket actual - {getStatusLabel(ticket.status)}</p>
                                    <span className="history-date">{formatDate(ticket.created_at)}</span>
                                </div>
                            </div>
                            <div className="empty-history">
                                <p>No hay conversaciones anteriores</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContactInfo;
