// @flow

type RelayOptions = {
  id: string,
  destination: string
};

// TODO: test
export class RelayConnection {
  options: RelayOptions;
  socket: WebSocket;
  observer: MutationObserver;

  constructor(options: RelayOptions) {
    this.options = options;
    this.initialize();
  }

  async initialize() {
    try {
      await this.connectToWebsocket();
      this.subscribeToChanges();
    } catch (e) {
      console.log(`Could not connect to ${this.options.destination}`);
    }
  }

  async connectToWebsocket(): Promise<void> {
    const socket = new WebSocket(this.options.destination);

    function attemptConnection() {
      return new Promise((resolve, reject) => {
        socket.onopen = event => {
          resolve();
        };
        socket.onerror = event => {
          reject(new Error("Websocket Error"));
        };
      });
    }

    await attemptConnection();
    this.socket = socket;
  }

  subscribeToChanges(): void {
    const node = document.getElementById(this.options.id);

    if (!node) {
      throw new Error(`Element ${this.options.id} not found!`);
    }

    const observer = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        if (mutation.addedNodes.length !== 1) {
          continue;
        }
        const node: any = mutation.addedNodes[0];
        if (!node.isConnected) {
          continue;
        }
        this.socket.send(node.data);
      }
    });

    observer.observe(node, { childList: true });
    this.observer = observer;
  }
}
