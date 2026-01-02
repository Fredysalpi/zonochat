// Componente utilitario para mostrar iconos de canales
export const getChannelIcon = (channel, size = 16) => {
    const icons = {
        whatsapp: <img src="/img/whatsapp.png" alt="WhatsApp" style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }} />,
        messenger: <img src="/img/facebook.png" alt="Messenger" style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }} />,
        instagram: <img src="/img/instagram.png" alt="Instagram" style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }} />,
        email: '📧',
        web: '🌐',
        telegram: '✈️'
    };
    return icons[channel?.toLowerCase()] || '💬';
};

export default getChannelIcon;
