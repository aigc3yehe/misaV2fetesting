export function getScreenWidth(): number {
  return window.screen.width * getDevicePixelRatio() / 100;
}

export function getScreenHeight(): number {
  return window.screen.height * getDevicePixelRatio() / 100;
}

export function getDevicePixelRatio(): number {
  let ratio = 0;
  const screen = window.screen;
  const ua = navigator.userAgent.toLowerCase();

  if (window.devicePixelRatio !== undefined) {
    ratio = window.devicePixelRatio;
  }
  else if (ua.indexOf('msie') !== -1) {
    if ((screen as any).deviceXDPI && (screen as any).logicalXDPI) {
      ratio = (screen as any).deviceXDPI / (screen as any).logicalXDPI;
    }
  }
  else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
    ratio = window.outerWidth / window.innerWidth;
  }

  if (ratio) {
    ratio = Math.round(ratio * 100);
  }
  
  return ratio;
} 