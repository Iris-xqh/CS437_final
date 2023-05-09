export default class AudioHandler {
  constructor(audioConfig) {
    this.src = audioConfig.src;
    this.ctx = null;
    this.buffer = null;
    this.isLoaded = false;
  }

  setup = async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.buffer = await this.getFile();
  };

  getFile = async () => {
    const resp = await fetch(this.src);
    if (!resp.ok) {
      throw new Error(`HTTP error${resp.status}`);
    }
    const arrayBuffer = await resp.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.isLoaded = true;
    return audioBuffer;
  };

  start = () => {
    if (this.ctx && this.buffer) {
      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = this.buffer;
      bufferSource.connect(this.ctx.destination);
      bufferSource.start();
    }
  };
}
