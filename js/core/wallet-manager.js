export class WalletManager {
  constructor({ playClickSound } = {}) {
    this.playClickSound = playClickSound || (() => {});
    this.provider = null;
    this.publicKey = null;
  }

  setup() {
    const connectButton = document.getElementById('wallet-connect-button');
    const disconnectButton = document.getElementById('wallet-disconnect-button');
    const copyButton = document.getElementById('wallet-copy-button');

    connectButton?.addEventListener('click', () => this.connect());
    disconnectButton?.addEventListener('click', () => this.disconnect());
    copyButton?.addEventListener('click', () => this.copyAddress());

    const provider = this.getProvider();
    if (provider?.on) {
      provider.on('connect', (publicKey) => this.setConnected(provider, publicKey));
      provider.on('disconnect', () => this.clearConnection('Wallet disconnected.'));
      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.setConnected(provider, publicKey);
        } else {
          this.clearConnection('Wallet account changed. Connect again to continue.');
        }
      });
    }

    this.updateUi();
  }

  getProvider() {
    if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
    if (window.solana?.isPhantom) return window.solana;
    if (window.solana?.isBraveWallet) return window.solana;
    return window.solana || null;
  }

  async connect() {
    this.playClickSound();
    const provider = this.getProvider();

    if (!provider?.connect) {
      this.setStatus('No Solana wallet detected. Install Phantom to connect.');
      window.open('https://phantom.app/download', '_blank', 'noopener');
      return;
    }

    this.setStatus('Connecting to Solana wallet...');
    try {
      const response = await provider.connect();
      this.setConnected(provider, response.publicKey || provider.publicKey);
    } catch (error) {
      if (error?.code === 4001) {
        this.setStatus('Connection request was cancelled.');
      } else {
        this.setStatus('Wallet connection failed. Try again.');
      }
    }
  }

  async disconnect() {
    this.playClickSound();
    if (this.provider?.disconnect) {
      try {
        await this.provider.disconnect();
      } catch (error) {
        // The local state still needs to clear if a provider rejects disconnect.
      }
    }
    this.clearConnection('Wallet disconnected.');
  }

  async copyAddress() {
    if (!this.publicKey) return;
    this.playClickSound();
    try {
      await navigator.clipboard.writeText(this.publicKey.toString());
      this.setStatus('Wallet address copied to clipboard.');
    } catch (error) {
      this.setStatus('Clipboard unavailable. Select the address to copy it.');
    }
  }

  setConnected(provider, publicKey) {
    if (!publicKey) {
      this.setStatus('Wallet connected, but no public key was returned.');
      return;
    }
    this.provider = provider;
    this.publicKey = publicKey;
    this.setStatus('Wallet connected. Ready for card hunts.');
    this.updateUi();
  }

  clearConnection(message) {
    this.provider = null;
    this.publicKey = null;
    this.setStatus(message);
    this.updateUi();
  }

  setStatus(message) {
    const status = document.getElementById('wallet-status');
    if (status) status.textContent = message;
  }

  updateUi() {
    const address = document.getElementById('wallet-address');
    const network = document.getElementById('wallet-network');
    const connectButton = document.getElementById('wallet-connect-button');
    const disconnectButton = document.getElementById('wallet-disconnect-button');
    const copyButton = document.getElementById('wallet-copy-button');
    const connected = Boolean(this.publicKey);

    if (address) {
      const fullAddress = this.publicKey?.toString() || '';
      address.textContent = connected ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-6)}` : 'Not connected';
      address.title = fullAddress;
    }
    if (network) network.textContent = connected ? 'Solana Mainnet' : 'Waiting for connection';
    if (connectButton) connectButton.disabled = connected;
    if (disconnectButton) disconnectButton.disabled = !connected;
    if (copyButton) copyButton.disabled = !connected;
  }
}
