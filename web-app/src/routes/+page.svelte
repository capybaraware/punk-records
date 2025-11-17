<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { browser } from '$app/environment';
  import type { Card } from '$lib/cards';
  
  let searchQuery = '';
  let isLoading = false;
  let cards: Card[] = [];
  let debounceTimer: NodeJS.Timeout;
  let selectedCard: Card | null = null;
  let isModalOpen = false;

  function closeModal() {
    isModalOpen = false;
    if (browser) {
      document.body.style.overflow = 'auto';
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleOverlayKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.target === event.currentTarget) {
        closeModal();
      }
    }
  }

  function openModal(card: Card) {
    selectedCard = card;
    isModalOpen = true;
    if (browser) {
      document.body.style.overflow = 'hidden';
    }
  }

  function handleCardKeyDown(event: KeyboardEvent, card: Card) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(card);
    }
  }

  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', handleEscapeKey);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('keydown', handleEscapeKey);
    }
  });
  
  async function search() {
    if (!searchQuery.trim()) {
      cards = [];
      return;
    }
    
    isLoading = true;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      cards = await response.json() as Card[];
    } catch (error) {
      console.error('Search failed:', error);
      cards = [];
    } finally {
      isLoading = false;
    }
  }
  
  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 300);
  }
</script>

<div class="container">
  <h1>One Piece Card Search</h1>
  
  <div class="search-container">
    <input 
      type="search"
      inputmode="search"
      bind:value={searchQuery}
      on:input={handleInput}
      placeholder="Search by card ID or name..."
      class="search-input"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />
    {#if isLoading}
      <div class="loading">Searching...</div>
    {/if}
  </div>
  
  <div class="results">
    {#if cards.length > 0}
      <div class="card-grid">
        {#each cards as card}
          <div 
            class="card" 
            role="button"
            tabindex="0"
            on:click={() => openModal(card)}
            on:keydown={(e) => handleCardKeyDown(e, card)}
            aria-label="View {card.name} card details"
          >
            <div class="card-image-placeholder">
              <div class="card-id">{card.id}</div>
              <div class="card-name">{card.name}</div>
              <div class="view-image-hint">Click to view image</div>
            </div>
            <div class="card-details">
              <h3>{card.name}</h3>
              <p><strong>ID:</strong> {card.id}</p>
              <p><strong>Rarity:</strong> {card.rarity}</p>
              <p><strong>Cost:</strong> {card.cost}</p>
              {#if card.power}
                <p><strong>Power:</strong> {card.power}</p>
              {/if}
              {#if card.effect}
                <div class="effect">
                  <strong>Effect:</strong> {card.effect}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else if searchQuery && !isLoading}
      <p>No cards found matching "{searchQuery}"</p>
    {/if}
  </div>

  {#if isModalOpen}
    <div 
      class="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label="Card image modal"
      tabindex="-1"
      on:click={handleOverlayClick}
      on:keydown={handleOverlayKeyDown}
    >
      <div 
        class="modal" 
        transition:fly={{ y: 20, duration: 200 }}
      >
        <button 
          class="close-button" 
          on:click={closeModal}
          aria-label="Close modal"
        >
          &times;
        </button>
        {#if selectedCard}
          <img 
            src={selectedCard.img_full_url} 
            alt={selectedCard.name}
            class="modal-image"
          />
          <div class="modal-caption">
            <div class="modal-card-id">{selectedCard.id}</div>
            <div class="modal-card-name">{selectedCard.name}</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .search-container {
    margin: 2rem 0;
    position: relative;
  }
  
  .search-input {
    width: 100%;
    padding: 0.8rem 1rem;
    font-size: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s, color 0.2s;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  
  .loading {
    margin-top: 0.5rem;
    color: var(--text-tertiary);
  }
  
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 640px) {
    .card-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .container {
      padding: 1rem;
    }
    .search-container {
      margin: 1rem 0;
    }
    .card {
      border-radius: 8px;
    }
  }
  
  .card {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px var(--shadow-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--card-bg);
    height: 100%;
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px var(--shadow-hover);
  }

  .card:active {
    transform: scale(0.98);
  }
  
  .card-image-placeholder {
    background: linear-gradient(135deg, var(--card-placeholder-start) 0%, var(--card-placeholder-end) 100%);
    padding: 1.5rem;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
  }

  .card-id {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .card-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-word;
    margin-bottom: 0.5rem;
  }

  .view-image-hint {
    font-size: 0.8rem;
    color: var(--accent-color);
    margin-top: 0.5rem;
    font-weight: 500;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--modal-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    padding: 1rem;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .modal {
    background: var(--card-bg);
    border-radius: 12px;
    max-width: 90%;
    max-height: 90vh;
    width: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px var(--shadow-modal);
    margin: 2rem 0;
    overflow: auto;
  }

  .modal-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 12px 12px 0 0;
  }

  .close-button {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    cursor: pointer;
    color: var(--text-primary);
    z-index: 10;
    padding: 0;
    margin: 0;
    box-shadow: 0 2px 8px var(--shadow-color);
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: var(--bg-tertiary);
    transform: scale(1.1);
  }

  .modal-caption {
    padding: 1rem;
    text-align: center;
    background: var(--card-bg);
    border-radius: 0 0 12px 12px;
  }

  .modal-card-name {
    font-size: 1.2rem;
    font-weight: 600;
    margin-top: 0.25rem;
    color: var(--text-primary);
  }

  .modal-card-id {
    font-size: 0.9rem;
    color: var(--text-tertiary);
  }

  @media (max-width: 640px) {
    .modal {
      width: 95%;
      max-height: 85vh;
    }

    .close-button {
      width: 2.2rem;
      height: 2.2rem;
      font-size: 1.5rem;
      top: 0.5rem;
      right: 0.5rem;
    }
  }
  
  .card-details {
    padding: 1.25rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .card h3 {
    margin: 0 0 0.75rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .card p {
    margin: 0.2rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .effect {
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-light);
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  h1 {
    color: var(--text-primary);
  }

  .results p {
    color: var(--text-secondary);
  }
</style>
