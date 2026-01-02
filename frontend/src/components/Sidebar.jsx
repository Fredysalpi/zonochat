import { MessageSquare, Bell, Settings, LogOut, Building, Users, Radio } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ collapsed, onToggle, onLogout, activeView, onViewChange, user }) {
    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${activeView === 'conversations' ? 'active' : ''}`}
                    onClick={() => onViewChange('conversations')}
                    title="Conversaciones"
                >
                    <MessageSquare size={20} />
                    <span>Conversaciones</span>
                </button>
                <button
                    className={`nav-item ${activeView === 'notifications' ? 'active' : ''}`}
                    onClick={() => onViewChange('notifications')}
                    title="Notificaciones"
                >
                    <Bell size={20} />
                    <span>Notificaciones</span>
                </button>

                {/* Sección de Administración - Solo para admins */}
                {user?.role === 'admin' && (
                    <>
                        <div className="sidebar-divider">
                            <span>Administración</span>
                        </div>
                        <button
                            className={`nav-item ${activeView === 'tenants' ? 'active' : ''}`}
                            onClick={() => onViewChange('tenants')}
                            title="Empresas"
                        >
                            <Building size={20} />
                            <span>Empresas</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'agents' ? 'active' : ''}`}
                            onClick={() => onViewChange('agents')}
                            title="Agentes"
                        >
                            <Users size={20} />
                            <span>Agentes</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'channels' ? 'active' : ''}`}
                            onClick={() => onViewChange('channels')}
                            title="Canales"
                        >
                            <Radio size={20} />
                            <span>Canales</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                            onClick={() => onViewChange('settings')}
                            title="Configuración"
                        >
                            <Settings size={20} />
                            <span>Configuración</span>
                        </button>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
