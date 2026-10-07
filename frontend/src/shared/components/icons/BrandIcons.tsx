import { useId, type ReactNode, type SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function Base({
  title,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function GoogleIcon(props: IconProps) {
  return (
    <Base title="Google" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Base>
  )
}

export function GmailIcon(props: IconProps) {
  return (
    <Base title="Gmail" {...props}>
      <path
        fill="#EA4335"
        d="M3 6.2v11.1c0 .94.76 1.7 1.7 1.7h1.55V9.35L3 6.2z"
      />
      <path
        fill="#34A853"
        d="M17.75 18.999h1.55c.94 0 1.7-.76 1.7-1.7V6.2l-3.25 3.15v9.65z"
      />
      <path fill="#FBBC04" d="M17.75 9.35 21 6.2V5H17.75v4.35z" />
      <path fill="#C5221F" d="M6.25 9.35 3 6.2V5h3.25v4.35z" />
      <path fill="#4285F4" d="M6.25 19h11.5V9.35L12 13.7 6.25 9.35V19z" />
      <path fill="#EA4335" d="M3 5h18l-9 6.75L3 5z" />
    </Base>
  )
}

export function GoogleDocsIcon(props: IconProps) {
  return (
    <Base title="Google Docs" {...props}>
      <path
        fill="#4285F4"
        d="M6.5 2.5h7.1L19 7.9v12.6c0 .55-.45 1-1 1H6.5c-.55 0-1-.45-1-1v-17c0-.55.45-1 1-1z"
      />
      <path fill="#A1C2FA" d="M13.6 2.5v4.4c0 .55.45 1 1 1H19l-5.4-5.4z" />
      <path fill="#fff" d="M8 11h8v1.35H8zm0 2.7h8V15H8zm0 2.7h5.5v1.35H8z" />
    </Base>
  )
}

export function GoogleCalendarIcon(props: IconProps) {
  return (
    <Base title="Google Calendar" {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2.5" fill="#fff" />
      <path
        fill="#1A73E8"
        d="M3 8.5h18V19a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19V8.5z"
      />
      <path fill="#EA4335" d="M3 4.5A1.5 1.5 0 0 1 4.5 3H8v5.5H3V4.5z" />
      <path fill="#188038" d="M16 3h3.5A1.5 1.5 0 0 1 21 4.5V8.5h-5V3z" />
      <path fill="#FBBC04" d="M8 3h8v5.5H8z" />
      <path
        fill="#fff"
        d="M10.15 17.6v-5.05h1.45l1.55 2.55 1.55-2.55h1.4V17.6h-1.2v-3.2l-1.45 2.35h-.45l-1.45-2.35v3.2h-1.4z"
      />
    </Base>
  )
}

export function GoogleMeetIcon(props: IconProps) {
  return (
    <Base title="Google Meet" {...props}>
      <path
        fill="#00832D"
        d="M12 5.5H5.8A2.3 2.3 0 0 0 3.5 7.8v8.4A2.3 2.3 0 0 0 5.8 18.5H12V5.5z"
      />
      <path fill="#0066DA" d="M12 5.5h4.2A2.3 2.3 0 0 1 18.5 7.8v.9L12 12V5.5z" />
      <path fill="#E37400" d="M18.5 8.7v6.6L12 12l6.5-3.3z" />
      <path
        fill="#2684FC"
        d="M12 12v6.5h4.2a2.3 2.3 0 0 0 2.3-2.3v-.9L12 12z"
      />
      <path
        fill="#00AC47"
        d="m18.5 15.3 2.2 1.6c.5.35.8.1.8-.45V7.55c0-.55-.3-.8-.8-.45l-2.2 1.6v6.6z"
      />
    </Base>
  )
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Base title="WhatsApp" {...props}>
      <circle cx="12" cy="12" r="10" fill="#25D366" />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 5.2a6.8 6.8 0 0 0-5.85 10.2l-.45 2.45 2.5-.45A6.8 6.8 0 1 0 12 5.2zm0 12.35c-1.1 0-2.15-.3-3.05-.85l-.25-.15-1.85.35.35-1.8-.15-.25a5.35 5.35 0 1 1 4.95 2.7z"
      />
      <path
        fill="#fff"
        d="M15.55 13.85c-.2-.1-1.15-.55-1.3-.65-.2-.1-.35-.12-.5.12-.14.22-.55.65-.67.78-.12.14-.25.15-.45.05-.2-.1-.85-.3-1.6-1a5.3 5.3 0 0 1-1-1.25c-.1-.18 0-.28.08-.4l.3-.35c.08-.1.12-.2.18-.35.05-.12.02-.25 0-.35-.05-.1-.5-1.15-.68-1.55-.18-.4-.35-.35-.5-.35h-.4c-.14 0-.38.05-.58.28-.2.22-.75.75-.75 1.8s.78 2.08.9 2.22c.1.15 1.5 2.35 3.7 3.2 1.35.55 1.85.48 2.2.45.35-.04 1.1-.45 1.25-.9.15-.45.15-.82.1-.9-.04-.08-.18-.14-.38-.24z"
      />
    </Base>
  )
}

export function InstagramIcon(props: IconProps) {
  const gradId = useId().replace(/:/g, "")
  return (
    <Base title="Instagram" {...props}>
      <defs>
        <radialGradient id={gradId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${gradId})`} />
      <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </Base>
  )
}

export function YouTubeIcon(props: IconProps) {
  return (
    <Base title="YouTube" {...props}>
      <path
        fill="#FF0000"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8z"
      />
      <path fill="#fff" d="M10 15.2V8.8L15.5 12 10 15.2z" />
    </Base>
  )
}

export function TeamsIcon(props: IconProps) {
  return (
    <Base title="Microsoft Teams" {...props}>
      <rect x="9.2" y="6.2" width="11.3" height="10.2" rx="2.1" fill="#5059C9" />
      <circle cx="16.4" cy="5" r="2.1" fill="#7B83EB" />
      <circle cx="11.5" cy="5.7" r="1.6" fill="#7B83EB" opacity="0.95" />
      <rect x="3" y="8.2" width="10" height="10" rx="1.4" fill="#4B53BC" />
      <path
        fill="#fff"
        d="M6.2 15.7v-4.8h1.75c1.15 0 1.85.6 1.85 1.55 0 .7-.4 1.25-1.05 1.45l1.2 1.8H8.65l-1.05-1.65H7.35v1.65H6.2zm1.15-2.7h.5c.5 0 .8-.28.8-.65s-.3-.65-.8-.65h-.5v1.3z"
      />
    </Base>
  )
}
