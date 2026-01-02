import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ChannelSettings.css';

const ChannelSettings = () => {
    const [activeTab, setActiveTab] = useState('messenger');
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const channels = [
        {
            id: 'messenger',
            name: 'Messenger',
            icon: 'fab fa-facebook-messenger',
            color: '#0084ff',
            fields: [
                { name: 'page_access_token', label: 'Page Access Token', type: 'password', required: true },
                { name: 'verify_token', label: 'Verify Token', type: 'text', required: true },
                { name: 'page_id', label: 'Page ID', type: 'text', required: true },
                { name: 'app_id', label: 'App ID', type: 'text', required: false },
                { name: 'app_secret', label: 'App Secret', type: 'password', required: false }
            ]
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            color: '#25d366',
            fields: [
                { name: 'phone_number_id', label: 'Phone Number ID', type: 'text', required: true },
                { name: 'business_account_id', label: 'Business Account ID', type: 'text', required: true },
                { name: 'access_token', label: 'Access Token', type: 'password', required: true },
                { name: 'verify_token', label: 'Verify Token', type: 'text', required: true }
            ]
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: 'fab fa-instagram',
            color: '#e4405f',
            fields: [
                { name: 'instagram_account_id', label: 'Instagram Account ID', type: 'text', required: true },
                { name: 'page_access_token', label: 'Page Access Token', type: 'password', required: true },
                { name: 'verify_token', label: 'Verify Token', type: 'text', required: true }
            ]
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: 'fab fa-telegram',
            color: '#0088cc',
            fields: [
                { name: 'bot_token', label: 'Bot Token', type: 'password', required: true },
                { name: 'webhook_url', label: 'Webhook URL', type: 'text', required: false }
            ]
        }
    ];

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/channel-config');
            const configsMap = {};
            response.data.configs.forEach(config => {
                configsMap[config.channel_type] = config;
            });
            setConfigs(configsMap);
        } catch (error) {
            console.error('Error cargando configuraciones:', error);
            alert('Error al cargar las configuraciones');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (channelId) => {
        try {
            setSaving(true);
            const config = configs[channelId]?.config || {};
            await api.post(`/channel-config/${channelId}`, config);
            alert('Configuración guardada exitosamente');
            loadConfigs();
        } catch (error) {
            console.error('Error guardando configuración:', error);
            alert(error.response?.data?.error || 'Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleChannel = async (channelId) => {
        try {
            const currentStatus = configs[channelId]?.is_active || false;
            await api.patch(`/channel-config/${channelId}/toggle`, {
                isActive: !currentStatus
            });
            alert(`Canal ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
            loadConfigs();
        } catch (error) {
            console.error('Error toggling canal:', error);
            alert(error.response?.data?.error || 'Error al cambiar el estado del canal');
        }
    };

    const handleTestConfig = async (channelId) => {
        try {
            await api.post(`/channel-config/${channelId}/test`);
            alert('✅ Configuración válida');
        } catch (error) {
            console.error('Error probando configuración:', error);
            alert(error.response?.data?.error || 'Error en la configuración');
        }
    };

    const updateConfigField = (channelId, fieldName, value) => {
        setConfigs(prev => ({
            ...prev,
            [channelId]: {
                ...prev[channelId],
                config: {
                    ...(prev[channelId]?.config || {}),
                    [fieldName]: value
                }
            }
        }));
    };

    const getWebhookUrl = (channelId) => {
        const baseUrl = window.location.origin.replace('5173', '3000'); // Ajustar para desarrollo
        return `${baseUrl}/api/webhooks/${channelId}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('✅ Copiado al portapapeles');
    };

    if (loading) {
        return (
            <div className="channel-settings">
                <div className="loading-spinner">Cargando configuraciones...</div>
            </div>
        );
    }

    const activeChannel = channels.find(c => c.id === activeTab);

    return (
        <div className="channel-settings">
            <div className="settings-header">
                <h1>Configuración de Canales</h1>
                <p>Configura los tokens y credenciales de tus canales de comunicación</p>
            </div>

            <div className="channel-tabs">
                {channels.map(channel => {
                    const isActive = configs[channel.id]?.is_active;
                    return (
                        <button
                            key={channel.id}
                            className={`channel-tab ${activeTab === channel.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(channel.id)}
                        >
                            <i className={channel.icon} style={{ color: channel.color }}></i>
                            <span>{channel.name}</span>
                            {isActive && (
                                <span className="active-indicator">
                                    <i className="fas fa-circle"></i>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="channel-content">
                <div className="channel-header">
                    <div className="channel-title">
                        <i className={activeChannel.icon} style={{ color: activeChannel.color }}></i>
                        <h2>{activeChannel.name}</h2>
                    </div>
                    <div className="channel-status">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={configs[activeTab]?.is_active || false}
                                onChange={() => handleToggleChannel(activeTab)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className={`status-text ${configs[activeTab]?.is_active ? 'active' : ''}`}>
                            {configs[activeTab]?.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                <div className="webhook-info">
                    <div className="info-card">
                        <i className="fas fa-link"></i>
                        <div className="info-content">
                            <label>Webhook URL</label>
                            <div className="webhook-url">
                                <code>{getWebhookUrl(activeTab)}</code>
                                <button
                                    className="btn-copy"
                                    onClick={() => copyToClipboard(getWebhookUrl(activeTab))}
                                >
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <form className="config-form" onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveConfig(activeTab);
                }}>
                    <div className="form-fields">
                        {activeChannel.fields.map(field => (
                            <div key={field.name} className="form-group">
                                <label>
                                    {field.label}
                                    {field.required && <span className="required">*</span>}
                                </label>
                                <input
                                    type={field.type}
                                    value={configs[activeTab]?.config?.[field.name] || ''}
                                    onChange={(e) => updateConfigField(activeTab, field.name, e.target.value)}
                                    placeholder={`Ingresa tu ${field.label}`}
                                    required={field.required}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-test"
                            onClick={() => handleTestConfig(activeTab)}
                        >
                            <i className="fas fa-vial"></i> Probar Configuración
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={saving}
                        >
                            <i className="fas fa-save"></i>
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </form>

                <div className="help-section">
                    <h3><i className="fas fa-question-circle"></i> ¿Cómo obtener las credenciales?</h3>
                    {activeTab === 'messenger' && (
                        <div className="help-content">
                            <ol>
                                <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">Meta for Developers</a></li>
                                <li>Crea o selecciona tu aplicación</li>
                                <li>Agrega el producto "Messenger"</li>
                                <li>En "Configuración" → "Messenger" encontrarás el Page Access Token</li>
                                <li>Configura el webhook con la URL mostrada arriba</li>
                                <li>Usa el Verify Token que prefieras (debe coincidir con el que configures aquí)</li>
                            </ol>
                        </div>
                    )}
                    {activeTab === 'whatsapp' && (
                        <div className="help-content">
                            <ol>
                                <li>Ve a <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">Meta Business</a></li>
                                <li>Configura WhatsApp Business API</li>
                                <li>Obtén el Phone Number ID y Business Account ID</li>
                                <li>Genera un Access Token permanente</li>
                                <li>Configura el webhook con la URL mostrada arriba</li>
                            </ol>
                        </div>
                    )}
                    {activeTab === 'instagram' && (
                        <div className="help-content">
                            <ol>
                                <li>Conecta tu cuenta de Instagram a una página de Facebook</li>
                                <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">Meta for Developers</a></li>
                                <li>Agrega el producto "Instagram"</li>
                                <li>Obtén el Instagram Account ID</li>
                                <li>Usa el Page Access Token de la página conectada</li>
                            </ol>
                        </div>
                    )}
                    {activeTab === 'telegram' && (
                        <div className="help-content">
                            <ol>
                                <li>Habla con <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a> en Telegram</li>
                                <li>Usa el comando /newbot para crear un nuevo bot</li>
                                <li>Sigue las instrucciones y obtén tu Bot Token</li>
                                <li>Configura el webhook usando la API de Telegram</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChannelSettings;
