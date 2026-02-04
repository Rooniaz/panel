import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';

export default createGlobalStyle`
    * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
    }

    body {
        ${tw`font-sans text-neutral-200`};
        letter-spacing: 0.015em;
        font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
        background: 
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%);
        background-size: 100% 100%, 100% 100%, 100% 100%, 200% 200%;
        background-attachment: fixed;
        animation: gradientShift 20s ease infinite;
        position: relative;
        min-height: 100vh;
        
        &::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.06) 0%, transparent 40%);
            pointer-events: none;
            z-index: 0;
            animation: float 15s ease-in-out infinite;
        }
        
        &::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.05), transparent),
                radial-gradient(2px 2px at 60% 70%, rgba(59, 130, 246, 0.1), transparent),
                radial-gradient(1px 1px at 50% 50%, rgba(99, 102, 241, 0.08), transparent),
                radial-gradient(1px 1px at 80% 10%, rgba(139, 92, 246, 0.06), transparent);
            background-size: 200% 200%, 200% 200%, 100% 100%, 100% 100%;
            background-position: 0% 0%, 100% 100%, 50% 50%, 80% 10%;
            animation: particleMove 25s linear infinite;
            pointer-events: none;
            z-index: 0;
        }
    }
    
    @keyframes gradientShift {
        0%, 100% {
            background-position: 0% 50%, 100% 50%, 50% 50%, 0% 0%;
        }
        50% {
            background-position: 100% 50%, 0% 50%, 50% 50%, 100% 100%;
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.8;
        }
        66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.9;
        }
    }
    
    @keyframes particleMove {
        0% {
            background-position: 0% 0%, 100% 100%, 50% 50%, 80% 10%;
        }
        100% {
            background-position: 100% 100%, 0% 0%, 50% 50%, 20% 90%;
        }
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium tracking-normal font-header`};
    }

    p {
        ${tw`text-neutral-200 leading-snug font-sans`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scroll Bar Style */
    ::-webkit-scrollbar {
        background: none;
        width: 16px;
        height: 16px;
    }

    ::-webkit-scrollbar-thumb {
        border: solid 0 rgb(0 0 0 / 0%);
        border-right-width: 4px;
        border-left-width: 4px;
        -webkit-border-radius: 9px 4px;
        -webkit-box-shadow: inset 0 0 0 1px hsl(211, 10%, 53%), inset 0 0 0 4px hsl(209deg 18% 30%);
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-thumb:horizontal {
        border-right-width: 0;
        border-left-width: 0;
        border-top-width: 4px;
        border-bottom-width: 4px;
        -webkit-border-radius: 4px 9px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
