type keyCodeType = number | string;
type functionType = (...args: any[]) => any;
interface IEventHandlerElem {
  eventType: string;
  listener: functionType;
}

class KeypressHandler {
  private intervalID!: NodeJS.Timer;
  private interval!: number;
  private watchingDict: {
    [key: string]: {
      handler: functionType;
      isRunning: boolean;
      onHoldDependent?: boolean;
    };
  } = {};
  private eventListenersList: IEventHandlerElem[] = [];

  private tick() {
    for (const keyKode in this.watchingDict) {
      const watcher = this.watchingDict[keyKode];
      if (watcher.onHoldDependent && watcher.isRunning) watcher.handler();
    }
  }

  private removeEventListeners() {
    this.eventListenersList.forEach(eventListener => {
      document.removeEventListener(
        eventListener.eventType,
        eventListener.listener,
        false,
      );
    });
  }

  public run(interval?: number) {
    this.interval = interval || 100;
    this.intervalID = setInterval(() => this.tick(), this.interval);

    const keydownChecker = (event: KeyboardEvent) => {
      const key = +event.keyCode;
      const watcher = this.watchingDict[key];

      if (!watcher || watcher.isRunning) return;

      if (this.intervalID) clearInterval(this.intervalID);
      watcher.handler();
      watcher.isRunning = true;
      this.intervalID = setInterval(() => this.tick(), 100);
    };
    const keyupChecker = (event: KeyboardEvent) => {
      const key = +event.keyCode;
      const watcher = this.watchingDict[key];

      if (!watcher) return;
      watcher.isRunning = false;
    };

    document.addEventListener('keydown', keydownChecker, false);
    document.addEventListener('keyup', keyupChecker, false);

    this.eventListenersList.push({
      eventType: 'keydown',
      listener: keydownChecker,
    });
    this.eventListenersList.push({
      eventType: 'keyup',
      listener: keyupChecker,
    });
  }

  public stop(opts?: { keepListening: boolean }) {
    if (this.intervalID) clearInterval(this.intervalID);

    if (opts && !opts.keepListening) {
      this.watchingDict = {};
      this.removeEventListeners();
    }
  }

  public onKey(keyCode: keyCodeType, handler: functionType, opts?: { hold: true }) {
    this.watchingDict[keyCode] = {
      handler,
      isRunning: false,
      onHoldDependent: opts && opts.hold,
    };
  }
}

const kh = new KeypressHandler();
export default kh;
