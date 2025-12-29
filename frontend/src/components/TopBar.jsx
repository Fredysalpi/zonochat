import { Settings, Menu, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from './NotificationSystem';
import './TopBar.css';

function TopBar({ user, userStatus, onStatusChange, onLogout, onToggleSidebar }) {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const menuRef = useRef(null);

    const statusOptions = [
        { value: 'available', label: 'Disponible', color: '#10b981' },
        { value: 'busy', label: 'Ocupado', color: '#f59e0b' },
        { value: 'offline', label: 'Desconectado', color: '#6b7280' }
    ];

    const currentStatus = statusOptions.find(s => s.value === userStatus) || statusOptions[0];

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (status) => {
        onStatusChange(status);
        setShowStatusMenu(false);
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="topbar">
            <div className="topbar-left">
                <button className="menu-btn" onClick={onToggleSidebar} title="Menú">
                    <Menu size={20} />
                </button>
                <div className="app-branding">
                    <h1 className="app-name">ZonoChat</h1>
                    <span className="app-time">La hora actual es: {formatTime()}</span>
                </div>
            </div>

            <div className="topbar-right">
                <div className="topbar-actions">
                    <NotificationBell />
                    <button className="action-btn" title="Configuración">
                        <Settings size={18} />
                    </button>
                </div>

                <div className="user-section" ref={menuRef}>
                    <div className="user-avatar-simple">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.first_name} />
                        ) : (
                            <div className="avatar-placeholder-simple">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="user-info-simple">
                        <span className="user-name-simple">{user?.first_name} {user?.last_name}</span>
                        <div
                            className="status-trigger"
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                        >
                            <div
                                className="status-dot-simple"
                                style={{ backgroundColor: currentStatus.color }}
                            ></div>
                            <span className="status-text">{currentStatus.label}</span>
                            <ChevronDown size={14} className="chevron-icon" />
                        </div>
                    </div>

                    {showStatusMenu && (
                        <div className="status-dropdown-menu">
                            {statusOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`status-option ${userStatus === option.value ? 'active' : ''}`}
                                    onClick={() => handleStatusSelect(option.value)}
                                >
                                    <div
                                        className="status-dot-option"
                                        style={{ backgroundColor: option.color }}
                                    ></div>
                                    <span>{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TopBar;
