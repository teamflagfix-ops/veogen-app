import type { Config } from 'tailwindcss'

export default {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#000000',
                foreground: '#ffffff',
                card: 'rgba(255, 255, 255, 0.03)',
                border: 'rgba(255, 255, 255, 0.08)',
                primary: {
                    DEFAULT: '#7c3aed',
                    foreground: '#ffffff',
                },
                accent: {
                    DEFAULT: '#d946ef',
                    foreground: '#ffffff',
                },
                muted: {
                    DEFAULT: '#27272a',
                    foreground: '#a1a1aa',
                },
            },
            fontFamily: {
                heading: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
} satisfies Config
