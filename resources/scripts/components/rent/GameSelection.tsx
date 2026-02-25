import React from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType } from './RentServerContainer';

// Animations
const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
`;

const bounce = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
`;

const glow = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.5), 0 0 40px rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.8), 0 0 60px rgba(99, 102, 241, 0.5); }
`;

const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
`;

const Container = styled.div`
    ${tw`space-y-4 w-full max-w-6xl mx-auto px-3 sm:px-0`};
    position: relative;
    
    overflow: visible;
    margin-bottom: 0 !important;
    padding-bottom: 2rem !important;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
    }
`;

const HeaderSection = styled.div`
    ${tw`flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-3 md:gap-4 mb-4 w-full`};
    position: relative;
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl text-neutral-100 transition-all duration-300 border backdrop-blur-md self-start`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.85));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.1);

    &:hover {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2));
        border-color: rgba(56, 189, 248, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(56, 189, 248, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.3);
    }

    &:active {
        transform: translateY(0);
    }
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-3 md:gap-4 flex-1 flex-wrap text-center md:text-left w-full md:w-auto`};
`;

const PackageIcon = styled.div`
    ${tw`w-16 h-16 rounded-2xl text-white text-3xl flex items-center justify-center shadow-2xl relative overflow-hidden`};
    background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 200% 200%;
    animation: ${gradientShift} 3s ease infinite;
    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: ${shimmer} 3s infinite;
    }
`;

const PackageDetails = styled.div`
    ${tw`space-y-1`};
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`};
    background: linear-gradient(135deg, #ffffff, #a0aec0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const PackageSpecs = styled.div`
    ${tw`flex items-center gap-4 text-sm`};
    color: rgba(203, 213, 225, 0.9);
`;

const SpecItem = styled.span`
    ${tw`flex items-center gap-1.5 px-3 py-1.5 rounded-lg`};
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.2);
    transition: all 0.3s;

    &:hover {
        background: rgba(56, 189, 248, 0.1);
        border-color: rgba(56, 189, 248, 0.4);
        transform: translateY(-1px);
    }
`;

const PriceButton = styled.div`
    ${tw`h-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-white font-bold border self-center md:self-center relative overflow-hidden`};
    background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 200% 200%;
    animation: ${gradientShift} 3s ease infinite;
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
    }

    &:hover::before {
        left: 100%;
    }

    &:hover {
        animation: ${glow} 2s ease-in-out infinite;
        transform: translateY(-2px);
    }
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl sm:rounded-3xl backdrop-blur-xl p-3 sm:p-4 md:p-6 border`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-1 sm:gap-2 md:gap-3 mb-4 md:mb-6`};
    @media (max-width: 640px) {
        gap: 0.25rem;
    }
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-1 sm:gap-2 md:gap-3 flex-1`};
    @media (max-width: 640px) {
        flex-direction: column;
        gap: 0.25rem;
    }
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-300 relative flex-shrink-0`};
    ${(props) =>
        props.$completed
            ? tw`text-white`
            : props.$active
            ? tw`text-white`
            : tw`bg-white/5 text-gray-400 border border-white/10`};
    ${(props) =>
        props.$completed &&
        css`
            background: linear-gradient(135deg, #22c55e, #16a34a);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
        `};
    ${(props) =>
        props.$active &&
        css`
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: ${pulse} 2s ease-in-out infinite;
        `};
`;

const StepLabel = styled.span<{ $active: boolean }>`
    ${tw`text-xs sm:text-sm font-medium transition-colors duration-300 hidden sm:block`};
    ${(props) => (props.$active ? tw`text-white` : tw`text-gray-400`)};
    @media (max-width: 640px) {
        font-size: 0.625rem;
        line-height: 1;
        text-align: center;
    }
`;

const progressPulse = keyframes`
    0%, 100% { opacity: 1; transform: scaleY(1); }
    50% { opacity: 0.8; transform: scaleY(1.05); }
`;

const ProgressBar = styled.div`
    ${tw`w-full h-3 rounded-full overflow-visible relative`};
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(56, 189, 248, 0.2);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
`;

const ProgressFill = styled.div<{ $progress: number }>`
    ${tw`h-full relative overflow-visible`};
    background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 200% 100%;
    animation: ${gradientShift} 3s ease infinite, ${progressPulse} 2s ease-in-out infinite;
    width: ${(props) => props.$progress}%;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
`;

const ProgressIcon = styled.div<{ $progress: number }>`
    ${tw`absolute w-6 h-6 overflow-hidden z-20`};
    top: 50%;
    transform: translateY(-50%);
    left: ${(props) => props.$progress}%;
    margin-left: -12px;
    transition: left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation: ${bounce} 1.5s ease-in-out infinite;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
    }
`;

const SectionTitle = styled.div`
    ${tw`flex items-center gap-4 mb-6`};
`;

const TitleBar = styled.div`
    ${tw`w-2 h-12 rounded-full relative overflow-hidden`};
    background: linear-gradient(180deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 100% 200%;
    animation: ${gradientShift} 3s ease infinite;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
`;

const TitleText = styled.h2`
    ${tw`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight`};
    background: linear-gradient(135deg, #ffffff, #a0aec0, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
`;

const GameGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6`};
    overflow: visible;
    padding: 0.5rem sm:p-4;
`;

const GameCard = styled.div<{ $selected: boolean; $backgroundImage?: string }>`
    ${tw`relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-300 overflow-hidden`};
    min-height: 180px;
    @media (max-width: 640px) {
        min-height: 160px;
    }
    background-image: ${({ $backgroundImage }) => ($backgroundImage ? `url(${$backgroundImage})` : 'none')};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    ${({ $backgroundImage }) =>
        !$backgroundImage && tw`bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800`};

    ${(props) =>
        props.$selected
            ? css`
                  transform: translateY(-4px) scale(1.02);
                  animation: ${glow} 2s ease-in-out infinite;
              `
            : css`
                  &:hover {
                      transform: translateY(-6px) scale(1.03);
                  }
              `};

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${({ $backgroundImage }) =>
            $backgroundImage
                ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.75))'
                : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.85))'};
        z-index: 1;
    }

    & > * {
        position: relative;
        z-index: 2;
    }
`;

const GameIcon = styled.div`
    ${tw`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl text-white text-2xl sm:text-3xl flex items-center justify-center mb-3 sm:mb-4 relative z-10 transition-transform duration-300`};
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);

    ${GameCard}:hover & {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 15px 40px rgba(59, 130, 246, 0.6);
    }
`;

const GameName = styled.h3`
    ${tw`text-lg sm:text-xl font-bold text-white mb-2 relative z-10`};
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.5);
`;

const GameDescription = styled.p`
    ${tw`text-gray-200 text-xs sm:text-sm leading-relaxed relative z-10`};
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.9);
    opacity: 0.95;
`;

const Checkmark = styled.div`
    ${tw`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-2xl z-20`};
    background: linear-gradient(135deg, #22c55e, #16a34a);
    box-shadow: 0 0 25px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: ${pulse} 2s ease-in-out infinite;

    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        opacity: 0.5;
        filter: blur(8px);
        z-index: -1;
    }
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
    onSelect: (game: GameType) => void;
    onBack: () => void;
}

export default ({ onSelect, onBack }: Props) => {
    const [selectedGame, setSelectedGame] = React.useState<GameType | null>(null);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        // 4 ขั้น: เลือกเกม → เลือกเวอร์ชัน → เลือกฮาร์ดแวร์ & แพ็กเกจ → ตั้งค่าเซิร์ฟเวอร์
        setProgress(0);
        const timer = setTimeout(() => {
            setProgress(25);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const getBackgroundImage = (gameId: string): string | undefined => {
        const base = process.env.PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const imageMap: { [key: string]: string } = {
            vanilla: `${base}/vanilla.png?v=1`,
            bedrock: `${base}/bedrock.png?v=1`,
            cross: `${base}/cross.jpg?v=1`,
            plugin: `${base}/plugin.jpg?v=1`,
            mod: `${base}/mod.png?v=1`,
        };
        return imageMap[gameId];
    };

    const handleSelect = (game: GameType) => {
        setSelectedGame(game);
        onSelect(game);
    };

    return (
        <Container>
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
                        <StepLabel $active={false}>เลือกฮาร์ดแวร์ & แพ็กเกจ</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            4
                        </StepCircle>
                        <StepLabel $active={false}>ตั้งค่าเซิร์ฟเวอร์</StepLabel>
                    </Step>
                </ProgressSteps>
                <ProgressBar>
                    <ProgressFill $progress={progress} />
                    <ProgressIcon $progress={progress}>
                        <img src='/Grass-Block.png' alt='Progress' />
                    </ProgressIcon>
                </ProgressBar>
            </ProgressSection>

            <SectionTitle>
                <TitleBar />
                <TitleText> เลือกประเภทเกมที่ต้องการ</TitleText>
            </SectionTitle>

            <GameGrid>
                {games.map((game) => (
                    <GameCard
                        key={game.id}
                        $selected={selectedGame?.id === game.id}
                        $backgroundImage={getBackgroundImage(game.id)}
                        onClick={() => handleSelect(game)}
                    >
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
