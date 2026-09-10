'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plane, Users, Trash2, Plus, Shield, LogOut, LayoutDashboard, Database, X, AlertCircle } from 'lucide-react'
import { useAuth, type UserRole } from '@/lib/auth-context'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { COLORS } from '@/lib/theme'

interface UserItem {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  // Auth guard: superadmin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role !== 'SUPERADMIN') {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') fetchUsers()
  }, [fetchUsers, user])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Yakin ingin menghapus user "${username}"?`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus user')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading || !user || user.role !== 'SUPERADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
        <LoadingSpinner color={COLORS.blue} label="Memuat..." />
      </div>
    )
  }

  const roleColors: Record<UserRole, { bg: string; border: string; text: string }> = {
    SUPERADMIN: { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'transparent', text: '#fff' },
    ADMIN: { bg: 'linear-gradient(135deg, #059669, #10b981)', border: 'transparent', text: '#fff' },
    USER: { bg: COLORS.border, border: 'transparent', text: COLORS.muted },
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {sidebarOpen && <button className="dashboard-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="dashboard-sidebar-brand">
          <div><strong>LDND</strong><span>Carpet Monitor</span></div>
          <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="dashboard-sidebar-label">Workspace</div>
        <nav className="dashboard-nav">
          <Link href="/" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>
          <Link href="/data" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><Database size={18} /> Kelola Data</Link>
          <Link href="/admin" className="dashboard-nav-link active" onClick={() => setSidebarOpen(false)}><Users size={18} /> Manajemen User</Link>
        </nav>
        <div className="dashboard-sidebar-spacer" />
        <div className="dashboard-account-card">
          <div className="dashboard-account-avatar"><Shield size={18} /></div>
          <div className="dashboard-account-copy"><strong>{user.username}</strong><span>{user.role}</span></div>
        </div>
        <button onClick={logout} className="dashboard-logout"><LogOut size={16} /> Keluar dari akun</button>
      </aside>
      {/* Header */}
      <header className="management-header" style={{
        background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', padding: '14px 42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="dashboard-mobile-trigger" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Buka atau tutup navigasi" aria-expanded={sidebarOpen}>
              <span /><span /><span />
            </button>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: COLORS.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}>
              <Plane size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>User Management</h1>
              <p style={{ fontSize: 12, color: COLORS.muted }}>Kelola akun pengguna</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="dashboard-date"><span>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><small>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB · Data real-time</small></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 32px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: COLORS.blue }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Daftar User</h2>
            <span style={{
              background: COLORS.blueLight, color: COLORS.blue,
              fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
              border: `1px solid ${COLORS.blueBorder}`,
            }}>{users.length}</span>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: COLORS.blue, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={16} />
            Tambah User
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <LoadingSpinner color={COLORS.blue} label="Memuat data user..." />
          </div>
        ) : (
          <div style={{
            background: COLORS.surface, borderRadius: 16,
            border: `1px solid ${COLORS.border}`, overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Username', 'Role', 'Dibuat', 'Aksi'].map(h => (
                    <th key={h} style={{
                      background: COLORS.borderLight, padding: '14px 20px',
                      fontSize: 11, fontWeight: 700, color: COLORS.muted,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: `1px solid ${COLORS.border}`,
                      ...(h === 'Aksi' ? { textAlign: 'right' as const, width: 100 } : {}),
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: COLORS.blueLight, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: COLORS.blue, fontWeight: 700, fontSize: 13,
                        }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: COLORS.text, fontSize: 14 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: roleColors[u.role].bg,
                        color: roleColors[u.role].text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: COLORS.muted }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {u.id === user.id ? (
                        <span style={{ fontSize: 12, color: COLORS.muted, fontStyle: 'italic' }}>Akun Anda</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={deleting === u.id}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: `1px solid ${COLORS.dangerBorder}`,
                            background: COLORS.dangerLight,
                            color: COLORS.danger,
                            fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: 4,
                            opacity: deleting === u.id ? 0.5 : 1,
                            marginLeft: 'auto',
                          }}
                        >
                          <Trash2 size={12} />
                          {deleting === u.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSaved={fetchUsers} />}
    </div>
  )
}

/* ── Add User Modal ── */
function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('USER')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      })
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menambahkan user')
      }
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: COLORS.surface, borderRadius: 20,
        border: `1px solid ${COLORS.border}`, padding: 32,
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Tambah User Baru</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.muted, padding: 4,
          }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10,
            background: COLORS.dangerLight, border: `1px solid ${COLORS.dangerBorder}`,
            color: COLORS.danger, fontSize: 13, fontWeight: 500, marginBottom: 16,
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${COLORS.border}`, fontSize: 14,
                color: COLORS.text, outline: 'none', background: COLORS.bg,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${COLORS.border}`, fontSize: 14,
                color: COLORS.text, outline: 'none', background: COLORS.bg,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Role</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['USER', 'ADMIN', 'SUPERADMIN'] as UserRole[]).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  border: role === r ? `2px solid ${COLORS.blue}` : `1px solid ${COLORS.border}`,
                  background: role === r ? COLORS.blueLight : COLORS.surface,
                  color: role === r ? COLORS.blue : COLORS.muted,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  textTransform: 'uppercase',
                }}>{r}</button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={submitting || !username || !password} style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: COLORS.blue, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            opacity: submitting || !username || !password ? 0.5 : 1,
            marginTop: 4,
          }}>
            {submitting ? 'Menyimpan...' : 'Simpan User'}
          </button>
        </form>
      </div>
    </div>
  )
}
