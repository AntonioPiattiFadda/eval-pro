import { Outlet } from 'react-router-dom'
import loginHero from '../assets/images/login/login-hero-1.png'

export function AuthLayout() {
  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center relative px-4">
      {/* Background image */}
      <img
        src={loginHero}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: 'cover', objectPosition: 'center', scale: '1' }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.80) 100%)' }}
      />

      {/* Logo */}
      <span className="relative z-10 font-display font-bold tracking-[0.3em] uppercase mb-5 text-sm shrink-0" style={{ color: 'var(--color-primary)' }}>
        EvalPro
      </span>

      {/* Card — scrollable internally if content overflows */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-7 overflow-y-auto"
        style={{
          maxHeight: 'calc(100vh - 8rem)',
          background: 'rgba(14,14,14,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        <Outlet />
      </div>

      {/* Footer */}
      <div className="relative z-10 flex gap-8 mt-5 shrink-0">
        {['Privacidad', 'Términos', 'Soporte'].map((label) => (
          <a
            key={label}
            href="#"
            className="text-xs uppercase tracking-widest transition-colors"
            style={{ color: 'var(--color-outline-variant)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-outline-variant)')}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
