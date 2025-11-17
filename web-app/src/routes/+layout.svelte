<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	
	let isDark = $state(true);

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
			localStorage.setItem('theme', theme);
		}
	}

	onMount(() => {
		if (browser) {
			// Get theme from localStorage or default to dark
			const stored = localStorage.getItem('theme');
			const theme = stored || 'dark';
			isDark = theme === 'dark';
			document.documentElement.setAttribute('data-theme', theme);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="theme-toggle-container">
	<button
		class="theme-toggle"
		onclick={toggleTheme}
		aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if isDark}
			☀️
		{:else}
			🌙
		{/if}
	</button>
</div>

{@render children()}

<style>
	/* CSS Variables for Light Theme */
	:global(html[data-theme="light"]) {
		--bg-primary: #ffffff;
		--bg-secondary: #f8f9fa;
		--bg-tertiary: #f5f7fa;
		--text-primary: #1a1a1a;
		--text-secondary: #4a4a4a;
		--text-tertiary: #666666;
		--border-color: #eaeaea;
		--border-light: #f0f0f0;
		--shadow-color: rgba(0, 0, 0, 0.08);
		--shadow-hover: rgba(0, 0, 0, 0.12);
		--shadow-modal: rgba(0, 0, 0, 0.3);
		--accent-color: #3498db;
		--accent-hover: #2980b9;
		--accent-light: rgba(52, 152, 219, 0.1);
		--modal-overlay: rgba(0, 0, 0, 0.8);
		--card-bg: #ffffff;
		--card-placeholder-start: #f5f7fa;
		--card-placeholder-end: #e4e8eb;
	}

	/* CSS Variables for Dark Theme (Default) */
	:global(html[data-theme="dark"]) {
		--bg-primary: #121212;
		--bg-secondary: #1e1e1e;
		--bg-tertiary: #2a2a2a;
		--text-primary: #e0e0e0;
		--text-secondary: #b0b0b0;
		--text-tertiary: #888888;
		--border-color: #333333;
		--border-light: #2a2a2a;
		--shadow-color: rgba(0, 0, 0, 0.4);
		--shadow-hover: rgba(0, 0, 0, 0.6);
		--shadow-modal: rgba(0, 0, 0, 0.8);
		--accent-color: #5dade2;
		--accent-hover: #3498db;
		--accent-light: rgba(93, 173, 226, 0.15);
		--modal-overlay: rgba(0, 0, 0, 0.9);
		--card-bg: #1e1e1e;
		--card-placeholder-start: #2a2a2a;
		--card-placeholder-end: #333333;
	}

	:global(html) {
		color-scheme: dark light;
	}

	:global(body) {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	.theme-toggle-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 100;
	}

	.theme-toggle {
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.5rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--shadow-color);
	}

	.theme-toggle:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px var(--shadow-color);
	}

	.theme-toggle:active {
		transform: scale(0.95);
	}

	@media (max-width: 640px) {
		.theme-toggle-container {
			top: 0.5rem;
			right: 0.5rem;
		}

		.theme-toggle {
			width: 2.5rem;
			height: 2.5rem;
			font-size: 1.2rem;
		}
	}
</style>
