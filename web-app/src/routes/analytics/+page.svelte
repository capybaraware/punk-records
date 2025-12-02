<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const GA_TRACKING_ID = 'G-N9JW1TDT1X';

	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let analyticsData = $state<any>(null);
	let dateRange = $state('7'); // Default to last 7 days

	onMount(() => {
		if (browser) {
			fetchAnalyticsData();
		}
	});

	async function fetchAnalyticsData() {
		try {
			isLoading = true;
			const response = await fetch(`/api/analytics?days=${dateRange}`);

			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch (e) {
					const errorText = await response.text();
					errorMessage = errorText || errorMessage;
				}
				throw new Error(errorMessage);
			}

			analyticsData = await response.json();
			console.log('Analytics data received:', analyticsData);
			isLoading = false;
		} catch (err: any) {
			console.error('Failed to fetch analytics:', err);
			error = err.message || 'Failed to fetch analytics data';
			isLoading = false;
		}
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function formatDuration(seconds: number): string {
		if (!seconds || isNaN(seconds) || seconds === 0) {
			return '0m 0s';
		}
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	}

	// Parse GA4 date format (YYYYMMDD) to Date object
	function parseGADate(dateStr: string): Date | null {
		if (!dateStr || dateStr.length !== 8) return null;
		const year = parseInt(dateStr.substring(0, 4));
		const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
		const day = parseInt(dateStr.substring(6, 8));
		return new Date(year, month, day);
	}

	// Format GA4 date for display
	function formatGADate(dateStr: string): string {
		const date = parseGADate(dateStr);
		if (!date || isNaN(date.getTime())) return dateStr;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Process analytics data
	let processedData = $derived(
		analyticsData
			? {
					// Overview metrics
					totals: (() => {
						const rows = analyticsData.overview?.rows || [];
						let totalSessions = 0;
						let totalPageViews = 0;
						let totalDuration = 0;
						let durationCount = 0;

						rows.forEach((row: any) => {
							const metrics = row.metricValues || [];
							totalSessions += parseInt(metrics[1]?.value || '0');
							totalPageViews += parseInt(metrics[2]?.value || '0');
							const duration = parseFloat(metrics[3]?.value || '0');
							if (!isNaN(duration) && duration > 0) {
								totalDuration += duration;
								durationCount++;
							}
						});

						return {
							sessions: totalSessions,
							pageViews: totalPageViews,
							totalDuration: totalDuration,
							durationCount: durationCount,
						};
					})(),
					// Sessions over time
					sessionsByDate:
						analyticsData.overview?.rows?.reduce((acc: any, row: any) => {
							const date = row.dimensionValues?.[0]?.value || '';
							const sessions = parseInt(row.metricValues?.[1]?.value || '0');
							if (!acc[date]) {
								acc[date] = 0;
							}
							acc[date] += sessions;
							return acc;
						}, {}) || {},
					// Popular pages
					popularPages:
						analyticsData.overview?.rows?.reduce((acc: any, row: any) => {
							const path = row.dimensionValues?.[1]?.value || '/';
							const views = parseInt(row.metricValues?.[2]?.value || '0');
							if (!acc[path]) {
								acc[path] = 0;
							}
							acc[path] += views;
							return acc;
						}, {}) || {},
					// Acquisition (traffic sources)
					acquisition:
						analyticsData.acquisition?.rows?.reduce((acc: any, row: any) => {
							const date = row.dimensionValues?.[0]?.value || '';
							const source = row.dimensionValues?.[1]?.value || 'direct';
							const sessions = parseInt(row.metricValues?.[0]?.value || '0');
							if (!acc[date]) {
								acc[date] = {};
							}
							acc[date][source] = (acc[date][source] || 0) + sessions;
							return acc;
						}, {}) || {},
					// Countries
					countries:
						analyticsData.countries?.rows?.map((row: any) => ({
							country: row.dimensionValues?.[0]?.value || 'Unknown',
							sessions: parseInt(row.metricValues?.[0]?.value || '0'),
						})) || [],
					// Devices
					devices:
						analyticsData.devices?.rows?.map((row: any) => ({
							device: row.dimensionValues?.[0]?.value || 'unknown',
							sessions: parseInt(row.metricValues?.[0]?.value || '0'),
						})) || [],
				}
			: null
	);

	// Calculate average session duration
	let avgSessionDuration = $derived(
		processedData?.totals.durationCount && processedData.totals.durationCount > 0
			? processedData.totals.totalDuration / processedData.totals.durationCount
			: 0
	);

	// Get sessions by date as array for chart
	let sessionsByDateArray = $derived(
		processedData?.sessionsByDate
			? Object.entries(processedData.sessionsByDate)
					.map(([date, sessions]) => ({ date, sessions: sessions as number }))
					.sort((a, b) => a.date.localeCompare(b.date))
			: []
	);

	// Get top pages sorted
	let topPagesArray = $derived(
		processedData?.popularPages
			? Object.entries(processedData.popularPages)
					.map(([path, pageviews]) => ({ path, pageviews: pageviews as number }))
					.sort((a, b) => b.pageviews - a.pageviews)
					.slice(0, 10)
			: []
	);

	// Get acquisition data for stacked chart
	let acquisitionByDate = $derived(
		processedData?.acquisition
			? Object.entries(processedData.acquisition)
					.map(([date, sources]: [string, any]) => ({
						date,
						sources: Object.entries(sources).map(([source, sessions]) => ({
							source,
							sessions: sessions as number,
						})),
					}))
					.sort((a, b) => a.date.localeCompare(b.date))
			: []
	);

	// Get total sessions for device percentage calculation
	let totalDeviceSessions = $derived(
		processedData?.devices
			? processedData.devices.reduce((sum: number, d: any) => sum + d.sessions, 0)
			: 0
	);

	// Helper functions
	function getSourceColor(source: string): string {
		const colors: Record<string, string> = {
			direct: '#0078d4',
			'google / organic': '#4285f4',
			'google / cpc': '#34a853',
			email: '#ea4335',
			social: '#fbbc04',
		};
		return colors[source.toLowerCase()] || '#6c757d';
	}

	function formatSourceName(source: string): string {
		if (source === '(direct) / (none)') return 'Direct';
		return source.split(' / ').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ');
	}

	function getUniqueSources(acquisition: any[]): string[] {
		const sources = new Set<string>();
		acquisition.forEach((day) => {
			day.sources.forEach((s: any) => sources.add(s.source));
		});
		return Array.from(sources);
	}

	function getDeviceColor(device: string): string {
		const colors: Record<string, string> = {
			desktop: '#0078d4',
			mobile: '#4285f4',
			tablet: '#34a853',
		};
		return colors[device.toLowerCase()] || '#6c757d';
	}
</script>

<svelte:head>
	<title>Analytics - One Piece Card Search</title>
</svelte:head>

<div class="analytics-container">
	<div class="analytics-header">
		<div class="header-left">
			<a href="/" class="back-link">← Back to Card Search</a>
			<h1>Analytics Dashboard</h1>
		</div>
		<div class="header-controls">
			<select bind:value={dateRange} on:change={fetchAnalyticsData} class="date-select">
				<option value="7">Last 7 days</option>
				<option value="30">Last 30 days</option>
				<option value="90">Last 90 days</option>
			</select>
		</div>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading analytics data...</p>
		</div>
	{:else if error}
		<div class="error-message">
			<h3>Error</h3>
			<p>{error}</p>
		</div>
	{:else if processedData}
		<div class="dashboard-grid">
			<!-- Audience Overview -->
			<div class="dashboard-card audience-overview">
				<h2>Audience overview</h2>
				<div class="metrics-row">
					<div class="metric-item">
						<div class="metric-label">Sessions</div>
						<div class="metric-value-large">{formatNumber(processedData.totals.sessions)}</div>
					</div>
					<div class="metric-item">
						<div class="metric-label">Session duration</div>
						<div class="metric-value-large">{formatDuration(avgSessionDuration)}</div>
					</div>
				</div>
				<div class="chart-container">
					<div class="line-chart">
						<svg class="chart-svg" viewBox="0 0 400 200">
							<!-- Grid lines -->
							<line x1="10" y1="10" x2="10" y2="190" stroke="#e1dfdd" stroke-width="1" />
							<line x1="10" y1="190" x2="390" y2="190" stroke="#e1dfdd" stroke-width="1" />
							{#if sessionsByDateArray.length > 0}
								{@const maxSessions = Math.max(...sessionsByDateArray.map((d) => d.sessions), 1)}
								{#each sessionsByDateArray as item, i}
									{@const x = sessionsByDateArray.length > 1 ? (i / (sessionsByDateArray.length - 1)) * 380 + 10 : 200}
									{@const y = 190 - (item.sessions / maxSessions) * 170}
									{#if i > 0}
										{@const prevX = sessionsByDateArray.length > 1 ? ((i - 1) / (sessionsByDateArray.length - 1)) * 380 + 10 : 200}
										{@const prevY = 190 - (sessionsByDateArray[i - 1].sessions / maxSessions) * 170}
										<line x1={prevX} y1={prevY} x2={x} y2={y} stroke="#0078d4" stroke-width="2" />
									{/if}
									<circle cx={x} cy={y} r="4" fill="#0078d4" />
								{/each}
							{/if}
						</svg>
						<div class="chart-labels">
							{#if sessionsByDateArray.length > 0}
								{#each sessionsByDateArray.slice(-5) as item}
									<div class="chart-label">
										{formatGADate(item.date)}
									</div>
								{/each}
							{:else}
								<div class="chart-label"></div>
								<div class="chart-label"></div>
								<div class="chart-label"></div>
								<div class="chart-label"></div>
								<div class="chart-label"></div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Popular Pages -->
			<div class="dashboard-card popular-pages">
				<h2>Popular pages</h2>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Page</th>
								<th>Pageviews</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each topPagesArray as page}
								<tr>
									<td class="page-path">{page.path || '/'}</td>
									<td class="pageviews">{formatNumber(page.pageviews)}</td>
									<td class="actions">
										<button class="action-btn" title="View details">🔍</button>
									</td>
								</tr>
							{/each}
							{#if topPagesArray.length === 0}
								{#each Array(5) as _}
									<tr>
										<td class="page-path">—</td>
										<td class="pageviews">—</td>
										<td class="actions"></td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Sessions by Country -->
			<div class="dashboard-card sessions-country">
				<h2>Sessions by country</h2>
				<div class="country-list">
					{#if processedData.countries.length > 0}
						{#each processedData.countries.slice(0, 10) as country}
							{@const percentage = (country.sessions / processedData.totals.sessions) * 100}
							<div class="country-item">
								<div class="country-name">{country.country}</div>
								<div class="country-bar-container">
									<div class="country-bar" style="width: {percentage}%"></div>
								</div>
								<div class="country-sessions">{formatNumber(country.sessions)}</div>
								<button class="action-btn" title="View details">🔍</button>
							</div>
						{/each}
					{:else}
						{#each Array(5) as _}
							<div class="country-item">
								<div class="country-name">—</div>
								<div class="country-bar-container">
									<div class="country-bar" style="width: 0%"></div>
								</div>
								<div class="country-sessions">—</div>
								<button class="action-btn" title="View details" disabled>🔍</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Sessions by Device -->
			<div class="dashboard-card sessions-device">
				<h2>Sessions by device</h2>
				<div class="device-chart-container">
					<div class="donut-chart">
						<svg class="donut-svg" viewBox="0 0 200 200">
							{#if processedData.devices.length > 0}
								{@const devicePaths = (() => {
									const radius = 70;
									const centerX = 100;
									const centerY = 100;
									let currentAngle = -90;
									return processedData.devices.map((device: any) => {
										const percentage = (device.sessions / totalDeviceSessions) * 100;
										const angle = (percentage / 100) * 360;
										const startAngle = currentAngle;
										const endAngle = currentAngle + angle;
										const largeArc = angle > 180 ? 1 : 0;
										const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
										const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
										const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
										const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
										const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
										currentAngle = endAngle;
										return { device, path, color: getDeviceColor(device.device) };
									});
								})()}
								{#each devicePaths as { device, path, color }}
									<path d={path} fill={color} stroke="white" stroke-width="2" />
								{/each}
							{:else}
								<!-- Empty donut - just a circle -->
								<circle cx="100" cy="100" r="70" fill="#f3f2f1" stroke="#e1dfdd" stroke-width="2" />
							{/if}
						</svg>
						<div class="device-legend">
							{#if processedData.devices.length > 0}
								{#each processedData.devices as device}
									{@const percentage = (device.sessions / totalDeviceSessions) * 100}
									<div class="device-item">
										<span class="device-color" style="background-color: {getDeviceColor(device.device)}"></span>
										<span class="device-name">{device.device}</span>
										<span class="device-percentage">{percentage.toFixed(2)}%</span>
										<span class="device-sessions">({formatNumber(device.sessions)})</span>
										<button class="action-btn" title="View details">🔍</button>
									</div>
								{/each}
							{:else}
								<div class="device-item">
									<span class="device-color" style="background-color: #f3f2f1"></span>
									<span class="device-name">—</span>
									<span class="device-percentage">—</span>
									<span class="device-sessions">—</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.analytics-container {
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem;
		background: #f5f5f5;
		min-height: 100vh;
	}

	.analytics-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.back-link {
		font-size: 0.9rem;
		color: #0078d4;
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #005a9e;
		text-decoration: underline;
	}

	.analytics-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #323130;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.date-select {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d1d1;
		border-radius: 4px;
		background: white;
		font-size: 0.9rem;
		cursor: pointer;
		color: #323130;
		appearance: auto;
		-webkit-appearance: menulist;
		-moz-appearance: menulist;
		position: relative;
		z-index: 1;
	}

	.date-select:focus {
		outline: 2px solid #0078d4;
		outline-offset: 2px;
		border-color: #0078d4;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #e1dfdd;
		border-top-color: #0078d4;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.dashboard-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.dashboard-card h2 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #323130;
	}

	.report-subtitle {
		font-size: 0.85rem;
		color: #605e5c;
		margin-bottom: 1rem;
	}

	.audience-overview {
		grid-column: 1;
		grid-row: 1;
	}

	.popular-pages {
		grid-column: 2;
		grid-row: 1;
	}

	.sessions-country {
		grid-column: 1;
		grid-row: 2;
	}

	.sessions-device {
		grid-column: 2;
		grid-row: 2;
	}

	.metrics-row {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.metric-item {
		flex: 1;
	}

	.metric-label {
		font-size: 0.85rem;
		color: #605e5c;
		margin-bottom: 0.5rem;
	}

	.metric-value-large {
		font-size: 2rem;
		font-weight: 600;
		color: #323130;
	}

	.chart-container {
		margin-top: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.chart-svg {
		width: 100%;
		height: 200px;
	}

	.chart-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #605e5c;
	}

	.stacked-bar-chart {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}

	.bars-container {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		gap: 0.5rem;
		height: 200px;
	}

	.bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		justify-content: flex-end;
	}

	.stacked-bar {
		width: 100%;
		display: flex;
		flex-direction: column-reverse;
		border-radius: 4px 4px 0 0;
		overflow: hidden;
	}

	.bar-segment {
		width: 100%;
	}

	.bar-label {
		font-size: 0.75rem;
		color: #605e5c;
		margin-top: 0.5rem;
	}

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.legend-label {
		color: #605e5c;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		border-bottom: 2px solid #e1dfdd;
	}

	th {
		text-align: left;
		padding: 0.75rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: #605e5c;
	}

	td {
		padding: 0.75rem 0;
		border-bottom: 1px solid #f3f2f1;
		font-size: 0.9rem;
	}

	.page-path {
		font-family: monospace;
		color: #323130;
	}

	.pageviews {
		font-weight: 600;
		color: #323130;
	}

	.actions {
		text-align: right;
	}

	.action-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.action-btn:hover {
		opacity: 1;
	}

	.country-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.country-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.country-name {
		min-width: 150px;
		font-size: 0.9rem;
		color: #323130;
	}

	.country-bar-container {
		flex: 1;
		height: 24px;
		background: #f3f2f1;
		border-radius: 4px;
		overflow: hidden;
	}

	.country-bar {
		height: 100%;
		background: #0078d4;
		border-radius: 4px;
	}

	.country-sessions {
		min-width: 100px;
		text-align: right;
		font-weight: 600;
		color: #323130;
	}

	.device-chart-container {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.donut-chart {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.donut-svg {
		width: 200px;
		height: 200px;
	}

	.device-legend {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.device-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.device-color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
	}

	.device-name {
		flex: 1;
		font-size: 0.9rem;
		color: #323130;
		text-transform: capitalize;
	}

	.device-percentage {
		font-weight: 600;
		color: #323130;
		min-width: 60px;
		text-align: right;
	}

	.device-sessions {
		font-size: 0.85rem;
		color: #605e5c;
		min-width: 100px;
	}

	.no-data {
		color: #605e5c;
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.audience-overview,
		.popular-pages,
		.sessions-country,
		.sessions-device {
			grid-column: 1;
		}
	}

	@media (max-width: 640px) {
		.analytics-container {
			padding: 1rem;
		}

		.analytics-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.metrics-row {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
