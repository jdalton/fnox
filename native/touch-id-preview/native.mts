import {
  FINGERPRINT_GEOMETRY,
  FINGERPRINT_PALETTES,
  FINGERPRINT_TIMING,
  fingerprintApprovalDurationMs,
  fingerprintFrame,
  fingerprintVisitedFrames,
} from './animation.mts'
import type { FingerprintFlow } from './animation.mts'

export const FINGERPRINT_NATIVE_FPS = 120

export function fingerprintNativePaths(svg: string): string[] {
  const paths = Array.from(
    svg.matchAll(/<path[^>]*\bd="([^"]+)"/g),
    (match) => match[1]!,
  )
  if (paths.length !== FINGERPRINT_GEOMETRY.ridgeCount) {
    throw new Error('Fingerprint requires 22 ridge paths')
  }
  return paths.map((ridge, index) => {
    if (index < 2) {
      const values = ridge.match(/-?[0-9]*\.?[0-9]+/g)!.map(Number)
      const angle = (x: number, y: number) =>
        Math.atan2(
          y - FINGERPRINT_GEOMETRY.centerY,
          x - FINGERPRINT_GEOMETRY.centerX,
        )
      const start = angle(values[0]!, values[1]!)
      const rawEnd = angle(values[7]!, values[8]!)
      const end = index === 1 && rawEnd > 0 ? rawEnd - 2 * Math.PI : rawEnd
      return `CGPathAddArc(p,nullptr,${FINGERPRINT_GEOMETRY.centerX},${FINGERPRINT_GEOMETRY.centerY},${FINGERPRINT_GEOMETRY.radius},${start},${end},${index === 1});`
    }
    // Split SVG command letters from their following coordinate list.
    const commands = Array.from(ridge.matchAll(/([A-Za-z])([^A-Za-z]*)/g))
    return commands
      .map(([, command, coordinates]) => {
        const values = coordinates!.trim().split(/[ ,]+/).map(Number)
        if (command === 'M' && values.length === 2) {
          return `CGPathMoveToPoint(p,nullptr,${values.join(',')});`
        }
        if (command === 'C' && values.length === 6) {
          return `CGPathAddCurveToPoint(p,nullptr,${values.join(',')});`
        }
        throw new Error(`Unsupported fingerprint path command: ${command}`)
      })
      .join('\n')
  })
}

export function createFingerprintNativeHeader(
  svg: string,
  flow: FingerprintFlow,
): string {
  const paths = fingerprintNativePaths(svg)
  const visited = flow.frames.map(fingerprintVisitedFrames)
  const count =
    Math.round(
      (FINGERPRINT_TIMING.durationMs / 1000) * FINGERPRINT_NATIVE_FPS,
    ) + 1
  const number = (value: number) => Number(value.toFixed(7)).toString()
  const array = (values: readonly number[]) =>
    `{${values.map(number).join(',')}}`
  const color = (value: string) => `0x${value.slice(1)}`
  const palettes = [FINGERPRINT_PALETTES.light, FINGERPRINT_PALETTES.dark]
  const tables = palettes.map((palette) =>
    Array.from({ length: count }, (_, index) => {
      const frame = fingerprintFrame(
        (index * 1000) / FINGERPRINT_NATIVE_FPS,
        flow,
        visited,
        palette,
      )
      return `{${array(frame.extents)},${array(frame.visited)},{${frame.activeColors.map(color).join(',')}},{${frame.tones.map(color).join(',')}},${color(frame.pale)},${color(frame.ringColor)},${color(frame.checkColor)},${number(frame.progress)},${number(frame.eased)},${number(frame.ringSpan)},${number(frame.checkOpacity)},${array(frame.checkEnd)}}`
    }).join(',\n'),
  )
  return `#pragma once
#include <cstdint>
constexpr unsigned kFingerprintRidgeCount=${paths.length};
constexpr unsigned kFingerprintSampleCount=${count};
constexpr double kFingerprintSampleRate=${FINGERPRINT_NATIVE_FPS};
constexpr double kFingerprintApprovalDuration=${fingerprintApprovalDurationMs() / 1000};
constexpr double kFingerprintReducedMotionDuration=${fingerprintApprovalDurationMs(true) / 1000};
constexpr double kFingerprintStrokeWidth=${FINGERPRINT_GEOMETRY.strokeWidth};
constexpr double kFingerprintCenterX=${FINGERPRINT_GEOMETRY.centerX};
constexpr double kFingerprintCenterY=${FINGERPRINT_GEOMETRY.centerY};
constexpr double kFingerprintRadius=${FINGERPRINT_GEOMETRY.radius};
constexpr bool kFingerprintFromEnd[]={${flow.directions.join(',')}};
struct FingerprintSample {
 double extents[kFingerprintRidgeCount], visited[kFingerprintRidgeCount];
 uint32_t active[kFingerprintRidgeCount], tones[3], pale, ring, check;
 double progress, eased, span, checkOpacity, checkEnd[2];
};
constexpr FingerprintSample kFingerprintSamples[2][kFingerprintSampleCount]={
{${tables[0]}},
{${tables[1]}}
};
inline CGPathRef CreateFingerprintRidge(unsigned index, const CGAffineTransform* transform) {
 CGMutablePathRef p=CGPathCreateMutable();
 switch(index){${paths.map((commands, index) => `case ${index}: ${commands} break;`).join('\n')}}
 CGPathRef result=CGPathCreateCopyByTransformingPath(p,transform);
 CGPathRelease(p);
 return result;
}
`
}
