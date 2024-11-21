interface Window {
  unityInstance: {
    SendMessage(objectName: string, methodName: string, value?: any): void;
  };
  createUnityInstance?: (canvas: HTMLCanvasElement, config: any, onProgress: (progress: number) => void) => Promise<any>;
  UnityStartCallback?: (instance: any) => void;
} 