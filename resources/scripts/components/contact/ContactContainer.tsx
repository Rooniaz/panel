import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
    ${tw`flex items-center justify-center relative lg:ml-64 lg:pt-32 min-h-screen`}
    background: radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
`;

const ContactCard = styled.div`
    ${tw`rounded-2xl p-10 max-w-lg w-full relative z-10`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, 
            transparent 0%,
            rgba(59, 130, 246, 0.5) 25%,
            rgba(139, 92, 246, 0.5) 75%,
            transparent 100%
        );
        animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
`;

const HeaderIcon = styled.div`
    ${tw`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-6 relative`}
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
    box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: perspective(1000px) rotateY(0deg);
    transition: transform 0.3s ease;

    &:hover {
        transform: perspective(1000px) rotateY(5deg) scale(1.05);
    }

    &::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: inherit;
        padding: 2px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    &:hover::after {
        opacity: 0.5;
    }
`;

const Title = styled.h1`
    ${tw`text-4xl font-bold text-center mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent`}
    letter-spacing: -0.02em;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
`;

const Description = styled.p`
    ${tw`text-neutral-300 text-center mb-2 text-base leading-relaxed`}
`;

const Note = styled.p`
    ${tw`text-neutral-400 text-sm text-center mb-8 italic`}
`;

const ButtonsContainer = styled.div`
    ${tw`flex flex-col sm:flex-row gap-4`}
`;

const ContactButton = styled.a<{ $variant: 'facebook' | 'discord' }>`
    ${tw`flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 relative overflow-hidden`}
    ${(props) =>
        props.$variant === 'facebook'
            ? tw`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white`
            : tw`bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white`}
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
    }

    &:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    &:hover::before {
        left: 100%;
    }

    &:active {
        transform: translateY(-1px) scale(0.98);
    }
`;

const ButtonIcon = styled.div`
    ${tw`text-2xl relative z-10`}
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
`;

const ButtonText = styled.span`
    ${tw`text-lg relative z-10`}
    font-weight: 600;
    letter-spacing: 0.02em;
`;

export default () => {
    return (
        <Container>
            <ContactCard>
                <HeaderIcon>
                    <FontAwesomeIcon icon={faHeadset} />
                </HeaderIcon>
                <Title>ช่องทางการติดต่อ</Title>
                <Description>สามารถติดต่อเราได้ที่ช่องทางต่อไปนี้หากพบปัญหาต่าง ๆ</Description>
                <Note>(ขอความกรุณารอสักครู่ก่อนที่จะได้รับการตอบกลับ)</Note>
                <ButtonsContainer>
                    <ContactButton $variant='facebook' href='https://facebook.com' target='_blank' rel='noreferrer' className='group'>
                        <ButtonIcon>
                            <span className={'text-2xl font-bold'}>f</span>
                        </ButtonIcon>
                        <ButtonText>Facebook</ButtonText>
                    </ContactButton>
                    <ContactButton $variant='discord' href='https://discord.gg/zajKr6bgS4' target='_blank' rel='noreferrer' className='group'>
                        <ButtonIcon>
                            <svg
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='currentColor'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z' />
                            </svg>
                        </ButtonIcon>
                        <ButtonText>Discord</ButtonText>
                    </ContactButton>
                </ButtonsContainer>
            </ContactCard>
        </Container>
    );
};
