import { MessageSquare, Bell, Settings, LogOut } from 'lucide-react';
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
                {user?.role === 'admin' && (
                    <button
                        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                        onClick={() => onViewChange('settings')}
                        title="Configuración"
                    >
                        <Settings size={20} />
                        <span>Configuración</span>
                    </button>
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
