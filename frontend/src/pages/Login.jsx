import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mail, ArrowRight } from 'lucide-react';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="login-content">
                <div className="login-card">
                    <div className="login-header">
                        <div className="logo-container">
                            <div className="logo-icon">
                                <MessageSquare size={32} strokeWidth={2.5} />
                            </div>
                            <h1 className="logo-text">ZonoChat</h1>
                        </div>
                        <p className="login-subtitle">
                            Sistema de gestión de conversaciones omnicanal
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="error-message fade-in">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <Mail size={16} />
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="agente@zonochat.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <Lock size={16} />
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p className="demo-info">
                            <strong>Demo:</strong> admin@zonochat.com / admin123
                        </p>
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon whatsapp">
                            <MessageSquare size={20} />
                        </div>
                        <h3>WhatsApp</h3>
                        <p>Gestiona conversaciones de WhatsApp Business</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon messenger">
                            <MessageSquare size={20} />
                        </div>
                        <h3>Messenger</h3>
                        <p>Atiende mensajes de Facebook Messenger</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon instagram">
                            <MessageSquare size={20} />
                        </div>
                        <h3>Instagram</h3>
                        <p>Responde DMs de Instagram Business</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
