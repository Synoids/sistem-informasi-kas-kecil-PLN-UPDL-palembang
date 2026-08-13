import { ImageResponse } from 'next/og'

export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '12px',
        }}
      >
        <svg viewBox="0 0 120 120" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 90 25 L 45 25 A 35 35 0 0 0 45 95 L 90 95" stroke="#0f172a" strokeWidth="16" strokeLinecap="round" />
          <circle cx="45" cy="60" r="14" fill="#FBBF24" />
          <path d="M 105 60 L 70 60" stroke="#0EA5E9" strokeWidth="16" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
