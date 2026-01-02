import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import ImageModal from './ImageModal';
import './MessageBubble.css';

function MessageBubble({ message, isOwn, currentUser }) {
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState('');

    // Helper para construir URL de media correctamente
    const getMediaUrl = (mediaUrl) => {
        if (!mediaUrl) return '';

        // Si la URL ya es absoluta (empieza con http:// o https://), devolverla tal cual
        if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
            return mediaUrl;
        }

        // Si es una URL relativa, construir la URL completa
        const parts = mediaUrl.split('/');
        const filename = parts[parts.length - 1];
        const path = parts.slice(0, -1).join('/');
        return `http://localhost:3000${path}/${encodeURIComponent(filename)}`;
    };

    const handleImageClick = (imageUrl) => {
        setModalImageUrl(imageUrl);
        setShowImageModal(true);
    };

    // Debug: ver estructura del mensaje
    if (message.message_type === 'image') {
        console.log('🖼️ Renderizando imagen:', {
            media_url: message.media_url,
            full_url: getMediaUrl(message.media_url),
            message_type: message.message_type,
            content: message.content
        });
    }

    const formatTime = (date) => {
        if (!date) return '';
        try {
            return format(new Date(date), 'HH:mm', { locale: es });
        } catch {
            return '';
        }
    };

    const getSenderName = () => {
        // Si el mensaje es del usuario actual, mostrar "Tú"
        if (currentUser && message.sender_id === currentUser.id) {
            return 'Tú';
        }

        // Si es un mensaje del agente
        if (message.sender_type === 'agent') {
            if (message.sender_name) {
                return message.sender_name;
            }
            if (message.first_name && message.last_name) {
                return `${message.first_name} ${message.last_name}`;
            }
            return 'Agente';
        }

        // Si es un mensaje del cliente/contacto
        if (message.sender_type === 'contact' || message.sender_type === 'customer') {
            if (message.sender_name) {
                return message.sender_name;
            }
            return 'Cliente';
        }

        // Fallback
        return message.sender_name || 'Cliente';
    };

    // Si es un mensaje del sistema, renderizar de manera especial
    if (message.sender_type === 'system') {
        return (
            <div className="system-message">
                <div className="system-message-content">
                    <span className="system-icon">ℹ️</span>
                    <span className="system-text">{message.content}</span>
                </div>
                <div className="system-time">{formatTime(message.created_at)}</div>
            </div>
        );
    }

    return (
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            {!isOwn && (
                <div className="message-sender">
                    {getSenderName()}
                </div>
            )}
            <div className="message-content">
                {(message.message_type === 'text' || !message.message_type) && (
                    <p>{message.content}</p>
                )}
                {message.message_type === 'image' && (
                    <div className="message-media">
                        <img
                            src={getMediaUrl(message.media_url)}
                            alt="Imagen"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleImageClick(getMediaUrl(message.media_url))}
                            onLoad={() => console.log('✅ Imagen cargada:', message.media_url)}
                            onError={(e) => {
                                console.error('❌ Error al cargar imagen:', {
                                    url: getMediaUrl(message.media_url),
                                    media_url: message.media_url,
                                    error: e
                                });
                                e.target.style.display = 'none';
                            }}
                        />
                        {message.content && message.content !== 'Imagen' && <p>{message.content}</p>}
                    </div>
                )}
                {message.message_type === 'video' && (
                    <div className="message-media">
                        <video src={getMediaUrl(message.media_url)} controls />
                        {message.content && <p>{message.content}</p>}
                    </div>
                )}
                {message.message_type === 'audio' && (
                    <div className="message-media">
                        <audio src={getMediaUrl(message.media_url)} controls />
                    </div>
                )}
                {message.message_type === 'document' && (
                    <div className="message-document">
                        <a href={getMediaUrl(message.media_url)} target="_blank" rel="noopener noreferrer">
                            📄 {message.content || 'Documento'}
                        </a>
                    </div>
                )}
            </div>
            <div className="message-meta">
                <span className="message-time">{formatTime(message.created_at)}</span>
                {isOwn && (
                    <span className="message-status">
                        {message.is_read ? (
                            // 2 checks azules - Mensaje leído (solo funciona en producción)
                            <CheckCheck size={14} className="status-read" />
                        ) : message.external_message_id ? (
                            // 2 checks grises - Mensaje entregado
                            <CheckCheck size={14} className="status-delivered" />
                        ) : (
                            // 1 check gris - Mensaje enviado
                            <Check size={14} className="status-sent" />
                        )}
                    </span>
                )}
            </div>

            {/* Modal de imagen */}
            {showImageModal && (
                <ImageModal
                    imageUrl={modalImageUrl}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </div>
    );
}

export default MessageBubble;
