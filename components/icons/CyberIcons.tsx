import React from 'react'

export interface CyberIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
  glow?: boolean
}

/**
 * 1. CyberShieldIcon - High-security defense shield with glowing inner core
 */
export function CyberShieldIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 transition-transform ${glow ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="cyberShieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L4 5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5L12 2Z"
        fill="url(#cyberShieldFill)"
        stroke="url(#cyberShieldGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.5L11 14L15.5 9.5"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.5" r="7" stroke="#06B6D4" strokeOpacity="0.3" strokeDasharray="2 2" />
    </svg>
  )
}

/**
 * 2. CyberRadarIcon - Concentric radar scope with rotating sweep and threat blips
 */
export function CyberRadarIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" stroke="url(#cyberRadarGrad)" strokeWidth="1.5" strokeOpacity="0.9" />
      <circle cx="12" cy="12" r="6" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.45" />
      <circle cx="12" cy="12" r="2.5" fill="#06B6D4" fillOpacity="0.3" stroke="#22D3EE" strokeWidth="1.25" />
      <path d="M12 2.5V21.5M2.5 12H21.5" stroke="#06B6D4" strokeWidth="0.75" strokeOpacity="0.3" />
      <path d="M12 12L18.5 5.5" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="16" cy="8" r="1.25" fill="#F43F5E" className="animate-ping" />
      <circle cx="16" cy="8" r="1.25" fill="#F43F5E" />
      <circle cx="7.5" cy="15.5" r="1" fill="#38BDF8" />
    </svg>
  )
}

/**
 * 3. CyberLinkIcon - URL chain link with glowing quantum nodes
 */
export function CyberLinkIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberLinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path
        d="M10 13C10.4565 13.5746 11.0374 14.0371 11.7018 14.3547C12.3662 14.6723 13.0972 14.8368 13.8431 14.8363C14.589 14.8358 15.3197 14.6702 15.9835 14.3516C16.6472 14.033 17.2273 13.5695 17.6826 12.9942L20.25 9.75418C21.1738 8.58784 21.6433 7.10688 21.5645 5.6083C21.4857 4.10972 20.8643 2.70014 19.8249 1.66072C18.7855 0.621303 17.3759 -0.000109968 15.8773 8.3582e-08C14.3788 0.000110135 12.8978 0.621742 11.7315 1.66072L10.25 3.1422"
        stroke="url(#cyberLinkGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14 11C13.5435 10.4254 12.9626 9.96292 12.2982 9.64532C11.6338 9.32773 10.9028 9.16317 10.1569 9.16369C9.41099 9.16422 8.68028 9.32982 8.01654 9.64843C7.35279 9.96704 6.77266 10.4305 6.31737 11.0058L3.75 14.2458C2.82622 15.4122 2.3567 16.8931 2.43549 18.3917C2.51427 19.8903 3.13572 21.2999 4.17514 22.3393C5.21456 23.3787 6.62414 24.0001 8.12272 24C9.62129 23.9999 11.1022 23.3783 12.2685 22.3393L13.75 20.8578"
        stroke="url(#cyberLinkGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="8" cy="16" r="1.5" fill="#38BDF8" />
      <circle cx="16" cy="8" r="1.5" fill="#818CF8" />
    </svg>
  )
}

/**
 * 4. CyberFileIcon - EML / Threat document with holographic circuitry
 */
export function CyberFileIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberFileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="cyberFileFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="url(#cyberFileFill)"
        stroke="url(#cyberFileGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke="url(#cyberFileGrad)" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 13H16M8 17H13" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="17" r="1" fill="#818CF8" />
    </svg>
  )
}

/**
 * 5. CyberLockIcon - Biometric cyber padlock for credential theft / auth
 */
export function CyberLockIcon({ size = 20, className = '', variant = 'rose', glow = false, ...props }: CyberIconProps & { variant?: 'rose' | 'cyan' }) {
  const isRose = variant === 'rose'
  const strokeGrad = isRose ? 'url(#cyberLockRose)' : 'url(#cyberLockCyan)'
  const fillGrad = isRose ? 'url(#cyberLockRoseFill)' : 'url(#cyberLockCyanFill)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? (isRose ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]') : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberLockRose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="cyberLockRoseFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="cyberLockCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="cyberLockCyanFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="10"
        width="16"
        height="12"
        rx="3"
        fill={fillGrad}
        stroke={strokeGrad}
        strokeWidth="1.75"
      />
      <path
        d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
        stroke={strokeGrad}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.5" fill={isRose ? '#FDA4AF' : '#67E8F9'} />
      <path d="M12 16.5V18.5" stroke={isRose ? '#FDA4AF' : '#67E8F9'} strokeWidth="1.5" strokeLinecap="round" />
      {/* Encrypted data bits floating */}
      <rect x="18" y="12" width="1.5" height="1.5" fill={isRose ? '#F43F5E' : '#22D3EE'} rx="0.5" />
      <rect x="19.5" y="14.5" width="1.5" height="1.5" fill={isRose ? '#FB7185' : '#38BDF8'} rx="0.5" />
    </svg>
  )
}

/**
 * 6. CyberWarningIcon - Hazard warning hexagon for typosquatting / suspicious threats
 */
export function CyberWarningIcon({ size = 20, className = '', variant = 'amber', glow = false, ...props }: CyberIconProps & { variant?: 'amber' | 'rose' }) {
  const isAmber = variant === 'amber'
  const strokeColor = isAmber ? '#F59E0B' : '#F43F5E'
  const fillColor = isAmber ? 'rgba(245, 158, 11, 0.18)' : 'rgba(244, 63, 94, 0.18)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberWarnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
        fill={fillColor}
        stroke="url(#cyberWarnGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 8V13" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.25" fill={strokeColor} />
    </svg>
  )
}

/**
 * 7. CyberTrashIcon - Purge / Delete canister with neon disintegration arrows
 */
export function CyberTrashIcon({ size = 18, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberTrashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      <path d="M4 7H20" stroke="url(#cyberTrashGrad)" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M6 7L7 20C7.08 20.8 7.8 21.5 8.6 21.5H15.4C16.2 21.5 16.92 20.8 17 20L18 7"
        fill="rgba(244, 63, 94, 0.12)"
        stroke="url(#cyberTrashGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V4C9 3.45 9.45 3 10 3H14C14.55 3 15 3.45 15 4V7"
        stroke="url(#cyberTrashGrad)"
        strokeWidth="1.75"
      />
      <path d="M10 11V17M14 11V17" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 8. CyberCpuIcon - Machine learning neural processor chip
 */
export function CyberCpuIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="cyberCpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="3"
        fill="rgba(192, 132, 252, 0.15)"
        stroke="url(#cyberCpuGrad)"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="#E9D5FF" strokeWidth="1.5" />
      <path d="M12 9V12L14 14" stroke="#C084FC" strokeWidth="1.25" strokeLinecap="round" />
      {/* Pins */}
      <path d="M9 2V5M15 2V5M9 19V22M15 19V22M2 9H5M2 15H5M19 9H22M19 15H22" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 9. CyberUserIcon - Biometric identity / security analyst profile
 */
export function CyberUserIcon({ size = 18, className = '', ...props }: CyberIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} {...props}>
      <circle cx="12" cy="8" r="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" strokeWidth="1.75" />
      <path
        d="M4 20C4 16.5 7.5 14.5 12 14.5C16.5 14.5 20 16.5 20 20"
        stroke="#38BDF8"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="1.5" fill="#38BDF8" />
    </svg>
  )
}

/**
 * 10. CyberSettingsIcon - SOC system config & engine control
 */
export function CyberSettingsIcon({ size = 18, className = '', ...props }: CyberIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} {...props}>
      <defs>
        <linearGradient id="cyberGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="3" fill="rgba(192, 132, 252, 0.2)" stroke="url(#cyberGearGrad)" strokeWidth="1.75" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="url(#cyberGearGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * 11. CyberLogoutIcon - Secure portal exit
 */
export function CyberLogoutIcon({ size = 18, className = '', ...props }: CyberIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke="#FB7185"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M16 17L21 12L16 7M21 12H9" stroke="#FB7185" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * 12. CyberZapIcon - Ultra-fast latency / instant response lightning
 */
export function CyberZapIcon({ size = 20, className = '', glow = false, ...props }: CyberIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''} ${className}`}
      {...props}
    >
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="rgba(6, 182, 212, 0.2)"
        stroke="#22D3EE"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * 13. CyberTerminalIcon - Forensic SOC prompt
 */
export function CyberTerminalIcon({ size = 18, className = '', ...props }: CyberIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(6, 182, 212, 0.1)" stroke="#06B6D4" strokeWidth="1.75" />
      <path d="M6 9L9.5 12L6 15" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15H17" stroke="#22D3EE" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
