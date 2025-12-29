import { useState, useEffect, createContext, useContext } from 'react';
import { Bell } from 'lucide-react';
import './NotificationSystem.css';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export function NotificationProvider({ children, socket, user }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (socket && user) {
            // Escuchar nuevos mensajes
            socket.on('message:new', (message) => {
                // Solo notificar si el mensaje no es del usuario actual
                if (message.sender_id !== user.id) {
                    addNotification({
                        id: Date.now(),
                        type: 'message',
                        title: 'Nuevo mensaje',
                        message: `${message.sender_name || 'Cliente'}: ${message.content.substring(0, 50)}...`,
                        ticketId: message.ticket_id,
                        timestamp: new Date()
                    });
                    playNotificationSound();
                }
            });

            // Escuchar tickets asignados
            socket.on('ticket:assigned', (ticket) => {
                addNotification({
                    id: Date.now(),
                    type: 'assignment',
                    title: 'Ticket asignado',
                    message: `Se te ha asignado el ticket #${ticket.ticket_number}`,
                    ticketId: ticket.id,
                    timestamp: new Date()
                });
                playNotificationSound();
            });

            // Escuchar transferencias
            socket.on('ticket:transferred_in', (ticket) => {
                addNotification({
                    id: Date.now(),
                    type: 'transfer',
                    title: 'Ticket transferido',
                    message: `Se te ha transferido el ticket #${ticket.ticket_number}`,
                    ticketId: ticket.id,
                    timestamp: new Date()
                });
                playNotificationSound();
            });

            return () => {
                socket.off('message:new');
                socket.off('ticket:assigned');
                socket.off('ticket:transferred_in');
            };
        }
    }, [socket, user]);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 20)); // Mantener solo las últimas 20
        setUnreadCount(prev => prev + 1);

        // Notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
                badge: '/logo.png'
            });
        }
    };

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Error playing sound:', err));
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const requestPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    };

    useEffect(() => {
        requestPermission();
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                showNotifications,
                setShowNotifications,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function NotificationBell() {
    const { unreadCount, showNotifications, setShowNotifications, notifications, markAsRead, markAllAsRead } = useNotifications();

    const formatTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        return `Hace ${Math.floor(diff / 86400)}d`;
    };

    const getNotificationIcon = (type) => {
        const icons = {
            message: '💬',
            assignment: '📋',
            transfer: '🔄',
            status: '📊'
        };
        return icons[type] || '🔔';
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showNotifications && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notificaciones</h3>
                        {notifications.length > 0 && (
                            <button className="mark-all-read" onClick={markAllAsRead}>
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <Bell size={48} />
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <h4>{notification.title}</h4>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">{formatTime(notification.timestamp)}</span>
                                    </div>
                                    {!notification.read && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
