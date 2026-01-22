import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faClock } from '@fortawesome/free-solid-svg-icons';
import TermsModal from './TermsModal';
import BankTab from './BankTab';
import TrueMoneyTab from './TrueMoneyTab';
import HistoryTab from './HistoryTab';

const Container = styled.div`
    ${tw`min-h-screen bg-[#0c1226] py-8 lg:ml-64`}
`;

const ContentGrid = styled.div`
    ${tw`grid grid-cols-1 lg:grid-cols-3 gap-6`}
`;

const MainPanel = styled.div`
    ${tw`lg:col-span-2 space-y-6`}
`;

const SidePanel = styled.div`
    ${tw`lg:col-span-1`}
`;

const TabContainer = styled.div`
    ${tw`flex items-center space-x-3 mb-8 flex-wrap gap-3`}
`;

const TabButton = styled.button<{ $active: boolean }>`
    ${tw`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 relative overflow-hidden`}
    ${({ $active }) =>
        $active
            ? `
                background: linear-gradient(135deg, #3b82f6, #22d3ee);
                color: white;
                box-shadow: 0 8px 25px rgba(34,211,238,.35), 0 0 0 1px rgba(56, 189, 248, 0.2);
                transform: translateY(-2px);
            `
            : `
                background: rgba(31, 41, 55, 0.8);
                color: #9ca3af;
                border: 1px solid rgba(255, 255, 255, 0.1);
                &:hover {
                    background: rgba(55, 65, 81, 0.9);
                    color: white;
                    border-color: rgba(56, 189, 248, 0.3);
                    transform: translateY(-1px);
                }
            `}
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s;
    }
    
    &:hover::before {
        left: 100%;
    }
`;

const ViewRatesButton = styled.button`
    ${tw`ml-auto px-4 py-2 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 rounded-lg text-neutral-300 transition-all duration-300 flex items-center space-x-2 border border-white/10`}
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    &:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
    }
`;

const RatesCard = styled.div`
    ${tw`relative bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-4px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const RatesTitle = styled.h3`
    ${tw`text-xl font-bold text-white mb-4 flex items-center space-x-2`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const LevelSection = styled.div`
    ${tw`mb-6`}
`;

const LevelHeader = styled.div`
    ${tw`flex items-center justify-between mb-2`}
`;

const LevelLabel = styled.div`
    ${tw`flex items-center space-x-2 text-neutral-300`}
`;

const BonusText = styled.div`
    ${tw`text-blue-400 font-semibold`}
`;

const ProgressContainer = styled.div`
    ${tw`mb-4`}
`;

const ProgressLabels = styled.div`
    ${tw`flex items-center justify-between mb-2`}
`;

const LevelBadge = styled.div`
    ${tw`flex items-center space-x-2`}
`;

const LevelIcon = styled.div`
    ${tw`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold`}
`;

const ProgressBar = styled.div`
    ${tw`w-full h-3 rounded-full overflow-hidden`}
    background: linear-gradient(
        to right,
        #111827,
        #1f2937
    );
`;

const ProgressFill = styled.div<{ $percentage: number }>`
    height: 100%;
    width: ${({ $percentage }) => $percentage}%;
    background: linear-gradient(90deg, #3b82f6, #22d3ee);
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.6);
`;

const ProgressInfo = styled.div`
    ${tw`flex items-center justify-between text-sm text-neutral-400`}
`;

const TopupRatesPanel = () => {
    const currentAmount = 10;
    const requiredAmount = 50;
    const percentage = (currentAmount / requiredAmount) * 100;

    return (
        <RatesCard>
            <RatesTitle>ดูอัตราการเติมเงิน</RatesTitle>
            <LevelSection>
                <LevelHeader>
                    <LevelLabel>
                        <FontAwesomeIcon icon={faUser} className={'text-blue-400'} />
                        <span>ระดับการเติมเงิน</span>
                    </LevelLabel>
                    <BonusText>โบนัสที่ได้รับ: +0%</BonusText>
                </LevelHeader>
                <ProgressContainer>
                    <ProgressLabels>
                        <LevelBadge>
                            <LevelIcon className={'bg-green-500'}>M</LevelIcon>
                            <span className={'text-white font-semibold'}>MEMBER</span>
                        </LevelBadge>
                        <span className={'text-neutral-400'}>→</span>
                        <LevelBadge>
                            <LevelIcon className={'bg-amber-700'}>W</LevelIcon>
                            <span className={'text-white font-semibold'}>WOOD</span>
                        </LevelBadge>
                    </ProgressLabels>
                    <ProgressBar>
                        <ProgressFill $percentage={percentage} />
                    </ProgressBar>
                    <ProgressInfo>
                        <span>เติมเงินไปแล้ว: {currentAmount}</span>
                        <span>ต้องเติม: {requiredAmount}</span>
                    </ProgressInfo>
                </ProgressContainer>
            </LevelSection>
        </RatesCard>
    );
};

type TabType = 'bank' | 'truemoney' | 'history';

export default () => {
    const [activeTab, setActiveTab] = useState<TabType>('bank');
    const [showTermsModal, setShowTermsModal] = useState(false);

    return (
        <Container>
            <div css={tw`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}>
                <TabContainer>
                    <TabButton $active={activeTab === 'bank'} onClick={() => setActiveTab('bank')}>
                        <FontAwesomeIcon icon={faUser} className={'w-4 h-4'} />
                        <span>ธนาคาร</span>
                    </TabButton>
                    <TabButton $active={activeTab === 'truemoney'} onClick={() => setActiveTab('truemoney')}>
                        <FontAwesomeIcon icon={faUser} className={'w-4 h-4'} />
                        <span>ทรูมันนี่วอลเล็ท</span>
                    </TabButton>
                    <TabButton $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                        <FontAwesomeIcon icon={faClock} className={'w-4 h-4'} />
                        <span>ประวัติเติมเงิน</span>
                    </TabButton>
                    {activeTab !== 'history' && (
                        <ViewRatesButton>
                            <FontAwesomeIcon icon={faUser} />
                            <span>ดูอัตราการเติมเงิน</span>
                        </ViewRatesButton>
                    )}
                </TabContainer>

                {activeTab === 'bank' ? (
                    <ContentGrid>
                        <MainPanel>
                            <BankTab onShowTerms={() => setShowTermsModal(true)} />
                        </MainPanel>
                        <SidePanel>
                            <TopupRatesPanel />
                        </SidePanel>
                    </ContentGrid>
                ) : activeTab === 'truemoney' ? (
                    <div css={tw`max-w-3xl mx-auto`}>
                        <TrueMoneyTab onShowTerms={() => setShowTermsModal(true)} />
                    </div>
                ) : (
                    <div css={tw`max-w-5xl mx-auto`}>
                        <HistoryTab />
                    </div>
                )}

                {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
            </div>
        </Container>
    );
};
