export {}; // this file needs to be a module
declare global {
  interface Window {
    openWpmResponseBodyListenerContentScriptConfig: any;
    openWpmResponseBodyListenerInstrumentationStarted: boolean;
  }
}
