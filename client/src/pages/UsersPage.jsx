/**
 * @fileoverview Página de Gestión de Usuarios
 * @description CRUD completo de usuarios para administradores
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as usersApi from '../services/usersApi';
import UserModal from '../components/UserModal';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import '../styles/Users.css';

export default function UsersPage() {
    const { user: currentUser, logout } = useAuth();

    // Estado de datos
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    // Estado de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Filtros
    const [filterRol, setFilterRol] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    /**
     * Carga la lista de usuarios
     */
    const fetchUsers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await usersApi.getUsers(page, pagination.limit);

            setUsers(response.data.data || []);
            setPagination({
                page: response.data.page || 1,
                limit: response.data.limit || 10,
                total: response.data.total || 0,
                pages: response.data.pages || 0
            });
        } catch (err) {
            setError(err.message || 'Error al cargar usuarios');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    /**
     * Abre modal para crear usuario
     */
    const handleCreate = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    /**
     * Abre modal para editar usuario
     */
    const handleEdit = (user) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    /**
     * Guarda usuario (crear o editar)
     */
    const handleSave = async (userData) => {
        try {
            setSaving(true);
            setError(null);

            if (editingUser) {
                await usersApi.updateUser(editingUser.id, userData);
                setSuccess('Usuario actualizado exitosamente');
            } else {
                await usersApi.createUser(userData);
                setSuccess('Usuario creado exitosamente');
            }

            setModalOpen(false);
            setEditingUser(null);
            fetchUsers(pagination.page);

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al guardar usuario');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Elimina (desactiva) un usuario
     */
    const handleDelete = async (user) => {
        if (user.id === currentUser?.id) {
            setError('No puedes eliminarte a ti mismo');
            return;
        }

        const confirmed = window.confirm(
            `¿Estás seguro de desactivar al usuario "${user.nombre}"?`
        );

        if (!confirmed) return;

        try {
            setError(null);
            await usersApi.deleteUser(user.id);
            setSuccess('Usuario desactivado exitosamente');
            fetchUsers(pagination.page);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al eliminar usuario');
        }
    };

    /**
     * Cambia de página
     */
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchUsers(newPage);
        }
    };

    /**
     * Filtra usuarios
     */
    const filteredUsers = users.filter(user => {
        if (filterRol && user.rol !== filterRol) return false;
        if (filterEstado && user.estado !== filterEstado) return false;
        return true;
    });

    /**
     * Obtiene clase de badge según rol
     */
    const getRolBadgeClass = (rol) => {
        const classes = {
            admin: 'badge-admin',
            editor: 'badge-editor',
            viewer: 'badge-viewer'
        };
        return `badge ${classes[rol] || 'badge-viewer'}`;
    };

    /**
     * Obtiene clase de badge según estado
     */
    const getEstadoBadgeClass = (estado) => {
        return `badge ${estado === 'activo' ? 'badge-activo' : 'badge-inactivo'}`;
    };

    /**
     * Formatea fecha
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <Layout>
            <div className="users-page">
                {/* Header de página */}
                <div className="page-header">
                    <h1 className="page-title"><Users size={24} /> Gestión de Usuarios</h1>
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                </div>

                {/* Alertas */}
                {success && (
                    <div className="alert alert-success">✓ {success}</div>
                )}
                {error && (
                    <div className="alert alert-error">⚠️ {error}</div>
                )}

                {/* Filtros */}
                <div className="filters-bar">
                    <select
                        className="filter-select"
                        value={filterRol}
                        onChange={(e) => setFilterRol(e.target.value)}
                    >
                        <option value="">Todos los roles</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <select
                        className="filter-select"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>

                {/* Tabla de usuarios */}
                <div className="users-table-container">
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <span>Cargando usuarios...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} className="empty-state-icon" />
                                <p>No hay usuarios para mostrar</p>
                            </div>
                    ) : (
                        <>
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Creado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.nombre}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={getRolBadgeClass(user.rol)}>
                                                    {user.rol}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getEstadoBadgeClass(user.estado)}>
                                                    {user.estado}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.created_at)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Pencil size={14} /> Editar
                                                    </button>
                                                    {user.id !== currentUser?.id && (
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => handleDelete(user)}
                                                        >
                                                            <Trash2 size={14} /> Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            {pagination.pages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        ← Anterior
                                    </button>
                                    <span className="pagination-info">
                                        Página {pagination.page} de {pagination.pages}
                                    </span>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            <UserModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingUser(null);
                }}
                onSave={handleSave}
                user={editingUser}
                loading={saving}
            />
        </Layout>
    );
}
