import React, { useState } from 'react';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLandmark, faWallet, faClock } from '@fortawesome/free-solid-svg-icons';
import TermsModal from './TermsModal';
import BankTab from './BankTab';
import TrueMoneyTab from './TrueMoneyTab';
import HistoryTab from './HistoryTab';

const Container = styled.div`
    ${tw`min-h-screen py-4 sm:py-6 lg:py-8 lg:ml-64 flex items-center justify-center relative`}
    background: transparent;
    position: relative;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
    }
`;
Container.displayName = 'TopupContainer.Container';

const InnerContainer = styled.div`
    ${tw`max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full`}
`;
InnerContainer.displayName = 'TopupContainer.InnerContainer';

const SelectionCard = styled.div<{ $selected: boolean }>`
    ${tw`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 transition-all duration-300 cursor-pointer flex flex-col h-full w-full`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 2px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

    ${({ $selected }) =>
        $selected
            ? css`
                  border-color: rgba(59, 130, 246, 0.5);
                  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(59, 130, 246, 0.2);
                  transform: translateY(-4px);
              `
            : css`
                  &:hover {
                      border-color: rgba(59, 130, 246, 0.3);
                      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2),
                          inset 0 1px 0 rgba(255, 255, 255, 0.12);
                      transform: translateY(-2px);
                  }
              `}
`;
SelectionCard.displayName = 'TopupContainer.SelectionCard';

const CardIcon = styled.div`
    ${tw`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl mb-4 sm:mb-6 mx-auto`}
    background: linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
`;
CardIcon.displayName = 'TopupContainer.CardIcon';

const CardTitle = styled.h2`
    ${tw`text-xl sm:text-2xl font-bold text-white text-center mb-2 sm:mb-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;
CardTitle.displayName = 'TopupContainer.CardTitle';

const CardDescription = styled.p`
    ${tw`text-neutral-400 text-center text-xs sm:text-sm leading-relaxed flex-grow`}
`;
CardDescription.displayName = 'TopupContainer.CardDescription';

const OptionsGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 items-stretch`}
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
`;
OptionsGrid.displayName = 'TopupContainer.OptionsGrid';

const ContentWrapper = styled.div`
    ${tw`mt-8`}
`;
ContentWrapper.displayName = 'TopupContainer.ContentWrapper';

const BankWrapper = styled.div`
    ${tw`w-full`}
`;
BankWrapper.displayName = 'TopupContainer.BankWrapper';

const TrueMoneyWrapper = styled.div`
    ${tw`max-w-3xl mx-auto`}
`;
TrueMoneyWrapper.displayName = 'TopupContainer.TrueMoneyWrapper';

const HistoryWrapper = styled.div`
    ${tw`max-w-5xl mx-auto`}
`;
HistoryWrapper.displayName = 'TopupContainer.HistoryWrapper';

type MethodType = 'bank' | 'truemoney' | 'history' | null;

const TopupContainer = () => {
    const [selectedMethod, setSelectedMethod] = useState<MethodType>(null);
    const [showTermsModal, setShowTermsModal] = useState(false);

    if (selectedMethod === 'bank') {
        return (
            <Container>
                <InnerContainer>
                    <BankWrapper>
                        <BankTab
                            onShowTerms={() => setShowTermsModal(true)}
                            onNavigateToBank={() => setSelectedMethod('bank')}
                            onNavigateToTrueMoney={() => setSelectedMethod('truemoney')}
                            onNavigateToHistory={() => setSelectedMethod('history')}
                            activeTab='bank'
                        />
                    </BankWrapper>
                </InnerContainer>
                {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
            </Container>
        );
    }

    if (selectedMethod === 'truemoney') {
        return (
            <Container>
                <InnerContainer>
                    <TrueMoneyWrapper>
                        <TrueMoneyTab
                            onShowTerms={() => setShowTermsModal(true)}
                            onNavigateToBank={() => setSelectedMethod('bank')}
                            onNavigateToTrueMoney={() => setSelectedMethod('truemoney')}
                            onNavigateToHistory={() => setSelectedMethod('history')}
                            activeTab='truemoney'
                        />
                    </TrueMoneyWrapper>
                </InnerContainer>
                {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
            </Container>
        );
    }

    if (selectedMethod === 'history') {
        return (
            <Container>
                <InnerContainer>
                    <HistoryWrapper>
                        <HistoryTab
                            onNavigateToBank={() => setSelectedMethod('bank')}
                            onNavigateToTrueMoney={() => setSelectedMethod('truemoney')}
                            onNavigateToHistory={() => setSelectedMethod('history')}
                            activeTab='history'
                        />
                    </HistoryWrapper>
                </InnerContainer>
            </Container>
        );
    }

    return (
        <Container>
            <InnerContainer>
                <OptionsGrid>
                    <SelectionCard $selected={false} onClick={() => setSelectedMethod('bank')}>
                        <CardIcon>
                            <FontAwesomeIcon icon={faLandmark} />
                        </CardIcon>
                        <CardTitle>เติมเงินผ่านธนาคาร</CardTitle>
                        <CardDescription>
                            โอนเงินผ่านธนาคารและอัปโหลดสลิปโอนเงินเพื่อเติมเครดิตเข้าบัญชี
                        </CardDescription>
                    </SelectionCard>

                    <SelectionCard $selected={false} onClick={() => setSelectedMethod('truemoney')}>
                        <CardIcon>
                            <FontAwesomeIcon icon={faWallet} />
                        </CardIcon>
                        <CardTitle>เติมเงินผ่าน TrueMoney</CardTitle>
                        <CardDescription>ใช้ลิงก์ซอง TrueMoney เพื่อเติมเครดิตเข้าบัญชีได้ทันที</CardDescription>
                    </SelectionCard>

                    <SelectionCard $selected={false} onClick={() => setSelectedMethod('history')}>
                        <CardIcon>
                            <FontAwesomeIcon icon={faClock} />
                        </CardIcon>
                        <CardTitle>ประวัติเติมเงิน</CardTitle>
                        <CardDescription>ดูประวัติการเติมเงินทั้งหมดของคุณ</CardDescription>
                    </SelectionCard>
                </OptionsGrid>
            </InnerContainer>
        </Container>
    );
};

export default TopupContainer;
