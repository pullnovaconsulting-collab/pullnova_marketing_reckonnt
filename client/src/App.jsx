import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch health status
      const healthRes = await fetch('/api/health')
      const healthData = await healthRes.json()
      setHealth(healthData)

      // Fetch stats
      const statsRes = await fetch('/api/stats')
      const statsData = await statsRes.json()
      setStats(statsData)

    } catch (err) {
      setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const isConnected = health?.status === 'ok'

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">P</div>
          <span className="logo-text">PULLNOVA</span>
        </div>
        <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {loading ? 'Conectando...' : isConnected ? 'Base de datos conectada' : 'Desconectado'}
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <h1 className="hero-title">
          Bienvenido a <span className="highlight">PULLNOVA</span>
        </h1>
        <p className="hero-subtitle">
          Sistema de Asistencia de Marketing con IA - Gestiona tus campañas,
          contenido y métricas en un solo lugar.
        </p>

        {/* Stats Grid */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Cargando datos...</span>
          </div>
        ) : error ? (
          <div className="error">
            <p>⚠️ {error}</p>
            <button onClick={fetchData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">👤</div>
                <span className="stat-value">{stats?.stats?.usuarios || 0}</span>
                <span className="stat-label">Usuarios</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon campaigns">📊</div>
                <span className="stat-value">{stats?.stats?.campanas || 0}</span>
                <span className="stat-label">Campañas</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon content">📝</div>
                <span className="stat-value">{stats?.stats?.contenido || 0}</span>
                <span className="stat-label">Contenido</span>
              </div>
            </div>

            {/* Database Tables */}
            <div className="data-section">
              <div className="data-header">
                <span>🗄️</span>
                <h3>Tablas en la Base de Datos ({health?.database || 'railway'})</h3>
              </div>
              <div className="data-content">
                {health?.tables?.length > 0 ? (
                  <div className="tables-list">
                    {health.tables.map((table, index) => (
                      <span key={index} className="table-tag">{table}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No hay tablas todavía. Ejecuta el script init.sql para crearlas.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>PULLNOVA Marketing © 2024 - Sistema de Asistencia de Marketing IA - RECKONNT</p>
      </footer>
    </div>
  )
}

export default App
