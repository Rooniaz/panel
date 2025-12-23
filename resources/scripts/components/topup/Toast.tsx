import React, { useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const ToastContainer = styled.div<{ $show: boolean; $type: 'success' | 'error' }>`
    ${tw`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg flex items-center gap-2 transition-all duration-300`}
    ${(props) => (props.$show ? tw`opacity-100 translate-y-0` : tw`opacity-0 translate-y-4 pointer-events-none`)}
    ${(props) => (props.$type === 'success' ? tw`bg-black/80 text-white` : tw`bg-red-600 text-white`)}
`;

const IconContainer = styled.div<{ $type: 'success' | 'error' }>`
    ${tw`inline-flex h-5 w-5 items-center justify-center rounded-full`}
    ${(props) => (props.$type === 'success' ? tw`bg-green-500 text-black` : tw`bg-white/90 text-red-700`)}
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
