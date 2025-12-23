import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType } from './RentServerContainer';

const Container = styled.div`
    ${tw`space-y-6`}
`;

const HeaderSection = styled.div`
    ${tw`flex items-center justify-between mb-6`}
`;

const BackButton = styled.button`
    ${tw`flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 transition-colors`}
`;

const PackageInfo = styled.div`
    ${tw`flex items-center space-x-4`}
`;

const PackageIcon = styled.div`
    ${tw`w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl`}
`;

const PackageDetails = styled.div`
    ${tw`space-y-1`}
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`}
`;

const PackageSpecs = styled.div`
    ${tw`flex items-center space-x-4 text-sm text-neutral-400`}
`;

const PriceButton = styled.button`
    ${tw`flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors`}
`;

const ProgressSection = styled.div`
    ${tw`mb-6`}
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-center space-x-8 mb-4`}
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex flex-col items-center`}
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all`}
    ${(props) =>
        props.$completed
            ? tw`bg-green-500 text-white`
            : props.$active
            ? tw`bg-blue-500 text-white`
            : tw`bg-neutral-700 text-neutral-400`}
`;

const StepLabel = styled.span<{ $active: boolean }>`
    ${tw`mt-2 text-sm`}
    ${(props) => (props.$active ? tw`text-blue-400 font-semibold` : tw`text-neutral-400`)}
`;

const ProgressBar = styled.div`
    ${tw`w-full h-1 bg-neutral-700 rounded-full overflow-hidden`}
`;

const ProgressFill = styled.div`
    ${tw`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300`}
    width: 33.33%;
`;

const SectionTitle = styled.div`
    ${tw`flex items-center space-x-3 mb-6`}
`;

const TitleBar = styled.div`
    ${tw`w-1 h-8 bg-blue-500 rounded`}
`;

const TitleText = styled.h2`
    ${tw`text-2xl font-bold text-white`}
`;

const GameGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-3 gap-6`}
`;

const GameCard = styled.div<{ $selected: boolean }>`
    ${tw`relative rounded-lg p-6 cursor-pointer transition-all duration-300 border-2`}
    ${(props) => (props.$selected ? tw`border-blue-500 shadow-lg` : tw`border-neutral-700 hover:border-blue-400`)}
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
    ${(props) =>
        props.$selected
            ? 'box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5), 0 4px 6px -2px rgba(59, 130, 246, 0.3);'
            : ''}
`;

const GameIcon = styled.div`
    ${tw`w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl mb-4`}
`;

const GameName = styled.h3`
    ${tw`text-xl font-bold text-white mb-2`}
`;

const GameDescription = styled.p`
    ${tw`text-neutral-400 text-sm`}
`;

const Checkmark = styled.div`
    ${tw`absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white`}
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
                    <span>{selectedPackage.pricePerHour} เครดิต / ชั่วโมง</span>
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
