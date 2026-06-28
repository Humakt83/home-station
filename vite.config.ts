import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	server: {
		port: 5173,
		host: 'localhost',
		proxy: {
			'/station/api': {
				target: 'http://localhost:3000',
				secure: false,
				changeOrigin: false,
				ws: true,
				configure: (proxy) => {
					proxy.on('error', (err) => console.log('proxy error', err));
					proxy.on('proxyReq', (proxyReq, req) => {
						console.log('Sending Request to the Target:', req.method, req.url, proxyReq.host);
					});
					proxy.on('proxyRes', (proxyRes, req) => {
						console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
					});
				}
			}
		}
	}
});
