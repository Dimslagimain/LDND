'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plane, LayoutDashboard, Settings, Package, LogOut, Users, X, LockKeyhole, Eye, EyeOff } from 'lucide-react'

import { C } from './constants'
import { AircraftData } from './types'
import { AircraftCarpetRows } from './components/AircraftCarpetRows'
import { AddAircraftModal } from './components/Modals'
import { IntervalSettingsModal } from './components/IntervalSettingsModal'
import { RawmatModal } from './components/RawmatModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StateCard } from '@/components/StateCard'
import { AIRLINES } from '@/lib/constants'
import { useAuth } from '@/lib/auth-context'

/* ───────────── Main Data Page ───────────── */
export default function DataPage() {
    const [aircraft, setAircraft] = useState<AircraftData[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'GA' | 'QG'>('GA')
    const [showAdd, setShowAdd] = useState(false)
    const [showIntervalSettings, setShowIntervalSettings] = useState(false)
    const [showRawmat, setShowRawmat] = useState(false)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('Semua')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const { user, loading: authLoading, logout } = useAuth()
    const router = useRouter()

    // Auth guard: every authenticated role can view aircraft data
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace('/login')
            }
        }
    }, [user, authLoading, router])

    const fetchData = useCallback(() => {
        setLoading(true)
        fetch('/api/aircraft').then(r => r.json()).then(setAircraft).catch(console.error).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (user) fetchData()
    }, [fetchData, user])

    const filtered = aircraft
        .filter(ac => ac.airline === tab)
        .filter(ac => typeFilter === 'Semua' || ac.acTypeGroup.includes(typeFilter))
        .filter(ac => !search || ac.registration.toLowerCase().includes(search.toLowerCase()) || ac.acType.toLowerCase().includes(search.toLowerCase()))

    const gaCount = aircraft.filter(a => a.airline === 'GA').length
    const qgCount = aircraft.filter(a => a.airline === 'QG').length

    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        setNow(new Date())
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    if (authLoading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
                <LoadingSpinner color={C.blue} label="Memuat..." />
            </div>
        )
    }

    const isSuperAdmin = user.role === 'SUPERADMIN'
    const canEdit = user.role !== 'USER'

    return (
        <div style={{ minHeight: '100vh', background: C.bg }}>
            {sidebarOpen && <button className="dashboard-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
            <aside className={`dashboard-sidebar${sidebarOpen ? ' is-open' : ''}`}>
                <div className="dashboard-sidebar-brand">
                    <div><strong>LDND</strong><span>Carpet Monitor</span></div>
                    <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
                </div>
                <div className="dashboard-sidebar-label">Workspace</div>
                <nav className="dashboard-nav">
                    <Link href="/" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>
                    <Link href="/data" className="dashboard-nav-link active" onClick={() => setSidebarOpen(false)}><Package size={18} /> Kelola Data</Link>
                    {isSuperAdmin && <Link href="/admin" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><Users size={18} /> Manajemen User</Link>}
                </nav>
                <div className="dashboard-sidebar-spacer" />
                <div className="dashboard-account-card">
                    <div className="dashboard-account-copy"><strong>{user.username}</strong><span>{user.role}</span></div>
                    <button onClick={() => setSettingsOpen(true)} aria-label="Buka pengaturan akun"><Settings size={16} /></button>
                </div>
                <button onClick={logout} className="dashboard-logout"><LogOut size={16} /> Keluar dari akun</button>
            </aside>
            {/* Header */}
            <header className="management-header" style={{
                background: C.surface, borderBottom: `1px solid ${C.border}`,
                position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
                <div style={{ maxWidth: 1340, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="dashboard-mobile-trigger" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Buka atau tutup navigasi" aria-expanded={sidebarOpen}>
                            <span /><span /><span />
                        </button>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10, background: C.blue,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                        }}>
                            <Plane size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>LDND Carpet Monitor</h1>
                            <p style={{ fontSize: 12, color: C.muted }}>Data Management</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {now && (
                            <div style={{ textAlign: 'right', marginRight: 4 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>
                                    {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', lineHeight: 1.2 }}>
                                    {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                                </p>
                            </div>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1340, margin: '0 auto', padding: '110px 24px 28px' }}>
                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {([
                            { key: 'GA' as const, label: AIRLINES.GA.name, count: gaCount, color: C.gaColor, light: C.gaLight },
                            { key: 'QG' as const, label: AIRLINES.QG.name, count: qgCount, color: C.qgColor, light: C.qgLight },
                        ]).map(a => (
                            <button key={a.key} onClick={() => setTab(a.key)} style={{
                                padding: '10px 20px', borderRadius: 12,
                                border: tab === a.key ? `2px solid ${a.color}` : `1px solid ${C.border}`,
                                background: tab === a.key ? a.light : C.surface,
                                fontSize: 14, fontWeight: 700, cursor: 'pointer', color: tab === a.key ? a.color : C.muted,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                {a.label}
                                <span style={{
                                    background: tab === a.key ? a.color : C.border, color: tab === a.key ? '#fff' : C.muted,
                                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                }}>{a.count}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Type filter chips */}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['Semua', ...Array.from(new Set(aircraft.filter(a => a.airline === tab).map(a => a.acTypeGroup)))].map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)} style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    border: typeFilter === t ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
                                    background: typeFilter === t ? C.blueLight : C.surface,
                                    color: typeFilter === t ? C.blue : C.muted,
                                }}>{t === 'Semua' ? 'Semua' : t}</button>
                            ))}
                        </div>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari registrasi..."
                            style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, width: 200, outline: 'none' }} />
                        {canEdit && <button onClick={() => setShowRawmat(true)} style={{
                            padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                            background: C.surface, color: C.text, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <Package size={16} /> Rawmat
                        </button>}
                        {canEdit && <button onClick={() => setShowIntervalSettings(true)} style={{
                            padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                            background: C.surface, color: C.text, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <Settings size={16} /> Interval
                        </button>}
                        {canEdit && <button onClick={() => setShowAdd(true)} style={{
                            padding: '10px 20px', borderRadius: 10, border: 'none',
                            background: C.blue, color: '#fff', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                        }}>+ Tambah Pesawat</button>}
                    </div>
                </div>

                {/* Aircraft Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <LoadingSpinner color={C.blue} label="Memuat data..." />
                    </div>
                ) : filtered.length === 0 ? (
                    <StateCard
                        icon={<Plane size={48} strokeWidth={1} />}
                        title={search ? 'Tidak ditemukan' : `Belum ada pesawat ${tab === 'GA' ? AIRLINES.GA.name : AIRLINES.QG.name}`}
                        subtitle={canEdit ? 'Klik &quot;Tambah Pesawat&quot; untuk menambahkan' : undefined}
                        borderColor={C.border}
                        background={C.surface}
                        titleColor={C.text}
                        subtitleColor={C.muted}
                        padding={60}
                    />
                ) : (
                    <div className="data-aircraft-table-wrap" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <table className="data-aircraft-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', textAlign: 'center' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '13%' }}>Pesawat</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '7%' }}>Tipe Carpet</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '7%' }}>Status</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '8%' }}>Last Done</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '8%' }}>Next Due</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '7%' }}>Vendor</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '7%' }}>Coatroom</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '8%' }}>Remark</th>
                                    <th className="data-status-header" style={{ background: C.borderLight, padding: '12px 8px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '11%' }}>Status Pesawat</th>
                                    <th style={{ background: C.borderLight, padding: '12px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '12%' }}>Riwayat</th>
                                    {canEdit && <th style={{ background: C.borderLight, padding: '12px 6px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}`, width: '11%', textAlign: 'center' }}>Aksi</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(ac => <AircraftCarpetRows key={ac.id} ac={ac} onRefresh={fetchData} canEdit={canEdit} />)}
                            </tbody>
                        </table>
                    </div>
                )}
                {showAdd && <AddAircraftModal airline={tab} onClose={() => setShowAdd(false)} onSaved={fetchData} />}
                {showIntervalSettings && <IntervalSettingsModal onClose={() => setShowIntervalSettings(false)} onRefresh={fetchData} />}
                {showRawmat && <RawmatModal onClose={() => setShowRawmat(false)} onSaved={() => {/* Add subtle notification logic if needed */ }} />}
                {settingsOpen && <AccountSettingsModal user={user} onClose={() => setSettingsOpen(false)} onUpdated={() => setSettingsOpen(false)} />}
            </main>
            <footer className="dashboard-footer data-footer">
                LDND Carpet Monitor — GMF AeroAsia © {new Date().getFullYear()}
            </footer>
        </div>
    )
}

function AccountSettingsModal({ user, onClose, onUpdated }: { user: { id: string; username: string; role: string }; onClose: () => void; onUpdated: () => void }) {
    const { refreshUser } = useAuth()
    const [username, setUsername] = useState(user.username)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setSaving(true); setError(''); setMessage('')
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, currentPassword, newPassword }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Gagal menyimpan pengaturan')
            await refreshUser()
            setMessage('Pengaturan akun berhasil diperbarui.')
            setCurrentPassword(''); setNewPassword('')
            setTimeout(onUpdated, 700)
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan') }
        finally { setSaving(false) }
    }

    return (
        <div className="account-modal-backdrop" onClick={onClose}>
            <section className="account-modal" onClick={event => event.stopPropagation()}>
                <div className="account-modal-heading"><div><p className="dashboard-eyebrow">Account center</p><h2>Pengaturan akun</h2></div><button onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>
                <p className="account-modal-intro">Perbarui identitas login Anda. Password saat ini diperlukan untuk menyimpan perubahan.</p>
                <form onSubmit={handleSubmit}>
                    <label>Username<input value={username} onChange={event => setUsername(event.target.value)} minLength={3} required /></label>
                   <label><span>Password saat ini</span><div className="password-input-wrap"><input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required minLength={6} placeholder="***********"/><button type="button" onClick={() => setShowCurrentPassword(prev => !prev)} aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          <label><span>Password baru <small>(opsional)</small></span><div className="password-input-wrap"><input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={6} placeholder="***********" /><button type="button" onClick={() => setShowNewPassword(prev => !prev)} aria-label={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                    <div className="account-security-note"><LockKeyhole size={16} /> Password baru minimal 6 karakter.</div>
                    {error && <p className="account-form-error">{error}</p>}
                    {message && <p className="account-form-success">{message}</p>}
                    <div className="account-modal-actions"><button type="button" onClick={onClose} className="account-cancel">Batal</button><button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button></div>
                </form>
            </section>
        </div>
    )
}
