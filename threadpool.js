const MAX_THREADS = 7;

class ThreadPool {
  constructor(delegate) {
    this.uniqueId = 0;
    this.promises = [];
    this.pool = [];
    this.queue = [];
    this.poolIntervalId = null;
    this.promises_resolve = {};
    this.promises_reject = {};
    
    this.createThreads(delegate);
  }
  createThreads(delegate) {
    for(var i = 0; i < MAX_THREADS; ++i) {
      this.pool.push(new Thread(delegate));
    }
  }
  startMonitor() {
    if(this.poolIntervalId == null) {
      this.poolIntervalId = setInterval(() => {
        if(this.queued > 0 && this.running < MAX_THREADS) {
          var meta = this.queue.pop();
          for(var i = 0; i < MAX_THREADS; ++i) {
            if(!this.pool[i].running) {
              var promise = this.pool[i].start.apply(this.pool[i], meta.arguments);
              this.wrapThreadPromise(meta.id, promise);
              break;
            }
          }
        } else if(this.queued == 0 && this.running == 0) {
          this.stopMonitor();
        }
      }, 1);
    }
  }
  stopMonitor() {
    if(this.poolIntervalId != null) {
      clearInterval(this.poolIntervalId);
      this.poolIntervalId = null;
    }
  }
  wrapThreadPromise(id, threadPromise) {
    threadPromise
      .then((result) => { this.promises_resolve[id](result); this.destroyThreadpoolPromise(id); })
      .catch((error) => { this.promises_reject[id](error); this.destroyThreadpoolPromise(id); })
  }
  destroyThreadpoolPromise(id) {
    delete this.promises_resolve[id];
    delete this.promises_reject[id];
  }
  createThreadPoolPromise(id) {
    return new Promise((resolve, reject) => {
      this.promises_resolve[id] = resolve;
      this.promises_reject[id] = reject;
    });
  }
  start(...args) {
    var meta = { id: this.uniqueId++, arguments: args };
    this.queue.push(meta);
    this.startMonitor();
    return this.createThreadPoolPromise(meta.id);
  }
  get running() {
    var running = 0;
    for(var i = 0; i < this.pool.length; ++i) {
      if(this.pool[i].running) {
        running++;
      }
    }
    return running;
  }
  get queued() {
    return this.queue.length;
  }
}