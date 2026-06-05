/**
 * Bot Assistant
 * Manages the helpful bot suggestions that appear periodically
 */

import { assistantMessages } from './poke-assistant-messages.js';

export class BotAssistant {
  constructor() {
    this.shown = false;
    this.messageIndex = 0;
    this.hideTimer = null;
    this.messages = assistantMessages;
  }

  setup(playClickSound) {
    const botEl = document.getElementById('bot-assistant');
    const closeBtn = botEl.querySelector('.bot-assistant-close');
    
    // Close button handler
    closeBtn.addEventListener('click', () => {
      playClickSound();
      this.hide();
    });
    
    // Show bot with random messages periodically
    setInterval(() => {
      if (!this.shown && Math.random() > 0.85) {
        this.show();
      }
    }, 45000); // Check every 45 seconds
  }

  show(message = null) {
    const botEl = document.getElementById('bot-assistant');
    if (!botEl) return;

    const messageEl = botEl.querySelector('.bot-assistant-message');
    if (!messageEl) return;

    // If already shown, allow updating message and refreshing timeout.
    if (this.shown && !message) {
      return;
    }
    
    // Use provided message or get next from rotation
    if (message) {
      messageEl.textContent = message;
    } else {
      messageEl.textContent = this.messages[this.messageIndex % this.messages.length];
      this.messageIndex++;
    }
    
    botEl.style.display = 'block';
    botEl.classList.remove('closing');
    this.shown = true;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // Auto-hide after 25 seconds
    this.hideTimer = setTimeout(() => {
      if (this.shown) {
        this.hide();
      }
    }, 25000);
  }

  hide() {
    const botEl = document.getElementById('bot-assistant');
    if (!botEl) return;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    botEl.classList.add('closing');
    
    setTimeout(() => {
      botEl.style.display = 'none';
      botEl.classList.remove('closing');
      this.shown = false;
    }, 300); // Match animation duration
  }
}
