import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, X, PanelRightClose, PanelRightOpen, CheckCircle, Clock, XCircle, Archive, Zap, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import api from '../services/api';
import MessageBubble from './MessageBubble';
import QuickReplies from './QuickReplies';
import TypificationModal from './TypificationModal';
import './ChatView.css';
import './AvatarModal.css';

function ChatView({ ticket, socket, user, onToggleContactInfo, showContactInfo }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(ticket?.status || 'open');
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showTypificationModal, setShowTypificationModal] = useState(false);
    const [isContactTyping, setIsContactTyping] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (ticket) {
            loadMessages();
            setCurrentStatus(ticket.status);
            // Unirse a la sala del ticket
            if (socket) {
                console.log('🚪 Uniéndose a la sala del ticket:', ticket.id);
                socket.emit('ticket:join', ticket.id);
                // Emitir evento de ticket abierto para limpiar notificaciones
                socket.emit('ticket:opened', { ticketId: ticket.id });
            }
            // Marcar mensajes como leídos
            markMessagesAsRead();
        }
    }, [ticket?.id]);

    useEffect(() => {
        if (socket) {
            socket.on('message:new', (message) => {
                console.log('🔔 Mensaje nuevo recibido por Socket.IO:', message);
                console.log('📋 Ticket actual:', ticket?.id);
                console.log('📋 Ticket del mensaje:', message.ticket_id);

                if (message.ticket_id === ticket?.id) {
                    console.log('✅ IDs coinciden, agregando mensaje');
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                } else {
                    console.log('❌ IDs NO coinciden, mensaje ignorado');
                }
            });

            socket.on('ticket:updated', (updatedTicket) => {
                if (updatedTicket.id === ticket?.id) {
                    setCurrentStatus(updatedTicket.status);
                }
            });


            // Listener para mensajes del sistema (transferencias, etc.)
            socket.on('system:message', (systemMessage) => {
                console.log('📢 Mensaje del sistema recibido en ChatView:', systemMessage);
                console.log('📋 Ticket actual:', ticket?.id);
                console.log('📋 Ticket del mensaje:', systemMessage.ticketId);

                if (systemMessage.ticketId === ticket?.id) {
                    console.log('✅ IDs coinciden, agregando mensaje del sistema');
                    // Agregar mensaje del sistema a la lista
                    const systemMsg = {
                        id: `system-${Date.now()}`,
                        content: systemMessage.message,
                        sender_type: 'system',
                        created_at: systemMessage.timestamp,
                        type: systemMessage.type
                    };
                    console.log('📝 Mensaje del sistema creado:', systemMsg);
                    setMessages(prev => {
                        console.log('📨 Mensajes anteriores:', prev.length);
                        const newMessages = [...prev, systemMsg];
                        console.log('📨 Mensajes nuevos:', newMessages.length);
                        return newMessages;
                    });
                    scrollToBottom();
                } else {
                    console.log('❌ IDs NO coinciden, mensaje del sistema ignorado');
                }
            });

            // Listener para confirmación de lectura
            socket.on('messages:read', (data) => {
                console.log('👁️ Mensajes marcados como leídos:', data);
                if (data.ticketId === ticket?.id) {
                    console.log('✅ Actualizando mensajes a leído');
                    setMessages(prev => {
                        const updated = prev.map(msg => {
                            // Marcar como leído solo los mensajes del agente
                            if (msg.sender_type === 'agent' && msg.external_message_id) {
                                console.log(`📝 Marcando mensaje ${msg.id} como leído`);
                                return { ...msg, is_read: 1 };
                            }
                            return msg;
                        });
                        console.log('📨 Mensajes actualizados:', updated.filter(m => m.is_read).length, 'leídos');
                        return updated;
                    });
                }
            });

            // Listener para indicador de "Escribiendo..."
            socket.on('contact:typing', (data) => {
                if (data.ticketId === ticket?.id) {
                    setIsContactTyping(data.isTyping);

                    // Si está escribiendo, limpiar timeout anterior
                    if (data.isTyping) {
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }
                        // Ocultar después de 3 segundos si no hay más eventos
                        typingTimeoutRef.current = setTimeout(() => {
                            setIsContactTyping(false);
                        }, 3000);
                    } else {
                        // Si dejó de escribir, ocultar inmediatamente
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }
                        setIsContactTyping(false);
                    }
                }
            });

            return () => {
                socket.off('message:new');
                socket.off('ticket:updated');
                socket.off('system:message');
                socket.off('messages:read');
                socket.off('contact:typing');

                // Limpiar timeout al desmontar
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            };
        }
    }, [socket, ticket?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/messages/ticket/${ticket.id}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    const markMessagesAsRead = async () => {
        try {
            await api.put(`/messages/ticket/${ticket.id}/read-all`);
            console.log('✅ Mensajes marcados como leídos');
        } catch (error) {
            console.error('Error al marcar mensajes como leídos:', error);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await api.put(`/tickets/${ticket.id}/status`, { status: newStatus });
            setCurrentStatus(newStatus);

            // Emitir evento WebSocket para actualizar el supervisor en tiempo real
            if (socket) {
                console.log('📢 Emitiendo cambio de estado del ticket:', { ticketId: ticket.id, status: newStatus });
                socket.emit('ticket:status_changed', {
                    ticketId: ticket.id,
                    status: newStatus,
                    ticket: response.data.ticket
                });
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del ticket');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || sending) return;

        try {
            setSending(true);

            // Si hay imagen, usar FormData
            if (selectedImage) {
                const formData = new FormData();
                formData.append('ticket_id', ticket.id);
                formData.append('content', newMessage.trim() || 'Imagen');
                formData.append('sender_type', 'agent');
                formData.append('attachment', selectedImage);

                await api.post('/messages', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                handleRemoveImage();
            } else {
                // Mensaje de texto simple
                await api.post('/messages', {
                    ticket_id: ticket.id,
                    content: newMessage.trim(),
                    sender_type: 'agent'
                });
            }

            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            alert('Error al enviar el mensaje');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }

        // Detectar atajos de respuestas rápidas (/)
        if (e.key === '/' && newMessage === '') {
            e.preventDefault();
            setShowQuickReplies(true);
        }
    };

    const handleSelectQuickReply = (content) => {
        setNewMessage(content);
        setShowQuickReplies(false);
        // Enfocar el input después de seleccionar
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        // No cerrar el picker automáticamente para permitir seleccionar múltiples emojis
        // El usuario puede cerrarlo haciendo clic nuevamente en el botón de emoji
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                alert('Solo se permiten archivos de imagen');
                return;
            }

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB');
                return;
            }

            setSelectedImage(file);

            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTypificationSubmit = async (typificationData) => {
        try {
            await api.post('/tickets/typification', typificationData);
            console.log('Tipificación guardada:', typificationData);
            // Aquí podrías mostrar una notificación de éxito
        } catch (error) {
            console.error('Error al guardar tipificación:', error);
            alert('Error al guardar la tipificación');
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            open: { label: 'Abierto', color: '#10b981', icon: CheckCircle },
            pending: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
            resolved: { label: 'Resuelto', color: '#8b5cf6', icon: CheckCircle },
            closed: { label: 'Cerrado', color: '#6b7280', icon: Archive }
        };
        return configs[status] || configs.open;
    };

    const statusConfig = getStatusConfig(currentStatus);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="chat-view">
            <div className="chat-header">
                <div className="chat-contact-info">
                    <div
                        className="contact-avatar-large clickable"
                        onClick={() => ticket.contact_avatar && setShowAvatarModal(true)}
                        style={{ cursor: ticket.contact_avatar ? 'pointer' : 'default' }}
                    >
                        {ticket.contact_avatar ? (
                            <img
                                src={ticket.contact_avatar}
                                alt={ticket.contact_name}
                                className="avatar-image-large"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <span className="avatar-initial-large" style={{ display: ticket.contact_avatar ? 'none' : 'flex' }}>
                            {ticket.contact_name?.[0] || '?'}
                        </span>
                    </div>
                    <div className="contact-details">
                        <h3>{ticket.contact_name || 'Sin nombre'}</h3>
                        <p className="contact-status">
                            Ticket #{ticket.ticket_number}
                        </p>
                    </div>
                </div>
                <div className="chat-actions">
                    <button
                        className="icon-btn"
                        title={showContactInfo ? "Ocultar información" : "Mostrar información"}
                        onClick={onToggleContactInfo}
                    >
                        {showContactInfo ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                    </button>
                    <button
                        className="icon-btn"
                        title="Tipificación"
                        onClick={() => setShowTypificationModal(true)}
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Barra de Estado y Acciones Rápidas */}
            <div className="chat-status-bar">
                <div className="current-status">
                    <StatusIcon size={16} />
                    <span>Estado: {statusConfig.label}</span>
                </div>
                <div className="status-actions">
                    {currentStatus !== 'open' && (
                        <button
                            className="status-btn status-open"
                            onClick={() => handleStatusChange('open')}
                            title="Marcar como abierto"
                        >
                            <CheckCircle size={14} />
                            Abrir
                        </button>
                    )}
                    {currentStatus !== 'pending' && (
                        <button
                            className="status-btn status-pending"
                            onClick={() => handleStatusChange('pending')}
                            title="Marcar como pendiente"
                        >
                            <Clock size={14} />
                            Pendiente
                        </button>
                    )}
                    {currentStatus !== 'closed' && (
                        <button
                            className="status-btn status-closed"
                            onClick={() => handleStatusChange('closed')}
                            title="Cerrar ticket"
                        >
                            <Archive size={14} />
                            Cerrar
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="loading-messages">
                        <div className="spinner"></div>
                        <p>Cargando mensajes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <p>No hay mensajes aún</p>
                        <p className="text-muted">Envía el primer mensaje para comenzar la conversación</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message.id || index}
                                message={message}
                                isOwn={message.sender_type === 'agent'}
                                currentUser={user}
                            />
                        ))}

                        {/* Indicador de "Escribiendo..." */}
                        {isContactTyping && (
                            <div className="typing-indicator">
                                <div className="typing-bubble">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                                <span className="typing-text">Escribiendo...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="chat-input-container">
                {/* Preview de imagen seleccionada */}
                {imagePreview && (
                    <div className="image-preview-container">
                        <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={handleRemoveImage}
                                title="Quitar imagen"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="attach-btn"
                        title="Adjuntar imagen"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        type="button"
                        className="emoji-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Emojis"
                    >
                        <Smile size={20} />
                    </button>
                    <button
                        type="button"
                        className="quick-reply-btn"
                        onClick={() => setShowQuickReplies(true)}
                        title="Respuestas rápidas (presiona /)"
                    >
                        <Zap size={20} />
                    </button>
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Escribe un mensaje o presiona / para respuestas rápidas..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={1}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={(!newMessage.trim() && !selectedImage) || sending}
                        title="Enviar mensaje"
                    >
                        <Send size={20} />
                    </button>
                </form>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="emoji-picker-container">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width="320px"
                            height="400px"
                            previewConfig={{ showPreview: false }}
                            searchPlaceHolder="Buscar emoji..."
                        />
                    </div>
                )}
            </div>

            {showQuickReplies && (
                <QuickReplies
                    onSelectReply={handleSelectQuickReply}
                    onClose={() => setShowQuickReplies(false)}
                    user={user}
                />
            )}

            <TypificationModal
                isOpen={showTypificationModal}
                onClose={() => setShowTypificationModal(false)}
                onSubmit={handleTypificationSubmit}
                ticketId={ticket?.id}
            />

            {/* Modal de Avatar */}
            {showAvatarModal && ticket.contact_avatar && (
                <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
                    <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="avatar-modal-close"
                            onClick={() => setShowAvatarModal(false)}
                            title="Cerrar"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={ticket.contact_avatar}
                            alt={ticket.contact_name}
                            className="avatar-modal-image"
                        />
                        <div className="avatar-modal-info">
                            <h3>{ticket.contact_name}</h3>
                            <p>Ticket #{ticket.ticket_number}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatView;
