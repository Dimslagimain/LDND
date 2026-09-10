'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Plane, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, loading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(username, password)
    if (result.ok) {
      router.replace('/')
    } else {
      setError(result.error || 'Login gagal')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-loading">
          <div className="login-spinner" />
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="login-page">
      {/* Animated background elements */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-container fade-up">
        {/* Logo / branding */}
        <div className="login-brand">
          <div className="login-logo">
            <Plane size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">LDND Carpet Monitor</h1>
          <p className="login-subtitle">Aircraft Carpet Replacement Tracking System</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error fade-up">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label className="login-label" htmlFor="username">
              <User size={14} />
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="login-input"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              <Lock size={14} />
              Password
            </label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="login-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting || !username || !password}
          >
            {submitting ? (
              <div className="login-btn-spinner" />
            ) : (
              <>
                <Lock size={16} />
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>GMF AeroAsia © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
