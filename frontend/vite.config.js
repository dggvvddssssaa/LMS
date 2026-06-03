import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true, // Bind to 0.0.0.0 — allows access from mobile/other devices on LAN
    },
    preview: {
        host: true,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.js',
        css: true,
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'webrtc-vendor': ['mediasoup-client', 'socket.io-client'],
                    'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit'],
                    'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
                }
            }
        }
    }
})

