'use client'

function WheatLeafIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2c-2 4-4 8-4 14 0 4 2 8 6 8s6-4 6-8c0-6-2-10-4-14" />
      <path d="M12 2c2 4 4 8 4 14 0 4-2 8-6 8s-6-4-6-8c0-6 2-10 4-14" />
      <ellipse cx="12" cy="8" rx="4" ry="3" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function SparkleIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </svg>
  )
}

const NAV_PILLS = [
  { label: 'Yield Forecast' },
  { label: 'Climate Risk' },
  { label: 'Fair Subsidies' },
]

export default function Header() {
  return (
    <>
      {/* Premium sticky header */}
      <header className="premium-header">
        <div className="premium-header-scanline" aria-hidden />
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          {/* Left: logo */}
          <a
            href="/"
            className="premium-logo group flex items-center gap-2"
            aria-label="AgriEquity AI home"
          >
            <WheatLeafIcon className="h-5 w-5 flex-shrink-0 text-[#00ff87]" />
            <span className="text-[20px] font-bold leading-none text-white">
              AgriEquity
            </span>
            <span className="text-[20px] font-bold leading-none text-[#00ff87] transition-[filter] duration-200 group-hover:drop-shadow-[0_0_8px_rgba(0,255,135,0.6)]">
              AI
            </span>
            <span className="premium-pulse-dot" aria-hidden title="Live" />
          </a>

          {/* Center: nav pills */}
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary">
            {NAV_PILLS.map(({ label }) => (
              <span
                key={label}
                className="rounded-full border border-[rgba(0,255,135,0.2)] px-3 py-1 text-[12px] text-[#00ff87]"
              >
                {label}
              </span>
            ))}
          </nav>

          {/* Right: badges */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] text-[#f0c060]">
              <SparkleIcon className="h-3.5 w-3.5" />
              Powered by Claude AI
            </span>
            <span className="rounded-full bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] text-[#a0adb0]">
              AMD ROCm
            </span>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <section className="premium-hero" aria-label="Introduction">
        <div className="premium-hero-particles" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="hero-particle"
              style={{
                left: `${12 + i * 15}%`,
                animationDelay: `${i * 1.2}s`,
                animationDuration: `${7 + (i % 3)}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 text-center">
          <h2 className="text-[28px] font-bold leading-tight text-white">
            AI-Powered Farm Intelligence
          </h2>
          <p className="mt-2 text-[14px] text-[#a0adb0]">
            Yield prediction · Climate risk analysis · Fair subsidy allocation
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-10">
            <div>
              <p className="text-lg font-bold text-[#00ff87]">8</p>
              <p className="mt-0.5 text-[11px] text-[#a0adb0]">Farms Analyzed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#00ff87]">$1,000,000</p>
              <p className="mt-0.5 text-[11px] text-[#a0adb0]">Allocated</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#00ff87]">48.2%</p>
              <p className="mt-0.5 text-[11px] text-[#a0adb0]">Small Farm Share</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
