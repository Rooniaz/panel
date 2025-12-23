import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import TermsModal from './TermsModal';
import BankTab from './BankTab';
import TrueMoneyTab from './TrueMoneyTab';

const Container = styled.div`
    ${tw`min-h-screen bg-neutral-900 py-8`}
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
    ${tw`flex items-center space-x-4 mb-6`}
`;

const TabButton = styled.button<{ $active: boolean }>`
    ${tw`px-8 py-3 rounded-xl font-semibold transition-all duration-300`}
    ${({ $active }) =>
        $active
            ? `
                background: linear-gradient(135deg, #3b82f6, #22d3ee);
                color: white;
                box-shadow: 0 8px 25px rgba(34,211,238,.35);
            `
            : `
                background: #1f2933;
                color: #9ca3af;
                &:hover {
                    background: #374151;
                    color: white;
                }
            `}
`;

const ViewRatesButton = styled.button`
    ${tw`ml-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 transition-colors flex items-center space-x-2`}
`;

const RatesCard = styled.div`
    ${tw`relative bg-neutral-800 rounded-xl p-6`}
    box-shadow: 0 10px 25px rgba(0,0,0,.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
`;

const RatesTitle = styled.h3`
    ${tw`text-xl font-bold text-white mb-4`}
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

type TabType = 'bank' | 'truemoney';

export default () => {
    const [activeTab, setActiveTab] = useState<TabType>('bank');
    const [showTermsModal, setShowTermsModal] = useState(false);

    return (
        <Container>
            <div css={tw`max-w-7xl mx-auto px-4`}>
                <TabContainer>
                    <TabButton $active={activeTab === 'bank'} onClick={() => setActiveTab('bank')}>
                        ธนาคาร
                    </TabButton>
                    <TabButton $active={activeTab === 'truemoney'} onClick={() => setActiveTab('truemoney')}>
                        ทรูมันนี่วอลเล็ท
                    </TabButton>
                    <ViewRatesButton>
                        <FontAwesomeIcon icon={faUser} />
                        <span>ดูอัตราการเติมเงิน</span>
                    </ViewRatesButton>
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
                ) : (
                    <div css={tw`max-w-3xl mx-auto`}>
                        <TrueMoneyTab onShowTerms={() => setShowTermsModal(true)} />
                    </div>
                )}

                {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
            </div>
        </Container>
    );
};
