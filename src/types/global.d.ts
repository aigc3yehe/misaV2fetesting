interface Window {
  unityInstance: any;
  createUnityInstance?: (canvas: HTMLCanvasElement, config: any, onProgress: (progress: number) => void) => Promise<any>;
} 