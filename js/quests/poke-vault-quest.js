/**
 * Poke Vault quest - simplified replacement for Black Vault
 * Provides lightweight shard collection and verification via Poke Terminal.
 */

export class PokeVaultQuest {
  constructor(options = {}) {
    this.playClickSound = typeof options.playClickSound === 'function' ? options.playClickSound : () => {};
    this.showBotAssistant = typeof options.showBotAssistant === 'function' ? options.showBotAssistant : () => {};

    this.state = {
      started: localStorage.getItem('pokeVaultStarted') === 'true',
      shardsFound: JSON.parse(localStorage.getItem('pokeVaultShards') || '[]'),
      completed: localStorage.getItem('pokeVaultCompleted') === 'true'
    };

    // Simple secret used for shard splitting (kept intentionally trivial)
    this.secret = 'POKE-VAULT-COLLECTION-SECRET-2026';
    this.shardCount = 5;
  }

  registerTerminalCommands(terminal) {
    if (!terminal || typeof terminal.registerCommand !== 'function') return;

    terminal.registerCommand(['pokevault'], (ctx) => this.cmdPokeVault(ctx));
    terminal.registerCommand(['pokevaultreset'], (ctx) => this.cmdPokeVaultReset(ctx));
    terminal.registerCommand(['shards'], (ctx) => this.cmdShards(ctx));
    terminal.registerCommand(['assemble'], (ctx) => this.cmdAssemble(ctx));
  }

  saveState() {
    localStorage.setItem('pokeVaultStarted', String(this.state.started));
    localStorage.setItem('pokeVaultShards', JSON.stringify(this.state.shardsFound));
    localStorage.setItem('pokeVaultCompleted', String(this.state.completed));
  }

  getShards() {
    const total = this.shardCount;
    const base = Math.floor(this.secret.length / total);
    const rem = this.secret.length % total;
    const shards = [];
    let cursor = 0;
    for (let i = 0; i < total; i++) {
      const size = base + (i < rem ? 1 : 0);
      shards.push(this.secret.slice(cursor, cursor + size));
      cursor += size;
    }
    return shards;
  }

  cmdPokeVault({ terminal }) {
    terminal.terminalPrint('=== POKE VAULT ===');
    terminal.terminalPrint('');

    if (!this.state.started) {
      this.state.started = true;
      this.saveState();
      terminal.terminalPrint('Poke Vault initialized. Use terminal challenges and explore to recover shards.');
      terminal.terminalPrint('Type "shards" to view recovery progress.');
      terminal.terminalPrint('');
    }

    const progress = `${this.state.shardsFound.length}/${this.shardCount}`;
    terminal.terminalPrint(`Shards recovered: ${progress}`);

    if (this.state.completed) {
      terminal.terminalPrint('Status: COMPLETE');
      terminal.terminalPrint('You have assembled the Poke Vault secret.');
      terminal.terminalPrint('');
    } else {
      terminal.terminalPrint('Keep exploring mini-sites and click cache markers to collect shards.');
      terminal.terminalPrint('');
    }
  }

  cmdShards({ terminal }) {
    if (!this.state.started) {
      terminal.terminalPrint('No Poke Vault session found. Run pokevault first.');
      terminal.terminalPrint('');
      return;
    }

    const shards = this.getShards();
    terminal.terminalPrint('=== SHARD VIEW ===');
    terminal.terminalPrint('');

    for (let i = 0; i < shards.length; i++) {
      const found = this.state.shardsFound.includes(String(i));
      const value = found ? shards[i] : '????';
      terminal.terminalPrint(`${String(i + 1).padStart(2, '0')}. SHARD_${i + 1} :: ${value}`);
    }
    terminal.terminalPrint('');
    terminal.terminalPrint(`Recovered ${this.state.shardsFound.length}/${shards.length}`);
    terminal.terminalPrint('');
  }

  cmdAssemble({ terminal, rawArgs }) {
    if (!this.state.started) {
      terminal.terminalPrint('No active Poke Vault session. Run pokevault first.');
      terminal.terminalPrint('');
      return;
    }

    const candidate = (rawArgs || []).join(' ').trim();
    if (!candidate) {
      terminal.terminalPrint('Usage: assemble <secret_candidate>');
      terminal.terminalPrint('');
      return;
    }

    if (this.state.shardsFound.length < this.shardCount) {
      terminal.terminalPrint(`Insufficient shards. Recovered ${this.state.shardsFound.length}/${this.shardCount}.`);
      terminal.terminalPrint('Run shards to view missing entries.');
      terminal.terminalPrint('');
      return;
    }

    if (candidate === this.secret) {
      this.state.completed = true;
      this.saveState();
      terminal.terminalPrint('POKE VAULT VERIFIED');
      terminal.terminalPrint('Secret assembly confirmed.');
      terminal.terminalPrint('');
      this.showBotAssistant('Poke Vault integrity check passed. Nice work, Trainer!');
      return;
    }

    terminal.terminalPrint('Assembly mismatch. Candidate rejected.');
    terminal.terminalPrint('');
  }

  cmdPokeVaultReset({ terminal }) {
    this.state.started = false;
    this.state.shardsFound = [];
    this.state.completed = false;
    this.saveState();
    terminal.terminalPrint('Poke Vault state reset.');
    terminal.terminalPrint('Run pokevault to start again.');
    terminal.terminalPrint('');
  }

  // Simple marker attach (used by mini-sites to allow shard collection)
  addShardMarker(index, pageEl) {
    if (!pageEl) return;
    if (pageEl.querySelector(`[data-pokevault-marker="${index}"]`)) return;

    const marker = document.createElement('p');
    marker.dataset.pokevaultMarker = String(index);
    marker.style.margin = '10px 8px 0 8px';
    marker.style.fontFamily = 'Courier New, monospace';
    marker.style.fontSize = '10px';
    marker.style.color = '#006600';
    marker.style.cursor = 'pointer';
    marker.textContent = '[POKE CACHE: CLICK TO COLLECT SHARD]';

    marker.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.playClickSound();
      this.collectShard(String(index));
    });

    pageEl.appendChild(marker);
  }

  collectShard(index) {
    if (!this.state.started) {
      this.showBotAssistant('Poke Vault locked. Run pokevault in terminal first.');
      return false;
    }

    if (this.state.shardsFound.includes(String(index))) {
      this.showBotAssistant('Shard already collected from this node.');
      return false;
    }

    this.state.shardsFound.push(String(index));
    this.saveState();

    const shards = this.getShards();
    const value = shards[Number(index)];
    this.showBotAssistant(`shard ${Number(index) + 1}/${shards.length} recovered: ${value}`);

    if (this.state.shardsFound.length === shards.length) {
      this.showBotAssistant('All Poke Vault shards collected. Run assemble <secret> in Poke Terminal.');
    }

    return true;
  }
}
