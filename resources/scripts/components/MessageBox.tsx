import * as React from 'react';
import tw, { TwStyle } from 'twin.macro';
import styled from 'styled-components/macro';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const styling = (type?: FlashMessageType): TwStyle | string => {
    switch (type) {
        case 'error':
            return tw`bg-red-600 border-red-800`;
        case 'info':
            return tw`bg-primary-600 border-primary-800`;
        case 'success':
            return tw`bg-green-600 border-green-800`;
        case 'warning':
            return tw`bg-yellow-600 border-yellow-800`;
        default:
            return '';
    }
};

const getBackground = (type?: FlashMessageType): TwStyle | string => {
    switch (type) {
        case 'error':
            return tw`bg-red-500`;
        case 'info':
            return tw`bg-primary-500`;
        case 'success':
            return tw`bg-green-500`;
        case 'warning':
            return tw`bg-yellow-500`;
        default:
            return '';
    }
};

const Container = styled.div<{ $type?: FlashMessageType }>`
    ${tw`p-3 border items-center leading-normal rounded-lg flex w-full text-sm text-white backdrop-blur-sm`};
    ${(props) => styling(props.$type)};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-width: 1px;
    transition: all 0.2s ease-in-out;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
`;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container css={tw`lg:inline-flex`} $type={type} role={'alert'}>
        {title && (
            <span
                className={'title'}
                css={[
                    tw`flex rounded-full uppercase px-3 py-1 text-xs font-bold mr-3 leading-none shadow-sm`,
                    getBackground(type),
                ]}
            >
                {title}
            </span>
        )}
        <span css={tw`mr-2 text-left flex-auto font-medium`}>{children}</span>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
