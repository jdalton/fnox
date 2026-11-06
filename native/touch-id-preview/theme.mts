// Dark mode is the source palette. Light mode reverses perceptual lightness
// in OKLab. Light surfaces use blue for working states and gold for success.
export const DARK_THEME = Object.freeze({
  resting: '#323c4a', border: '#323c4a', incoming: '#637a8e', gold: '#d4af37',
  check: '#e5bf52', highlight: '#edcc75', heading: '#edeff5',
  cancelText: '#eeeee9', pressed: '#0a0e1a', ribbon: '#7ed7f4',
  success: '#d4af37', trail: '#edcc75', shimmer: '#edcc75',
})
export function lightColor(hex: string, lightnessOffset = 0): string {
  const rgb = hex.slice(1).match(/../g)!.map(x => parseInt(x, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  const [r,g,b] = rgb as [number,number,number]
  const l = Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b)
  const m = Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b)
  const s = Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b)
  const L = lightnessOffset + .95 - .78*(.2104542553*l+.793617785*m-.0040720468*s)
  const a = .9*(1.9779984951*l-2.428592205*m+.4505937099*s)
  const z = .9*(.0259040371*l+.7827717662*m-.808675766*s)
  const ll=(L+.3963377774*a+.2158037573*z)**3
  const mm=(L-.1055613458*a-.0638541728*z)**3
  const ss=(L-.0894841775*a-1.291485548*z)**3
  return '#'+[4.0767416621*ll-3.3077115913*mm+.2309699292*ss,
    -1.2684380046*ll+2.6097574011*mm-.3413193965*ss,
    -.0041960863*ll-.7034186147*mm+1.707614701*ss]
    .map(v => Math.max(0,Math.min(1,v)))
    .map(v => Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)))
    .map(v => v.toString(16).padStart(2,'0')).join('')
}
function luminance(hex: string): number {
  const [r,g,b] = hex.slice(1).match(/../g)!.map(x => parseInt(x,16)/255)
    .map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4) as [number,number,number]
  return .2126*r+.7152*g+.0722*b
}
function deriveLightTheme() {
  const theme = Object.fromEntries(Object.entries(DARK_THEME)
    .map(([key,value]) => [key,lightColor(value)])) as Record<keyof typeof DARK_THEME,string>
  theme.resting = lightColor(DARK_THEME.resting, -.035)
  theme.incoming = lightColor(DARK_THEME.resting, -.09)
  theme.trail = lightColor(DARK_THEME.incoming, -.035)
  // Ordinary text and icons use the source palette's blue hue instead of
  // inverting gold into brown.
  // Labels/icons on the shared control fill must remain readable after mapping.
  for (const key of ['gold','highlight','heading','cancelText'] as const) {
    for (let offset=0; offset>=-.3; offset-=.005) {
      const source = key === 'gold' || key === 'highlight'
        ? DARK_THEME.incoming : DARK_THEME[key]
      theme[key]=lightColor(source,offset)
      if ((luminance(theme.resting)+.05)/(luminance(theme[key])+.05)>=4.5) break
    }
  }
  // An outline touches the light glass outside the ribbon. Evaluate it against
  // that matte, not the ribbon interior or the control fill.
  for (let offset=0; offset>=-.3; offset-=.005) {
    theme.border=lightColor(DARK_THEME.border,offset)
    if ((luminance('#fcfbf8')+.05)/(luminance(theme.border)+.05)>=4.5) break
  }
  // Success uses only colors already present in the fingerprint.
  const fingerprintDarkest = [theme.resting, theme.incoming, theme.trail]
    .reduce((darkest, color) => luminance(color) < luminance(darkest) ? color : darkest)
  theme.success = fingerprintDarkest
  theme.check = fingerprintDarkest
  // Shimmer is brighter than the text, while readable against the light glass.
  for (let offset=-.09; offset>=-.3; offset-=.005) {
    theme.shimmer=lightColor(DARK_THEME.resting,offset)
    if ((luminance('#fcfbf8')+.05)/(luminance(theme.shimmer)+.05)>=4.5) break
  }
  return Object.freeze(theme)
}
export const LIGHT_THEME = deriveLightTheme()
export function themeHeader(): string {
  return '#pragma once\n#include <cstdint>\nnamespace fnox {\n'+
    Object.keys(DARK_THEME).map(key => {
      const name=key[0]!.toUpperCase()+key.slice(1)
      return `constexpr uint32_t kTheme${name}[2]={0x${LIGHT_THEME[key as keyof typeof DARK_THEME].slice(1)},0x${DARK_THEME[key as keyof typeof DARK_THEME].slice(1)}};`
    }).join('\n')+'\n}\n'
}
