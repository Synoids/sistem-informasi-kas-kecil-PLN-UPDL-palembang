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
          background: 'linear-gradient(to bottom right, #0EA5E9, #0284C7)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '60%',
            height: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            top: '25%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '42%',
            height: '34%',
            backgroundColor: 'white',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              backgroundColor: '#FBBF24',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
