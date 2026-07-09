import type { AnchorHTMLAttributes } from 'react'

type DonateDoodleButtonProps = AnchorHTMLAttributes<HTMLAnchorElement>

export function DonateDoodleButton({ className = '', children = 'Donar', ...props }: DonateDoodleButtonProps) {
  return (
    <a
      {...props}
      className={`group relative inline-flex min-h-10 items-center justify-center overflow-visible px-5 py-2.5 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] sm:px-6 ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 132 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          d="M10 22C8.5 12.5 16 5.5 28 4.5H98C112 4.5 120 11 121.5 21.5C123 32 114.5 39.5 100 40.5H30C16.5 41 9.5 33.5 10 22Z"
          fill="#0B3B8F"
        />
        <path
          d="M14 22.5C13 15 19 10 29 9.5H95C106 9.5 112.5 14.5 113.5 22C114.5 29.5 108 34.5 97 35H31C21 35.5 14.5 30.5 14 22.5Z"
          fill="#1E56B8"
          opacity="0.72"
        />
        <path
          d="M18 23C17.2 17.5 22.5 13.5 31 13H92C100.5 13 106 17 106.8 22.3C107.6 27.8 102.5 31.8 94 32.2H33C24.5 32.5 18.8 28.5 18 23Z"
          fill="#2B67C8"
          opacity="0.38"
        />
        <path
          d="M6 14C7.5 12 9.5 13 8.5 15.5C7.5 18 5 17.5 6 14Z"
          fill="#0B3B8F"
          opacity="0.55"
        />
        <path
          d="M124 30C125.5 28.5 127.5 29.5 126.5 32C125.5 34.5 123 34 124 30Z"
          fill="#0B3B8F"
          opacity="0.45"
        />
        <path
          d="M118 8C119.2 6.8 120.8 7.5 120 9.2C119.2 10.8 117.2 10.2 118 8Z"
          fill="#2563EB"
          opacity="0.35"
        />
        <path
          d="M22 8C23.5 6.5 25.5 7.8 24.2 10C23 12 20.5 11 22 8Z"
          stroke="#0B3B8F"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M108 36C109.8 34.5 111.8 36 110.2 38.2"
          stroke="#1D4ED8"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.32"
        />
      </svg>

      <svg
        className="pointer-events-none absolute -right-1 -top-2 h-5 w-5 rotate-12 opacity-70 transition group-hover:rotate-6 group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3L13.4 8.8L19 9.5L14.8 13.2L16 19L12 16.2L8 19L9.2 13.2L5 9.5L10.6 8.8L12 3Z"
          stroke="#0B3B8F"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="#BFDBFE"
          fillOpacity="0.55"
        />
      </svg>

      <svg
        className="pointer-events-none absolute -bottom-1.5 -left-1 h-4 w-6 -rotate-6 opacity-60"
        viewBox="0 0 28 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 8C6 4 10 10 14 6C18 2 22 8 26 5"
          stroke="#2563EB"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>

      <span className="relative z-10 text-sm font-semibold tracking-wide text-white">{children}</span>
    </a>
  )
}
