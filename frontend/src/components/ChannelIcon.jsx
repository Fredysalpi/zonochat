// Componente para mostrar iconos de canales
import React from 'react';

export function ChannelIcon({ channel, size = 16 }) {
    const iconStyle = {
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle'
    };

    const channelLower = channel?.toLowerCase() || '';

    switch (channelLower) {
        case 'whatsapp':
            return <img src="/img/whatsapp.png" alt="WhatsApp" style={iconStyle} />;
        case 'messenger':
            return <img src="/img/facebook.png" alt="Messenger" style={iconStyle} />;
        case 'instagram':
            return <img src="/img/instagram.png" alt="Instagram" style={iconStyle} />;
        case 'email':
            return <span style={{ fontSize: `${size}px` }}>📧</span>;
        case 'web':
            return <span style={{ fontSize: `${size}px` }}>🌐</span>;
        case 'telegram':
            return <span style={{ fontSize: `${size}px` }}>✈️</span>;
        default:
            return <span style={{ fontSize: `${size}px` }}>💬</span>;
    }
}

// Función helper para usar en lugares donde no se puede usar JSX
export const getChannelIcon = (channel, size = 16) => {
    return <ChannelIcon channel={channel} size={size} />;
};

export default ChannelIcon;
