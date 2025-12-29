import { useState, useEffect } from 'react';
import { Zap, Search, X, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import './QuickReplies.css';

function QuickReplies({ onSelectReply, onClose, user }) {
    const [quickReplies, setQuickReplies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingReply, setEditingReply] = useState(null);

    const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

    useEffect(() => {
        loadQuickReplies();
    }, []);

    const loadQuickReplies = async () => {
        try {
            setLoading(true);
            const response = await api.get('/quick-replies');
            setQuickReplies(response.data.quickReplies || []);
        } catch (error) {
            console.error('Error al cargar respuestas rápidas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReplies = quickReplies.filter(reply =>
        reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reply.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reply.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectReply = (reply) => {
        onSelectReply(reply.content);
        onClose();
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de eliminar esta respuesta rápida?')) {
            try {
                await api.delete(`/quick-replies/${id}`);
                loadQuickReplies();
            } catch (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar la respuesta rápida');
            }
        }
    };

    const handleEdit = (reply, e) => {
        e.stopPropagation();
        setEditingReply(reply);
        setShowCreateModal(true);
    };

    return (
        <div className="quick-replies-overlay" onClick={onClose}>
            <div className="quick-replies-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quick-replies-header">
                    <div className="header-left">
                        <Zap size={20} />
                        <h2>Respuestas Rápidas</h2>
                    </div>
                    <div className="header-actions">
                        {isAdmin && (
                            <button
                                className="btn-create-reply"
                                onClick={() => {
                                    setEditingReply(null);
                                    setShowCreateModal(true);
                                }}
                            >
                                <Plus size={16} />
                                Nueva
                            </button>
                        )}
                        <button className="btn-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="quick-replies-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título, atajo o contenido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="quick-replies-list">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando respuestas...</p>
                        </div>
                    ) : filteredReplies.length === 0 ? (
                        <div className="empty-state">
                            <Zap size={48} />
                            <p>No hay respuestas rápidas</p>
                            {isAdmin && (
                                <button
                                    className="btn-create-first"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Crear la primera
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredReplies.map(reply => (
                            <div
                                key={reply.id}
                                className="quick-reply-item"
                                onClick={() => handleSelectReply(reply)}
                            >
                                <div className="reply-main">
                                    <div className="reply-header">
                                        <h3>{reply.title}</h3>
                                        <span className="reply-shortcut">/{reply.shortcut}</span>
                                    </div>
                                    <p className="reply-content">{reply.content}</p>
                                    {reply.category && (
                                        <span className="reply-category">{reply.category}</span>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="reply-actions">
                                        <button
                                            className="btn-icon-action"
                                            onClick={(e) => handleEdit(reply, e)}
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="btn-icon-action delete"
                                            onClick={(e) => handleDelete(reply.id, e)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="quick-replies-footer">
                    <p className="hint">
                        <strong>Tip:</strong> Escribe <code>/</code> seguido del atajo para usar una respuesta rápida
                    </p>
                </div>
            </div>

            {showCreateModal && (
                <CreateQuickReplyModal
                    reply={editingReply}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingReply(null);
                    }}
                    onSave={() => {
                        setShowCreateModal(false);
                        setEditingReply(null);
                        loadQuickReplies();
                    }}
                />
            )}
        </div>
    );
}

function CreateQuickReplyModal({ reply, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: reply?.title || '',
        shortcut: reply?.shortcut || '',
        content: reply?.content || '',
        category: reply?.category || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.shortcut || !formData.content) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            setSaving(true);
            if (reply) {
                await api.put(`/quick-replies/${reply.id}`, formData);
            } else {
                await api.post('/quick-replies', formData);
            }
            onSave();
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar la respuesta rápida');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal" onClick={(e) => e.stopPropagation()}>
                <div className="create-modal-header">
                    <h3>{reply ? 'Editar' : 'Nueva'} Respuesta Rápida</h3>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="create-modal-form">
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Saludo inicial"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Atajo * <span className="hint-text">(sin espacios)</span></label>
                        <div className="input-with-prefix">
                            <span className="prefix">/</span>
                            <input
                                type="text"
                                value={formData.shortcut}
                                onChange={(e) => setFormData({ ...formData, shortcut: e.target.value.replace(/\s/g, '') })}
                                placeholder="hola"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Categoría</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Ej: Saludos, Despedidas, Soporte"
                        />
                    </div>

                    <div className="form-group">
                        <label>Contenido *</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Escribe el mensaje que se enviará..."
                            rows={5}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Guardando...' : (reply ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default QuickReplies;
