import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType } from './RentServerContainer';

const Container = styled.div`
    ${tw`space-y-6 w-full max-w-6xl mx-auto px-3 sm:px-0`};
`;

const HeaderSection = styled.div`
    ${tw`flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-3 md:gap-4 mb-4 w-full`};
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-neutral-100 transition-all duration-200 border border-white/10 hover:-translate-y-0.5 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.35)] self-start`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.82));
    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.85));
    }
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-4 flex-1 flex-wrap text-center md:text-left w-full md:w-auto`};
`;

const PackageIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-lg`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const PackageDetails = styled.div`
    ${tw`space-y-1`};
`;

const PackageName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const PackageSpecs = styled.div`
    ${tw`flex items-center gap-3 text-sm text-gray-200`};
`;

const PriceButton = styled.div`
    ${tw`h-full flex items-center justify-center rounded-2xl px-4 py-3 text-white font-semibold border border-white/10 self-center md:self-center`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl backdrop-blur p-4`};
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-3 mb-4`};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-3 flex-1`};
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base transition-all shadow-inner`};
    ${(props) =>
        props.$completed
            ? tw`text-white`
            : props.$active
            ? tw`text-white shadow-[0_0_20px_rgba(56,189,248,0.45)]`
            : tw`bg-white/10 text-gray-300 border border-white/10`};
    ${(props) =>
        props.$completed &&
        `
        background: linear-gradient(135deg, #22c55e, #16a34a);
    `};
    ${(props) =>
        props.$active &&
        `
        background: linear-gradient(135deg, #38bdf8, #6366f1);
    `};
`;

const StepLabel = styled.span<{ $active: boolean }>`
    ${tw`text-sm`};
    ${(props) => (props.$active ? tw`text-white font-semibold` : tw`text-gray-300`)}
`;

const ProgressBar = styled.div`
    ${tw`w-full h-2 rounded-full bg-white/10 overflow-hidden`};
`;

const ProgressFill = styled.div`
    ${tw`h-full transition-all duration-300`};
    background: linear-gradient(90deg, #38bdf8, #6366f1);
    width: 33.33%;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
`;

const SectionTitle = styled.div`
    ${tw`flex items-center gap-3 mb-3`};
`;

const TitleBar = styled.div`
    ${tw`w-1.5 h-9 rounded-full`};
    background: linear-gradient(180deg, #38bdf8, #6366f1);
`;

const TitleText = styled.h2`
    ${tw`text-2xl font-bold text-white tracking-tight`};
`;

const GameGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-3 gap-5`};
`;

const GameCard = styled.div<{ $selected: boolean }>`
    ${tw`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border`};
    background: linear-gradient(135deg, rgba(16, 24, 40, 0.9), rgba(8, 15, 30, 0.9));
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
    ${(props) =>
        props.$selected
            ? `
        border: 1px solid rgba(56, 189, 248, 0.85);
        box-shadow: 0 16px 40px rgba(56, 189, 248, 0.3);
    `
            : `
        border: 1px solid rgba(255, 255, 255, 0.1);
        &:hover {
            border-color: rgba(56, 189, 248, 0.7);
            transform: translateY(-4px);
        }
    `};
`;

const GameIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center mb-3`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 10px 24px rgba(99, 102, 241, 0.35);
`;

const GameName = styled.h3`
    ${tw`text-lg font-semibold text-white mb-1`};
`;

const GameDescription = styled.p`
    ${tw`text-gray-300 text-sm leading-relaxed`};
`;

const Checkmark = styled.div`
    ${tw`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg`};
    background: linear-gradient(135deg, #22c55e, #16a34a);
`;

const games: GameType[] = [
    {
        id: 'vanilla',
        name: 'Minecraft Vanilla',
        description: 'เซิร์ฟเวอร์ Minecraft แบบดั้งเดิม พร้อมเล่นได้ทันที',
        icon: '🎮',
    },
    {
        id: 'bedrock',
        name: 'Minecraft Bedrock',
        description: 'รองรับการเล่นผ่านโทรศัพท์มือถือ',
        icon: '📱',
    },
    {
        id: 'cross',
        name: 'Minecraft Cross',
        description: 'เชื่อมต่อผู้เล่น Java และ Bedrock เล่นด้วยกันได้',
        icon: '🔗',
    },
    {
        id: 'plugin',
        name: 'Minecraft Plugin',
        description: 'รองรับการติดตั้ง Plugin ต่างๆ',
        icon: '🔌',
    },
    {
        id: 'mod',
        name: 'Minecraft Mod',
        description: 'รองรับการติดตั้ง Mod ต่างๆ',
        icon: '⚙️',
    },
];

interface Props {
    selectedPackage: Package;
    onSelect: (game: GameType) => void;
    onBack: () => void;
}

export default ({ selectedPackage, onSelect, onBack }: Props) => {
    const [selectedGame, setSelectedGame] = React.useState<GameType | null>(null);

    const handleSelect = (game: GameType) => {
        setSelectedGame(game);
        onSelect(game);
    };

    return (
        <Container>
            <HeaderSection>
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>กลับไปเลือกแพ็กเกจ</span>
                </BackButton>
                <PackageInfo>
                    <PackageIcon>💎</PackageIcon>
                    <PackageDetails>
                        <PackageName>{selectedPackage.name}</PackageName>
                        <PackageSpecs>
                            <span>
                                <FontAwesomeIcon icon={faMicrochip} className={'mr-1'} />
                                {selectedPackage.cpu} vCPU
                            </span>
                            <span>
                                <FontAwesomeIcon icon={faMemory} className={'mr-1'} />
                                {selectedPackage.ram} GB RAM
                            </span>
                            <span>
                                <FontAwesomeIcon icon={faHdd} className={'mr-1'} />
                                {selectedPackage.storage} GB Disk
                            </span>
                        </PackageSpecs>
                    </PackageDetails>
                </PackageInfo>
                <PriceButton>
                    <FontAwesomeIcon icon={faClock} />
                    <span> {selectedPackage.pricePerHour} เครดิต / ชั่วโมง</span>
                </PriceButton>
            </HeaderSection>

            <ProgressSection>
                <ProgressSteps>
                    <Step $active={true} $completed={false}>
                        <StepCircle $active={true} $completed={false}>
                            1
                        </StepCircle>
                        <StepLabel $active={true}>เลือกเกม</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            2
                        </StepCircle>
                        <StepLabel $active={false}>เลือกเวอร์ชัน</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            3
                        </StepCircle>
                        <StepLabel $active={false}>ตั้งค่าเซิร์ฟเวอร์</StepLabel>
                    </Step>
                </ProgressSteps>
                <ProgressBar>
                    <ProgressFill />
                </ProgressBar>
            </ProgressSection>

            <SectionTitle>
                <TitleBar />
                <TitleText>| เลือกประเภทเกมที่ต้องการ</TitleText>
            </SectionTitle>

            <GameGrid>
                {games.map((game) => (
                    <GameCard key={game.id} $selected={selectedGame?.id === game.id} onClick={() => handleSelect(game)}>
                        {selectedGame?.id === game.id && (
                            <Checkmark>
                                <FontAwesomeIcon icon={faCheck} />
                            </Checkmark>
                        )}
                        <GameIcon>{game.icon}</GameIcon>
                        <GameName>{game.name}</GameName>
                        <GameDescription>{game.description}</GameDescription>
                    </GameCard>
                ))}
            </GameGrid>
        </Container>
    );
};
