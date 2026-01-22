import React, { useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const ToastContainer = styled.div<{ $show: boolean; $type: 'success' | 'error' }>`
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 50;
    border-radius: 0.75rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 280px;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    ${(props) =>
        props.$show
            ? `
                opacity: 1;
                transform: translateY(0);
            `
            : `
                opacity: 0;
                transform: translateY(-1rem);
                pointer-events: none;
            `}
    ${(props) =>
        props.$type === 'success'
            ? `
                background: linear-gradient(to right, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9));
                color: white;
                border: 1px solid rgba(34, 197, 94, 0.3);
            `
            : `
                background: linear-gradient(to right, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
                color: white;
                border: 1px solid rgba(239, 68, 68, 0.3);
            `}
`;

const IconContainer = styled.div<{ $type: 'success' | 'error' }>`
    display: inline-flex;
    height: 1.5rem;
    width: 1.5rem;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

interface Props {
    show: boolean;
    type?: 'success' | 'error';
    children: React.ReactNode;
    onClose?: () => void;
    duration?: number;
}

export default ({ show, type = 'success', children, onClose, duration = 3000 }: Props) => {
    useEffect(() => {
        if (show && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [show, onClose, duration]);

    if (!show) return null;

    return (
        <ToastContainer $show={show} $type={type}>
            <IconContainer $type={type}>
                {type === 'success' ? (
                    <FontAwesomeIcon icon={faCheck} className={'text-xs'} />
                ) : (
                    <FontAwesomeIcon icon={faExclamationCircle} className={'text-xs'} />
                )}
            </IconContainer>
            {children}
        </ToastContainer>
    );
};
