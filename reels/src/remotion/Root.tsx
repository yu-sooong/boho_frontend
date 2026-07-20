import React from 'react'
import { Composition } from 'remotion'
import { getVideoMetadata } from '@remotion/media-utils'
import { PhoneAd } from './PhoneAd'
import { COMP, COPY, type AdInputProps } from '../layout'

const defaultProps: AdInputProps = {
  videoSrc: '',
  title: COPY.title,
  subtitle: COPY.subtitle,
  brand: COPY.brand,
  cta: COPY.cta,
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PhoneAd"
      component={PhoneAd}
      durationInFrames={COMP.fps * 50}
      fps={COMP.fps}
      width={COMP.width}
      height={COMP.height}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => {
        if (!props.videoSrc) {
          return { durationInFrames: COMP.fps * 48 }
        }
        try {
          const meta = await getVideoMetadata(props.videoSrc)
          return {
            durationInFrames: Math.max(
              COMP.fps * 5,
              Math.ceil(meta.durationInSeconds * COMP.fps),
            ),
          }
        } catch {
          return { durationInFrames: COMP.fps * 48 }
        }
      }}
    />
  )
}
