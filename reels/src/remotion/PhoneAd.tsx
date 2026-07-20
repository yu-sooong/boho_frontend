import React from 'react'
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { AdInputProps } from '../layout'
import { COMP, FRAME } from '../layout'

export const PhoneAd: React.FC<AdInputProps> = ({
  videoSrc,
  title,
  subtitle,
  brand,
  cta,
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const phoneW = COMP.phoneWidth
  const phoneH = phoneW * (FRAME.height / FRAME.width)
  const phoneLeft = (COMP.width - phoneW) / 2
  const phoneTop = COMP.phoneTop

  const screen = {
    left: phoneW * FRAME.screen.left,
    top: phoneH * FRAME.screen.top,
    width: phoneW * FRAME.screen.width,
    height: phoneH * FRAME.screen.height,
    radius: FRAME.screen.radius * (phoneW / FRAME.width),
  }

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const titleOpacity = interpolate(frame, [0, 12, 55, 75], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 20], [24, 0], { extrapolateRight: 'clamp' })

  const endStart = Math.max(durationInFrames - 45, 0)
  const brandOpacity = interpolate(frame, [endStart, endStart + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const phoneScale = interpolate(enter, [0, 1], [0.92, 1])
  const phoneY = interpolate(enter, [0, 1], [36, 0])

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% 35%, rgba(15,118,110,0.28), transparent 60%), linear-gradient(165deg, #0f2f2a 0%, #071512 50%, #050a09 100%)',
        fontFamily:
          '"PingFang TC", "Noto Sans TC", "Helvetica Neue", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.28em',
            color: 'rgba(153,246,228,0.9)',
            marginBottom: 14,
            fontWeight: 500,
          }}
        >
          BUYU
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 14, fontSize: 28, color: 'rgba(226,232,240,0.78)' }}>
          {subtitle}
        </div>
      </div>

      {/* 手機（影片 + 外框同一個 transform，避免錯位） */}
      <div
        style={{
          position: 'absolute',
          left: phoneLeft,
          top: phoneTop,
          width: phoneW,
          height: phoneH,
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
          transformOrigin: 'center top',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: screen.left,
            top: screen.top,
            width: screen.width,
            height: screen.height,
            borderRadius: screen.radius,
            overflow: 'hidden',
            background: '#0a0a0a',
            zIndex: 1,
          }}
        >
          {videoSrc ? (
            <OffthreadVideo
              src={videoSrc}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>
        <img
          src={staticFile('iphone-frame.png')}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: 'center',
          opacity: brandOpacity,
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.2em',
            color: 'rgba(153,246,228,0.85)',
            marginBottom: 10,
          }}
        >
          台中補習班情報
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: '#fff' }}>{brand}</div>
        <div style={{ marginTop: 12, fontSize: 28, color: 'rgba(226,232,240,0.8)' }}>
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  )
}
