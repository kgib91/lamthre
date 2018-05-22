class Thread {
  constructor(delegate) {
    this.cb_resolve_thread = null;
    this.cb_reject_thread = null;
    var script = `self.onmessage = function (e) { self.postMessage((${delegate.toString()}).apply(self, e.data)); };`;
    this.running = false;
    this.worker = new Worker(`data:application/javascript;base64,${btoa(script)}`);
    this.worker.onmessage = (e) => {
      this.cb_resolve_thread(e.data);
      this.running = false;
    };

    this.worker.onerror = (e) => {
      this.error = e;
      this.running = false;
      this.cb_reject_thread(e);
    };
  }
  start(...args) {
    this.worker.postMessage(args);
    this.running = true;
    return new Promise((resolve, reject) => {
      this.cb_resolve_thread = resolve;
      this.cb_reject_thread = reject;
    });
  }
}