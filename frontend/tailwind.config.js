/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Black + neon green dark theme palette
  			neon: {
  				DEFAULT: '#00ff88',
  				50: '#e6fff2',
  				100: '#b3ffd9',
  				200: '#80ffc0',
  				300: '#4dffa6',
  				400: '#1aff8d',
  				500: '#00ff88',
  				600: '#00cc6d',
  				700: '#009952',
  				800: '#006637',
  				900: '#00331c',
  				950: '#001a0e',
  			}
  		},
  		animation: {
  			'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
  			'fade-in': 'fade-in 0.4s ease-out',
  			'slide-up': 'slide-up 0.4s ease-out',
  			'glow': 'glow 2s ease-in-out infinite alternate',
  		},
  		keyframes: {
  			'neon-pulse': {
  				'0%, 100%': { opacity: '1', boxShadow: '0 0 8px var(--tw-shadow-color)' },
  				'50%': { opacity: '0.9', boxShadow: '0 0 16px var(--tw-shadow-color)' },
  			},
  			'fade-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			'slide-up': {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'glow': {
  				'0%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.4)' },
  				'100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.7)' },
  			},
  		},
  		boxShadow: {
  			'neon': '0 0 15px rgba(0, 255, 136, 0.4)',
  			'neon-lg': '0 0 25px rgba(0, 255, 136, 0.5)',
  			'neon-sm': '0 0 8px rgba(0, 255, 136, 0.3)',
  		},
  	},
  },
  plugins: [require("tailwindcss-animate")],
};
