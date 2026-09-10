'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plane, AlertTriangle, Clock, Database, LogOut, Users, LayoutDashboard, Settings, X, LockKeyhole, Eye, EyeOff } from 'lucide-react'
import type { DashboardData } from '@/lib/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StateCard } from '@/components/StateCard'
import { useAuth } from '@/lib/auth-context'

import { COLORS, formatDate } from './dashboard/constants'
import StatusSection from './dashboard/components/StatusSection'
import SummaryCard from './dashboard/components/SummaryCard'
import RawmatSection from './dashboard/components/RawmatSection'
import PrematureSection from './dashboard/components/PrematureSection'
import { NEAR_DUE_DAYS } from '@/lib/constants'

/* ── Main page ── */
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/dashboard')
      .then(r => { if (!r.ok) throw new Error('Gagal mengambil data'); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <LoadingSpinner color={COLORS.blue} label="Memuat..." />
    </div>
  )

  if (!user) return null

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <LoadingSpinner color={COLORS.blue} label="Memuat data..." />
    </div>
  )

  if (error || !data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <StateCard
        icon="⚠️"
        title={error ?? 'Tidak ada data'}
        borderColor={COLORS.dangerBorder}
        background={COLORS.surface}
        titleColor={COLORS.danger}
      />
    </div>
  )

  const canManageData = true
  const isSuperAdmin = user.role === 'SUPERADMIN'

  return (
    <div className="dashboard-shell">
      {sidebarOpen && <button className="dashboard-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="dashboard-sidebar-brand">
          {/* <div>
            <strong>LDND</strong>
            <span>Carpet Monitor</span>
          </div> */}
          <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>

        <div className="dashboard-sidebar-label">Workspace</div>
        <nav className="dashboard-nav">
          <Link href="/" className="dashboard-nav-link active" onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>
          {canManageData && <Link href="/data" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><Database size={18} /> Kelola Data</Link>}
          {isSuperAdmin && <Link href="/admin" className="dashboard-nav-link" onClick={() => setSidebarOpen(false)}><Users size={18} /> Manajemen User</Link>}
        </nav>

        <div className="dashboard-sidebar-spacer" />
        <div className="dashboard-account-card">
          <div className="dashboard-account-copy"><strong>{user.username}</strong><span>{user.role}</span></div>
          <button onClick={() => setSettingsOpen(true)} aria-label="Buka pengaturan akun"><Settings size={16} /></button>
        </div>
        <button onClick={logout} className="dashboard-logout"><LogOut size={16} /> Keluar dari akun</button>
      </aside>

      <header className="management-header dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-header-identity">
            <button className="dashboard-mobile-trigger" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Buka atau tutup navigasi" aria-expanded={sidebarOpen}>
              <span /><span /><span />
            </button>
            <div className="dashboard-header-mark"><Plane size={20} strokeWidth={2.5} /></div>
            <div>
              <h1>LDND Carpet Monitor</h1>
              <p>Last Done / Next Due Tracking</p>
            </div>
          </div>
          <div className="dashboard-topbar-actions">
            <div className="dashboard-date"><span>{formatDate(currentTime)}</span><small>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB · Data real-time</small></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="fade-up">
          <SummaryCard label="Total Pesawat" value={data.totalAircraft} icon={<Plane size={24} strokeWidth={2.5} />} bg={COLORS.surface} numColor={COLORS.blue} />
          <SummaryCard label="Already Due" value={data.totalAlreadyDue} icon={<AlertTriangle size={24} strokeWidth={2.5} />} bg={COLORS.dangerLight} numColor={COLORS.danger} sub="melewati jadwal penggantian" />
          <SummaryCard label="Near Due" value={data.totalNearDue} icon={<Clock size={24} strokeWidth={2.5} />} bg={COLORS.warningLight} numColor={COLORS.warning} sub={`dalam ${NEAR_DUE_DAYS} hari ke depan`} />
        </div>

        {/* Near Due */}
        <div style={{ marginBottom: 24 }} className="fade-up delay-1">
          <StatusSection
            title="Near Due" subtitle={`Carpet yang mendekati jadwal penggantian (dalam ${NEAR_DUE_DAYS} hari)`}
            icon={<Clock size={24} strokeWidth={2.5} />} accentColor={COLORS.warning}
            data={data.nearDue} items={data.nearDueItems} isDanger={false}
          />
        </div>

        {/* Already Due */}
        <div className="fade-up delay-2">
          <StatusSection
            title="Already Due" subtitle="Carpet yang sudah melewati jadwal penggantian"
            icon={<AlertTriangle size={24} strokeWidth={2.5} />} accentColor={COLORS.danger}
            data={data.alreadyDue} items={data.alreadyDueItems} isDanger={true}
          />
        </div>

        {/* QTY Rawmat + Premature Replacement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }} className="fade-up delay-2">
          <RawmatSection rawmatQty={data.rawmatQty} />

          <PrematureSection prematureCounts={data.prematureCounts} prematureDetails={data.prematureDetails} />
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div>
          LDND Carpet Monitor — GMF AeroAsia © {new Date().getFullYear()}
        </div>
      </footer>
      {settingsOpen && <AccountSettingsModal user={user} onClose={() => setSettingsOpen(false)} onUpdated={() => setSettingsOpen(false)} />}
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
