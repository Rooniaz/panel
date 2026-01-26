import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`w-full flex items-center justify-center min-h-screen px-4 py-8`}
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%);
        pointer-events: none;
    }
`;

const LoginFormBox = styled.div`
    ${tw`w-full relative z-10 rounded-3xl p-8 md:p-10 border backdrop-blur-xl shadow-2xl`}
    max-width: 450px;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 
        0 25px 70px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        0 0 40px rgba(99, 102, 241, 0.1);
    transition: all 0.3s ease-in-out;

    ${breakpoint('sm')`
        max-width: 450px;
    `};
`;

const Title = styled.h2`
    ${tw`text-center mb-8 text-3xl md:text-4xl font-bold tracking-tight`}
    background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
    letter-spacing: -0.02em;
`;

const ErrorMessageContainer = styled.div`
    ${tw`mb-6`}
    animation: slideDown 0.3s ease-out;
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <LoginFormBox>
            <ErrorMessageContainer>
                <FlashMessageRender />
            </ErrorMessageContainer>
            {title && <Title>{title}</Title>}
            <Form {...props} ref={ref}>
                {props.children}
            </Form>
        </LoginFormBox>
    </Container>
));
