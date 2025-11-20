<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { browser } from '$app/environment';
  import type { Card } from '$lib/cards';
  import { searchCards, type CardFilters } from '$lib/cards-client';
  
  let searchQuery = '';
  let isLoading = false;
  let cards: Card[] = [];
  let debounceTimer: NodeJS.Timeout;
  let selectedCard: Card | null = null;
  let isModalOpen = false;
  
  // Filter state
  const availableColors = ['Red', 'Blue', 'Green', 'Purple', 'Black', 'Yellow'];
  const availableAttributes = ['Strike', 'Slash', 'Ranged', 'Special', 'Wisdom'];
  let selectedColors: string[] = [];
  let selectedAttributes: string[] = [];
  let selectedTypes: string[] = [];
  let costMin: number | undefined = undefined;
  let costMax: number | undefined = undefined;
  let powerMin: number | undefined = undefined;
  let powerMax: number | undefined = undefined;
  let counterMin: number | undefined = undefined;
  let counterMax: number | undefined = undefined;
  let hasTrigger: boolean | undefined = undefined;
  
  // Available types will be populated from search results
  let availableTypes: string[] = [];

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
    // Build filters object
    const filters: CardFilters = {};
    
    if (selectedColors.length > 0) {
      filters.colors = selectedColors;
    }
    if (selectedAttributes.length > 0) {
      filters.attributes = selectedAttributes;
    }
    if (selectedTypes.length > 0) {
      filters.types = selectedTypes;
    }
    if (costMin !== undefined && costMin !== null) {
      filters.costMin = costMin;
    }
    if (costMax !== undefined && costMax !== null) {
      filters.costMax = costMax;
    }
    if (powerMin !== undefined && powerMin !== null) {
      filters.powerMin = powerMin;
    }
    if (powerMax !== undefined && powerMax !== null) {
      filters.powerMax = powerMax;
    }
    if (counterMin !== undefined && counterMin !== null) {
      filters.counterMin = counterMin;
    }
    if (counterMax !== undefined && counterMax !== null) {
      filters.counterMax = counterMax;
    }
    if (hasTrigger !== undefined) {
      filters.hasTrigger = hasTrigger;
    }
    
    // Only search if there's a query or filters
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      cards = [];
      return;
    }
    
    isLoading = true;
    try {
      cards = await searchCards(searchQuery, filters);
      // Update available types from results
      const allTypes = new Set<string>();
      cards.forEach(card => {
        card.types.forEach(type => allTypes.add(type));
      });
      availableTypes = Array.from(allTypes).sort();
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
  
  function toggleColor(color: string) {
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter(c => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
    triggerSearch();
  }
  
  function toggleAttribute(attr: string) {
    if (selectedAttributes.includes(attr)) {
      selectedAttributes = selectedAttributes.filter(a => a !== attr);
    } else {
      selectedAttributes = [...selectedAttributes, attr];
    }
    triggerSearch();
  }
  
  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      selectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      selectedTypes = [...selectedTypes, type];
    }
    triggerSearch();
  }
  
  function triggerSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 300);
  }
  
  function clearAllFilters() {
    selectedColors = [];
    selectedAttributes = [];
    selectedTypes = [];
    costMin = undefined;
    costMax = undefined;
    powerMin = undefined;
    powerMax = undefined;
    counterMin = undefined;
    counterMax = undefined;
    hasTrigger = undefined;
    triggerSearch();
  }
  
  function hasActiveFilters(): boolean {
    return selectedColors.length > 0 ||
           selectedAttributes.length > 0 ||
           selectedTypes.length > 0 ||
           costMin !== undefined ||
           costMax !== undefined ||
           powerMin !== undefined ||
           powerMax !== undefined ||
           counterMin !== undefined ||
           counterMax !== undefined ||
           hasTrigger !== undefined;
  }
  
  // Helper function to check if card has blocker
  function hasBlocker(card: Card): boolean {
    if (!card.effect) return false;
    // Check for [Blocker] in effect (case-insensitive, handles conditional blockers)
    return /\[Blocker\]/i.test(card.effect);
  }
  
  // Helper function to get color hex for styling
  function getColorHex(color: string): string {
    const colorMap: Record<string, string> = {
      'Red': '#dc2626',
      'Blue': '#2563eb',
      'Green': '#16a34a',
      'Purple': '#9333ea',
      'Black': '#1f2937',
      'Yellow': '#eab308'
    };
    return colorMap[color] || '#6b7280';
  }
  
  // Helper function to get card background color class
  function getCardColorClass(card: Card): string {
    // If it's a Leader, no color class
    if (card.category === 'Leader') {
      return '';
    }
    
    // Otherwise, use the first color from the card's colors array
    if (card.colors && card.colors.length > 0) {
      const color = card.colors[0].toLowerCase();
      return `card-color-${color}`;
    }
    
    return '';
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
  
  <div class="filters-section">
    <div class="filters-header">
      <h2>Filters</h2>
      {#if hasActiveFilters()}
        <button class="clear-filters-btn" on:click={clearAllFilters}>
          Clear All Filters
        </button>
      {/if}
    </div>
    
    <div class="filters-grid">
      <!-- Color Filters -->
      <div class="filter-group">
        <label class="filter-label">Colors</label>
        <div class="color-buttons">
          {#each availableColors as color}
            <button
              class="color-button"
              class:active={selectedColors.includes(color)}
              on:click={() => toggleColor(color)}
              style="background-color: {getColorHex(color)}"
              aria-label="Filter by {color}"
            >
              {color}
              {#if selectedColors.includes(color)}
                <span class="checkmark">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Cost Filter -->
      <div class="filter-group">
        <label class="filter-label">Cost</label>
        <div class="range-inputs">
          <input
            type="number"
            placeholder="Min"
            bind:value={costMin}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            bind:value={costMax}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
        </div>
      </div>
      
      <!-- Power Filter -->
      <div class="filter-group">
        <label class="filter-label">Power</label>
        <div class="range-inputs">
          <input
            type="number"
            placeholder="Min"
            bind:value={powerMin}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            bind:value={powerMax}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
        </div>
      </div>
      
      <!-- Counter Filter -->
      <div class="filter-group">
        <label class="filter-label">Counter</label>
        <div class="range-inputs">
          <input
            type="number"
            placeholder="Min"
            bind:value={counterMin}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            bind:value={counterMax}
            on:input={triggerSearch}
            min="0"
            class="range-input"
          />
        </div>
      </div>
      
      <!-- Attributes Filter -->
      <div class="filter-group">
        <label class="filter-label">Attributes</label>
        <div class="filter-buttons">
          {#each availableAttributes as attr}
            <button
              class="filter-button"
              class:active={selectedAttributes.includes(attr)}
              on:click={() => toggleAttribute(attr)}
            >
              {attr}
              {#if selectedAttributes.includes(attr)}
                <span class="checkmark">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Types Filter -->
      <div class="filter-group">
        <label class="filter-label">Types</label>
        <div class="filter-buttons types-buttons">
          {#each availableTypes as type}
            <button
              class="filter-button"
              class:active={selectedTypes.includes(type)}
              on:click={() => toggleType(type)}
            >
              {type}
              {#if selectedTypes.includes(type)}
                <span class="checkmark">✓</span>
              {/if}
            </button>
          {/each}
          {#if availableTypes.length === 0}
            <p class="filter-hint">Search to see available types</p>
          {/if}
        </div>
      </div>
      
      <!-- Trigger Filter -->
      <div class="filter-group">
        <label class="filter-label">Has Trigger</label>
        <div class="toggle-buttons">
          <button
            class="toggle-button"
            class:active={hasTrigger === true}
            on:click={() => hasTrigger = hasTrigger === true ? undefined : true}
          >
            Yes
            {#if hasTrigger === true}
              <span class="checkmark">✓</span>
            {/if}
          </button>
          <button
            class="toggle-button"
            class:active={hasTrigger === false}
            on:click={() => hasTrigger = hasTrigger === false ? undefined : false}
          >
            No
            {#if hasTrigger === false}
              <span class="checkmark">✓</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <div class="results">
    {#if cards.length > 0}
      <div class="card-grid">
        {#each cards as card}
          <div 
            class="card {getCardColorClass(card)}" 
            class:leader-card={card.category === 'Leader'}
            role="button"
            tabindex="0"
            on:click={() => openModal(card)}
            on:keydown={(e) => handleCardKeyDown(e, card)}
            aria-label="View {card.name} card details"
          >
            <div class="card-image-placeholder">
              <div class="card-id">{card.card_id}</div>
              <div class="card-name">{card.name}</div>
              <div class="view-image-hint">Click to view image</div>
            </div>
            <div class="card-details">
              <h3>{card.name}</h3>
              {#if hasBlocker(card)}
                <div class="blocker-badge">[Blocker]</div>
              {/if}
              <p><strong>ID:</strong> {card.card_id}</p>
              <p><strong>Rarity:</strong> {card.rarity}</p>
              <p><strong>Cost:</strong> {card.cost ?? 'N/A'}</p>
              {#if card.power}
                <p><strong>Power:</strong> {card.power}</p>
              {/if}
              {#if card.counter}
                <p><strong>Counter:</strong> {card.counter}</p>
              {/if}
              {#if card.attributes && card.attributes.length > 0}
                <p><strong>Attribute:</strong> {card.attributes.join(', ')}</p>
              {/if}
              {#if card.types && card.types.length > 0}
                <p><strong>Type:</strong> {card.types.join(', ')}</p>
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
            <div class="modal-card-id">{selectedCard.card_id}</div>
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
  
  .card.leader-card {
    background: var(--card-bg);
    color: var(--text-primary);
  }
  
  /* Color-based backgrounds */
  .card-color-red {
    background-color: #dc2626;
    color: white;
  }
  
  .card-color-blue {
    background-color: #2563eb;
    color: white;
  }
  
  .card-color-green {
    background-color: #16a34a;
    color: white;
  }
  
  .card-color-purple {
    background-color: #9333ea;
    color: white;
  }
  
  .card-color-black {
    background-color: #1f2937;
    color: white;
  }
  
  .card-color-yellow {
    background-color: #eab308;
    color: white;
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
  
  .card-color-red .card-image-placeholder,
  .card-color-blue .card-image-placeholder,
  .card-color-green .card-image-placeholder,
  .card-color-purple .card-image-placeholder,
  .card-color-black .card-image-placeholder,
  .card-color-yellow .card-image-placeholder {
    background: rgba(255, 255, 255, 0.1);
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }

  .card-id {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .card-color-red .card-id,
  .card-color-blue .card-id,
  .card-color-green .card-id,
  .card-color-purple .card-id,
  .card-color-black .card-id,
  .card-color-yellow .card-id {
    color: rgba(255, 255, 255, 0.8);
  }

  .card-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-word;
    margin-bottom: 0.5rem;
  }
  
  .card-color-red .card-name,
  .card-color-blue .card-name,
  .card-color-green .card-name,
  .card-color-purple .card-name,
  .card-color-black .card-name,
  .card-color-yellow .card-name {
    color: white;
  }

  .view-image-hint {
    font-size: 0.8rem;
    color: var(--accent-color);
    margin-top: 0.5rem;
    font-weight: 500;
  }
  
  .card-color-red .view-image-hint,
  .card-color-blue .view-image-hint,
  .card-color-green .view-image-hint,
  .card-color-purple .view-image-hint,
  .card-color-black .view-image-hint,
  .card-color-yellow .view-image-hint {
    color: rgba(255, 255, 255, 0.9);
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

  .filters-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .filters-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .clear-filters-btn {
    padding: 0.5rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .clear-filters-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent-color);
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .color-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .color-button {
    position: relative;
    padding: 0.5rem 1rem;
    padding-right: 2rem;
    border: 2px solid transparent;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .color-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .color-button.active {
    border-color: white;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
    font-weight: 700;
  }

  .checkmark {
    position: absolute;
    right: 0.5rem;
    font-weight: bold;
    font-size: 1rem;
  }

  .range-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .range-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .range-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  .range-inputs span {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-button {
    position: relative;
    padding: 0.5rem 1rem;
    padding-right: 2rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-button:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent-color);
  }

  .filter-button.active {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
    font-weight: 600;
  }

  .types-buttons {
    max-height: 200px;
    overflow-y: auto;
  }

  .filter-hint {
    color: var(--text-tertiary);
    font-size: 0.85rem;
    font-style: italic;
    margin: 0;
  }

  .toggle-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .toggle-button {
    position: relative;
    flex: 1;
    padding: 0.5rem 1rem;
    padding-right: 2rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-button:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent-color);
  }

  .toggle-button.active {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
    font-weight: 600;
  }

  .blocker-badge {
    display: inline-block;
    background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
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
  
  .card-color-red .card-details,
  .card-color-blue .card-details,
  .card-color-green .card-details,
  .card-color-purple .card-details,
  .card-color-black .card-details,
  .card-color-yellow .card-details {
    color: white;
  }
  
  .card h3 {
    margin: 0 0 0.75rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .card-color-red h3,
  .card-color-blue h3,
  .card-color-green h3,
  .card-color-purple h3,
  .card-color-black h3,
  .card-color-yellow h3 {
    color: white;
  }
  
  .card p {
    margin: 0.2rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .card-color-red p,
  .card-color-blue p,
  .card-color-green p,
  .card-color-purple p,
  .card-color-black p,
  .card-color-yellow p {
    color: rgba(255, 255, 255, 0.95);
  }
  
  .card-color-red p strong,
  .card-color-blue p strong,
  .card-color-green p strong,
  .card-color-purple p strong,
  .card-color-black p strong,
  .card-color-yellow p strong {
    color: white;
  }
  
  .effect {
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-light);
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }
  
  .card-color-red .effect,
  .card-color-blue .effect,
  .card-color-green .effect,
  .card-color-purple .effect,
  .card-color-black .effect,
  .card-color-yellow .effect {
    color: rgba(255, 255, 255, 0.95);
    border-top-color: rgba(255, 255, 255, 0.3);
  }
  
  .card-color-red .effect strong,
  .card-color-blue .effect strong,
  .card-color-green .effect strong,
  .card-color-purple .effect strong,
  .card-color-black .effect strong,
  .card-color-yellow .effect strong {
    color: white;
  }

  h1 {
    color: var(--text-primary);
  }

  .results p {
    color: var(--text-secondary);
  }
</style>
