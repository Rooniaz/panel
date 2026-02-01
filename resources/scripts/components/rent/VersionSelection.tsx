import React, { useState, useEffect, useMemo } from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faArrowLeft, faCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType, Version } from './RentServerContainer';
import getVersions from '@/api/spring/versions';

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
    
    /* แก้ไขจุดนี้: เปลี่ยนจาก 200% เป็นค่าที่พอดีกับ Container */
    overflow: hidden; /* ตัดส่วนที่ฟุ้งเกินขอบออก */
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
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    ${tw`w-full mb-6`};
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        ${tw`gap-4`};
    }
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl text-neutral-100 transition-all duration-300 border backdrop-blur-md self-start md:self-start`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.85));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.1);

    &:hover {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2));
        border-color: rgba(56, 189, 248, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(56, 189, 248, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.3);
    }
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
    ${tw`space-y-1 flex-1 w-full`};
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`};
    background: linear-gradient(135deg, #ffffff, #a0aec0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const PackageSpecs = styled.div`
    ${tw`flex flex-wrap gap-3 text-sm justify-center sm:justify-start`};
`;

const SpecItem = styled.span`
    ${tw`flex items-center gap-1.5 px-3 py-1.5 rounded-lg`};
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: rgba(203, 213, 225, 0.9);
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
    ${tw`rounded-3xl backdrop-blur-xl p-6 border`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-3 mb-6 flex-wrap`};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-3 flex-1 min-w-[0]`};
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 relative`};
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
    ${tw`text-sm font-medium transition-colors duration-300`};
    ${(props) => (props.$active ? tw`text-white` : tw`text-gray-400`)};
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
    ${tw`text-3xl font-bold tracking-tight`};
    background: linear-gradient(135deg, #ffffff, #a0aec0, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
`;

const GameInfo = styled.div`
    ${tw`flex items-center gap-4 mb-6 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
        animation: ${shimmer} 3s infinite;
    }
`;

const GameIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-2xl relative z-10`};
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
`;

const GameDetails = styled.div`
    ${tw`flex-1 relative z-10`};
`;

const GameName = styled.h3`
    ${tw`text-xl font-bold text-white mb-1`};
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const GameVersion = styled.p`
    ${tw`text-sm text-gray-300`};
`;

const VersionGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 p-2`};
    overflow: visible;
`;

const VersionButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 backdrop-blur-xl overflow-hidden`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    ${(props) => {
        if (props.$selected) {
            return css`
                transform: translateY(-4px) scale(1.02);
                animation: ${glow} 2s ease-in-out infinite;
            `;
        }
        return css`
            &:hover {
                transform: translateY(-6px) scale(1.03);
            }
        `;
    }};

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
        transition: left 0.5s;
    }

    &:hover::before {
        left: 100%;
    }
`;

const VersionIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl text-white text-lg flex items-center justify-center relative z-10 transition-transform duration-300`};
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);

    ${VersionButton}:hover & {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.6);
    }
`;

const VersionInfo = styled.div`
    ${tw`flex-1 text-left relative z-10`};
`;

const VersionName = styled.div`
    ${tw`font-bold text-white mb-1`};
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const JavaVersion = styled.div`
    ${tw`text-sm text-gray-300`};
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-2xl text-white z-20`};
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

const Pagination = styled.div`
    ${tw`w-full overflow-x-auto`};
    & > div {
        ${tw`flex items-center justify-center gap-2 min-w-max px-1 py-3`};
    }
`;

const PageButton = styled.button<{ $active?: boolean }>`
    ${tw`w-12 h-12 rounded-xl transition-all duration-300 border text-sm font-bold flex items-center justify-center relative overflow-hidden`};
    ${(props) =>
        props.$active ? tw`text-white border-transparent` : tw`text-gray-200 border-white/10 hover:bg-white/10`};
    ${(props) =>
        props.$active
            ? css`
                  background: linear-gradient(135deg, #3b82f6, #6366f1);
                  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3);
                  animation: ${pulse} 2s ease-in-out infinite;
              `
            : css`
                  background: rgba(15, 23, 42, 0.6);
                  &:hover {
                      background: rgba(56, 189, 248, 0.1);
                      border-color: rgba(56, 189, 248, 0.4);
                      transform: translateY(-2px);
                  }
              `};
    &:disabled {
        ${tw`opacity-40 cursor-not-allowed`};
        background: rgba(255, 255, 255, 0.04);
    }
`;

const Ellipsis = styled.span`
    ${tw`px-2 text-gray-300 text-sm select-none`};
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8`};
`;

const NavButton = styled.button<{ $primary?: boolean }>`
    ${tw`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl transition-all duration-300 font-bold relative overflow-hidden`};
    ${(props) =>
        props.$primary ? tw`text-white` : tw`text-gray-100 border border-white/10 bg-white/5 hover:bg-white/10`};
    ${(props) =>
        props.$primary
            ? css`
                  background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
                  background-size: 200% 200%;
                  animation: ${gradientShift} 3s ease infinite;
                  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
                  &:hover {
                      animation: ${glow} 2s ease-in-out infinite;
                      transform: translateY(-2px);
                  }
              `
            : ''};

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
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-16 text-gray-300`};
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500/60 rounded-3xl p-6 text-red-100 backdrop-blur-xl`};
    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-center justify-center gap-3 md:gap-4 flex-wrap text-center md:text-left w-full`};
    justify-self: center;
`;

// Map game types to API game keys and edition
const getGameKey = (gameId: string): string => {
    const gameKeyMap: { [key: string]: string } = {
        vanilla: 'MINECRAFT-JAVA',
        bedrock: 'MINECRAFT-BEDROCK',
        cross: 'MINECRAFT-JAVA',
        plugin: 'MINECRAFT-JAVA',
        mod: 'MINECRAFT-JAVA',
    };
    return gameKeyMap[gameId] || 'MINECRAFT-JAVA';
};

interface Props {
    selectedPackage: Package;
    selectedGame: GameType;
    onSelect: (version: Version) => void;
    onBack: () => void;
}

export default ({ selectedPackage, selectedGame, onSelect, onBack }: Props) => {
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [allVersions, setAllVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [progress, setProgress] = useState(0);
    const versionsPerPage = 6;

    useEffect(() => {
        // Animate progress from 33.33% to 66.66%
        setProgress(33.33);
        const timer = setTimeout(() => {
            setProgress(66.66);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                setLoading(true);
                setError(null);
                const gameKey = getGameKey(selectedGame.id);
                const apiVersions = await getVersions(gameKey);

                const versions: Version[] = apiVersions.map((v) => ({
                    id: v.id,
                    name: v.name,
                    javaVersion: v.runnerVersion ? v.runnerVersion.replace('java_', 'Java-') : 'Unknown',
                    isLatest: v.key === 'latest',
                    eggId: v.eggId,
                }));

                setAllVersions(versions);
            } catch (err: any) {
                setError(err.message || 'Failed to load versions');
            } finally {
                setLoading(false);
            }
        };

        if (selectedGame) {
            fetchVersions();
        }
    }, [selectedGame]);

    const totalPages = Math.ceil(allVersions.length / versionsPerPage);
    const displayedVersions = allVersions.slice((currentPage - 1) * versionsPerPage, currentPage * versionsPerPage);

    const pageItems = useMemo<(number | 'ellipsis')[]>(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const items: (number | 'ellipsis')[] = [];
        items.push(1);

        if (currentPage > 3) {
            items.push('ellipsis');
        }

        for (let p = currentPage - 1; p <= currentPage + 1; p++) {
            if (p > 1 && p < totalPages) {
                items.push(p);
            }
        }

        if (currentPage < totalPages - 2) {
            items.push('ellipsis');
        }

        if (totalPages > 1) {
            items.push(totalPages);
        }

        return items;
    }, [currentPage, totalPages]);

    const handleSelect = (version: Version) => {
        setSelectedVersion(version);
        onSelect(version);
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
                            <SpecItem>
                                <FontAwesomeIcon icon={faMicrochip} />
                                <span>{selectedPackage.cpu} vCPU</span>
                            </SpecItem>
                            <SpecItem>
                                <FontAwesomeIcon icon={faMemory} />
                                <span>{selectedPackage.ram} GB RAM</span>
                            </SpecItem>
                            <SpecItem>
                                <FontAwesomeIcon icon={faHdd} />
                                <span>{selectedPackage.storage} GB Disk</span>
                            </SpecItem>
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
                    <Step $active={false} $completed={true}>
                        <StepCircle $active={false} $completed={true}>
                            <FontAwesomeIcon icon={faCheck} />
                        </StepCircle>
                        <StepLabel $active={false}>เลือกเกม</StepLabel>
                    </Step>
                    <Step $active={true} $completed={false}>
                        <StepCircle $active={true} $completed={false}>
                            2
                        </StepCircle>
                        <StepLabel $active={true}>เลือกเวอร์ชัน</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            3
                        </StepCircle>
                        <StepLabel $active={false}>ตั้งค่าเซิร์ฟเวอร์</StepLabel>
                    </Step>
                </ProgressSteps>
                <ProgressBar>
                    <ProgressFill $progress={progress} />
                    <ProgressIcon $progress={progress}>
                        <img src="/Grass-Block.png" alt="Progress" />
                    </ProgressIcon>
                </ProgressBar>
            </ProgressSection>

            <SectionTitle>
                <TitleBar />
                <TitleText>เลือกเวอร์ชันของ {selectedGame.name}</TitleText>
            </SectionTitle>

            <GameInfo>
                <GameIcon>{selectedGame.icon}</GameIcon>
                <GameDetails>
                    <GameName>{selectedGame.name}</GameName>
                    <GameVersion>{selectedVersion?.name || 'ยังไม่ได้เลือกเวอร์ชัน'}</GameVersion>
                </GameDetails>
            </GameInfo>

            {loading ? (
                <LoadingSpinner>
                    <div className='text-neutral-400'>กำลังโหลดเวอร์ชัน...</div>
                </LoadingSpinner>
            ) : error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : (
                <>
                    <VersionGrid>
                        {displayedVersions.map((version) => (
                            <VersionButton
                                key={version.id}
                                $selected={selectedVersion?.id === version.id}
                                onClick={() => handleSelect(version)}
                            >
                                {selectedVersion?.id === version.id && (
                                    <SelectedIndicator>
                                        <FontAwesomeIcon icon={faCheck} className={'text-xs'} />
                                    </SelectedIndicator>
                                )}
                                <VersionIcon>P</VersionIcon>
                                <VersionInfo>
                                    <VersionName>{version.name}</VersionName>
                                </VersionInfo>
                            </VersionButton>
                        ))}
                    </VersionGrid>
                </>
            )}

            {totalPages > 1 && (
                <Pagination>
                    <div>
                        <PageButton
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            ←
                        </PageButton>
                        {pageItems.map((item, idx) =>
                            item === 'ellipsis' ? (
                                <Ellipsis key={`ellipsis-${idx}`}>…</Ellipsis>
                            ) : (
                                <PageButton
                                    key={item}
                                    $active={currentPage === item}
                                    onClick={() => setCurrentPage(item)}
                                >
                                    {item}
                                </PageButton>
                            )
                        )}
                        <PageButton
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            →
                        </PageButton>
                    </div>
                </Pagination>
            )}

            <NavigationButtons>
                <NavButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>ย้อนกลับ</span>
                </NavButton>
                <NavButton
                    $primary
                    onClick={() => selectedVersion && onSelect(selectedVersion)}
                    disabled={!selectedVersion}
                >
                    <span>ถัดไป →</span>
                </NavButton>
            </NavigationButtons>
        </Container>
    );
};
