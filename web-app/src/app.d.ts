// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		dataLayer: any[];
		gapi?: {
			load: (api: string, callback: () => void) => void;
			client?: {
				init: (config: any) => Promise<void>;
			};
		};
		google?: {
			accounts: {
				id: {
					initialize: (config: any) => void;
				};
				oauth2: {
					initTokenClient: (config: any) => {
						requestAccessToken: () => void;
					};
				};
			};
		};
	}
}

export {};
