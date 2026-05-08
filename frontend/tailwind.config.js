/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563EB', // Trust / Education
                    foreground: '#FFFFFF',
                },
                accent: {
                    DEFAULT: '#22C55E',
                    foreground: '#FFFFFF',
                },
                neutral: {
                    DEFAULT: '#0F172A',
                }
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                heading: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
