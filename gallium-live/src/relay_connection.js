// @flow

type RelayOptions = {
  id: string,
  destination: string,
  mode: "control" | "listen"
};

type RelayPayload = {
  text: string,
  scrollTop: number
};

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
    } catch (e) {
      console.log(`Could not connect to ${this.options.destination}`);
    }
    if (this.options.mode === "control") {
      this.initializeControlMode();
    } else if (this.options.mode === "listen") {
      this.initializeListenMode();
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

  initializeListenMode(): void {
    console.log("Listen mode activated.");

    const node = document.getElementById(this.options.id);

    if (!node) {
      throw new Error(`Element ${this.options.id} not found!`);
    }

    this.socket.onmessage = message => {
      const relayPayload: RelayPayload = JSON.parse((message.data: any));
      console.log(relayPayload);
      const { text, scrollTop } = relayPayload;
      Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set.call(node, text);
      const event = new Event("input", { bubbles: true });
      node.dispatchEvent(event);
      node.scrollTop = scrollTop;
    };
  }

  initializeControlMode(): void {
    console.log("Control mode activated.");
    const node = document.getElementById(this.options.id);

    if (!node) {
      throw new Error(`Element ${this.options.id} not found!`);
    }

    const observer = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        if (mutation.addedNodes.length !== 1) {
          continue;
        }
        const mutationNode: any = mutation.addedNodes[0];
        if (!mutationNode.isConnected) {
          continue;
        }
        const relayPayload: RelayPayload = {
          text: mutationNode.data,
          scrollTop: node.scrollTop
        };
        this.socket.send(JSON.stringify(relayPayload));
      }
    });

    observer.observe(node, { childList: true });
    this.observer = observer;
  }
}
