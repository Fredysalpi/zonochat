import { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import api from '../services/api';
import './MetricsPanel.css';

function MetricsPanel({ user }) {
    const [metrics, setMetrics] = useState({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: 0,
        agentStats: [],
        ticketsByDay: []
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('week'); // week, month, year

    useEffect(() => {
        loadMetrics();
    }, [dateRange]);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/metrics?range=${dateRange}`);
            setMetrics(response.data);
        } catch (error) {
            console.error('Error al cargar métricas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="metrics-panel">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando métricas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="metrics-panel">
            <div className="metrics-header">
                <div className="header-left">
                    <BarChart3 size={24} />
                    <h1>Métricas y Reportes</h1>
                </div>
                <div className="date-range-selector">
                    <button
                        className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
                        onClick={() => setDateRange('week')}
                    >
                        Semana
                    </button>
                    <button
                        className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
                        onClick={() => setDateRange('month')}
                    >
                        Mes
                    </button>
                    <button
                        className={`range-btn ${dateRange === 'year' ? 'active' : ''}`}
                        onClick={() => setDateRange('year')}
                    >
                        Año
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        <Users size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>Total Tickets</h3>
                        <p className="kpi-value">{metrics.totalTickets}</p>
                        <span className="kpi-label">En el período</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>Tickets Abiertos</h3>
                        <p className="kpi-value">{metrics.openTickets}</p>
                        <span className="kpi-label">Pendientes</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>Resueltos</h3>
                        <p className="kpi-value">{metrics.resolvedTickets}</p>
                        <span className="kpi-label">Completados</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>Tiempo Promedio</h3>
                        <p className="kpi-value">{formatTime(metrics.avgResponseTime)}</p>
                        <span className="kpi-label">De respuesta</span>
                    </div>
                </div>
            </div>

            {/* Agent Performance */}
            <div className="metrics-section">
                <h2>Rendimiento por Agente</h2>
                <div className="agent-stats-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Agente</th>
                                <th>Tickets Asignados</th>
                                <th>Resueltos</th>
                                <th>Tiempo Promedio</th>
                                <th>Tasa de Resolución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.agentStats.map(agent => (
                                <tr key={agent.id}>
                                    <td>
                                        <div className="agent-cell">
                                            <div className="agent-avatar">
                                                {agent.avatar ? (
                                                    <img src={agent.avatar} alt={agent.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {agent.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                )}
                                            </div>
                                            <span>{agent.name}</span>
                                        </div>
                                    </td>
                                    <td>{agent.assigned}</td>
                                    <td>{agent.resolved}</td>
                                    <td>{formatTime(agent.avgTime)}</td>
                                    <td>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${agent.resolutionRate}%` }}
                                            ></div>
                                            <span>{agent.resolutionRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tickets by Day Chart */}
            <div className="metrics-section">
                <h2>Tickets por Día</h2>
                <div className="chart-container">
                    <div className="bar-chart">
                        {metrics.ticketsByDay.map((day, index) => {
                            const maxTickets = Math.max(...metrics.ticketsByDay.map(d => d.count));
                            const height = (day.count / maxTickets) * 100;
                            return (
                                <div key={index} className="bar-wrapper">
                                    <div className="bar-label">{day.count}</div>
                                    <div
                                        className="bar"
                                        style={{ height: `${height}%` }}
                                        title={`${day.date}: ${day.count} tickets`}
                                    ></div>
                                    <div className="bar-date">{day.date}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Export Button */}
            <div className="metrics-actions">
                <button className="btn-export" onClick={() => window.print()}>
                    <Calendar size={18} />
                    Exportar Reporte
                </button>
            </div>
        </div>
    );
}

export default MetricsPanel;
