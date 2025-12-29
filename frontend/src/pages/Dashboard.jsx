import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import SupervisorPanel from '../components/SupervisorPanel';
import TicketList from '../components/TicketList';
import ChatView from '../components/ChatView';
import ContactInfo from '../components/ContactInfo';
import SettingsPanel from '../components/SettingsPanel';
import { NotificationProvider } from '../components/NotificationSystem';
import useNotificationSound from '../hooks/useNotificationSound';
import './Dashboard.css';

function Dashboard() {
    const { isAuthenticated, user, logout } = useAuth();
    const [socket, setSocket] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userStatus, setUserStatus] = useState('available');
    const [showContactInfo, setShowContactInfo] = useState(true);
    const [activeView, setActiveView] = useState('conversations');

    // Hook para reproducir sonido de notificación
    const { playNotification } = useNotificationSound();

    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('🔌 Iniciando conexión WebSocket para usuario:', user);
            const newSocket = io('http://localhost:3000');

            newSocket.on('connect', () => {
                console.log('✅ Conectado a WebSocket, socket.id:', newSocket.id);
                console.log('📤 Emitiendo agent:join con user.id:', user.id, 'tipo:', typeof user.id);
                newSocket.emit('agent:join', user.id);

                // Emitir estado inicial del agente
                newSocket.emit('agent:status', {
                    agentId: user.id,
                    status: userStatus
                });
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Error de conexión WebSocket:', error);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Desconectado de WebSocket. Razón:', reason);
            });

            newSocket.on('error', (error) => {
                console.error('❌ Error en WebSocket:', error);
            });

            newSocket.on('ticket:created', (ticket) => {
                console.log('Nuevo ticket:', ticket);
                setTickets(prev => [ticket, ...prev]);

                // Reproducir sonido si es un agente y el ticket le fue asignado
                if (user.role === 'agent' && ticket.assigned_to === user.id) {
                    console.log('🔔 Reproduciendo notificación de nuevo ticket');
                    playNotification();
                }
            });

            // Listener específico para cuando se asigna un ticket al agente
            newSocket.on('ticket:assigned', (ticket) => {
                console.log('✅ Ticket asignado a mí:', ticket);

                // Agregar el ticket a la lista si no existe
                setTickets(prev => {
                    const exists = prev.find(t => t.id === ticket.id);
                    if (exists) {
                        // Si ya existe, actualizarlo
                        return prev.map(t => t.id === ticket.id ? ticket : t);
                    } else {
                        // Si no existe, agregarlo al inicio
                        return [ticket, ...prev];
                    }
                });

                // Reproducir sonido de notificación
                console.log('🔔 Reproduciendo notificación de ticket asignado');
                playNotification();
            });

            newSocket.on('ticket:updated', (ticket) => {
                console.log('Ticket actualizado:', ticket);

                // Si es un agente
                if (user.role === 'agent') {
                    setTickets(prev => {
                        const exists = prev.find(t => t.id === ticket.id);

                        // Si el ticket está asignado al agente
                        if (ticket.assigned_to === user.id) {
                            if (exists) {
                                // Actualizar ticket existente
                                return prev.map(t => t.id === ticket.id ? ticket : t);
                            } else {
                                // Agregar nuevo ticket asignado
                                return [ticket, ...prev];
                            }
                        } else {
                            // Si el ticket NO está asignado al agente, eliminarlo de la lista
                            if (exists) {
                                console.log('🗑️ Eliminando ticket de la lista (ya no asignado)');
                                return prev.filter(t => t.id !== ticket.id);
                            }
                            // Si no existe, no hacer nada
                            return prev;
                        }
                    });
                } else {
                    // Para supervisores/admins, solo actualizar
                    setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
                }
            });

            // Listener para cuando se transfiere un ticket a otro agente
            newSocket.on('ticket:transferred_out', (data) => {
                console.log('📤 Ticket transferido a otro agente:', data);
                console.log('🗑️ Eliminando ticket ID:', data.ticketId);
                // Eliminar el ticket de la lista
                setTickets(prev => {
                    console.log('📋 Tickets antes de eliminar:', prev.length);
                    const filtered = prev.filter(t => t.id !== data.ticketId);
                    console.log('📋 Tickets después de eliminar:', filtered.length);
                    return filtered;
                });
            });

            // Listener para cuando se transfiere un ticket al agente
            newSocket.on('ticket:transferred_in', (data) => {
                console.log('📥 Ticket transferido a mí:', data);

                // Agregar el ticket a la lista
                setTickets(prev => {
                    const exists = prev.find(t => t.id === data.id);
                    if (!exists) {
                        return [data, ...prev];
                    }
                    return prev.map(t => t.id === data.id ? data : t);
                });

                // Reproducir sonido de notificación
                console.log('🔔 Reproduciendo notificación de ticket transferido');
                playNotification();
            });

            newSocket.on('message:new', (message) => {
                console.log('Nuevo mensaje:', message);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [isAuthenticated, user]);

    // Emitir cambio de estado cuando el usuario lo modifica
    useEffect(() => {
        if (socket && user) {
            console.log('📤 Emitiendo cambio de estado:', userStatus);
            socket.emit('agent:status', {
                agentId: user.id,
                status: userStatus
            });
        }
    }, [userStatus, socket, user]);

    const handleSelectAgent = (agent) => {
        setSelectedAgent(agent);
        setSelectedTicket(null); // Limpiar ticket seleccionado al cambiar de agente
    };

    const handleToggleContactInfo = () => {
        setShowContactInfo(!showContactInfo);
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <NotificationProvider socket={socket} user={user}>
            <div className="dashboard-container">
                <TopBar
                    user={user}
                    userStatus={userStatus}
                    onStatusChange={setUserStatus}
                    onLogout={logout}
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <div className="dashboard-body">
                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                        onLogout={logout}
                        activeView={activeView}
                        onViewChange={setActiveView}
                        user={user}
                    />

                    <div className="dashboard-main">
                        {activeView === 'settings' ? (
                            <SettingsPanel user={user} />
                        ) : (
                            <div className={`dashboard-content ${user.role === 'supervisor' || user.role === 'admin' ? 'supervisor-layout' : 'agent-layout'} ${!showContactInfo ? 'hide-contact-info' : ''}`}>
                                {/* Panel del Supervisor - Solo para Supervisor y Admin */}
                                {(user.role === 'supervisor' || user.role === 'admin') && (
                                    <div className="supervisor-section">
                                        <SupervisorPanel onSelectAgent={handleSelectAgent} socket={socket} />
                                    </div>
                                )}

                                {/* Panel de Tickets */}
                                <div className="tickets-section">
                                    <TicketList
                                        tickets={tickets}
                                        setTickets={setTickets}
                                        selectedTicket={selectedTicket}
                                        onSelectTicket={setSelectedTicket}
                                        user={user}
                                        selectedAgent={selectedAgent}
                                    />
                                </div>

                                {/* Panel de Chat */}
                                <div className="chat-section">
                                    {selectedTicket ? (
                                        <ChatView
                                            ticket={selectedTicket}
                                            socket={socket}
                                            user={user}
                                            onToggleContactInfo={handleToggleContactInfo}
                                            showContactInfo={showContactInfo}
                                        />
                                    ) : (
                                        <div className="no-ticket-selected">
                                            <div className="empty-state">
                                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                                <h3>Selecciona una conversación</h3>
                                                <p>Elige un ticket de la lista para comenzar a chatear</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Panel de Información del Contacto */}
                                {showContactInfo && (
                                    <div className="contact-info-section">
                                        {selectedTicket ? (
                                            <ContactInfo ticket={selectedTicket} />
                                        ) : (
                                            <div className="no-contact-info">
                                                <p>Información del contacto</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </NotificationProvider>
    );
}

export default Dashboard;
