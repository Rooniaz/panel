import React, { useState, useEffect, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faArrowLeft, faCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType, Version } from './RentServerContainer';
import getVersions from '@/api/spring/versions';

const Container = styled.div`
    ${tw`space-y-6 w-full max-w-6xl mx-auto px-3 sm:px-0`};
`;

const HeaderSection = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    ${tw`w-full mb-5`};
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        ${tw`gap-3`};
    }
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-neutral-100 transition-all duration-200 border border-white/10 hover:-translate-y-0.5 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.35)] self-start md:self-start`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.82));
    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.85));
    }
`;

const PackageIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-lg`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const PackageDetails = styled.div`
    ${tw`space-y-1 flex-1 w-full`};
`;

const PackageName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const PackageSpecs = styled.div`
    ${tw`flex flex-wrap gap-3 text-sm text-gray-200 justify-center sm:justify-start`};
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl backdrop-blur p-4`};
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-3 mb-4 flex-wrap`};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-3 flex-1 min-w-[0]`};
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
    width: 66.66%;
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
    ${tw`text-2xl font-semibold text-white tracking-tight`};
`;

const GameInfo = styled.div`
    ${tw`flex items-center gap-3 mb-4 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur`};
`;

const GameIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl text-white text-xl flex items-center justify-center shadow-lg`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const GameDetails = styled.div`
    ${tw`flex-1`};
`;

const GameName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const GameVersion = styled.p`
    ${tw`text-sm text-gray-300`};
`;

const VersionGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4`};
`;

const VersionButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 bg-white/5`};
    ${(props) => {
        if (props.$selected) {
            return tw`shadow-[0_16px_40px_rgba(56,189,248,0.25)]`;
        }
        return tw`border-white/10 hover:-translate-y-0.5`;
    }};
    ${(props) =>
        props.$selected
            ? `
        border-color: rgba(56, 189, 248, 0.7);
        background: rgba(56, 189, 248, 0.1);
    `
            : `
        border-color: rgba(255,255,255,0.1);
        &:hover { border-color: rgba(56, 189, 248, 0.6); }
    `};
`;

const VersionIcon = styled.div`
    ${tw`w-11 h-11 rounded-xl text-white text-lg flex items-center justify-center`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const VersionInfo = styled.div`
    ${tw`flex-1 text-left`};
`;

const VersionName = styled.div`
    ${tw`font-semibold text-white`};
`;

const JavaVersion = styled.div`
    ${tw`text-sm text-gray-300`};
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg text-white`};
    background: linear-gradient(135deg, #22c55e, #16a34a);
`;

const PriceButton = styled.div`
    ${tw`h-full flex items-center justify-center rounded-2xl px-4 py-3 text-white font-semibold border border-white/10 self-center md:self-center`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
`;

const Pagination = styled.div`
    ${tw`w-full overflow-x-auto`};
    & > div {
        ${tw`flex items-center justify-center gap-2 min-w-max px-1 py-2`};
    }
`;

const PageButton = styled.button<{ $active?: boolean }>`
    ${tw`w-11 h-11 rounded-xl transition-all duration-150 border text-sm font-semibold flex items-center justify-center`};
    ${(props) =>
        props.$active
            ? tw`text-white border-transparent shadow-[0_10px_25px_rgba(56,189,248,0.25)]`
            : tw`text-gray-200 border-white/10 hover:bg-white/10`};
    ${(props) =>
        props.$active
            ? `background: linear-gradient(135deg, #38bdf8, #6f6bff);`
            : `
        background: rgba(255, 255, 255, 0.05);
        &:hover { border-color: rgba(56, 189, 248, 0.6); }
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
    ${tw`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6`};
`;

const NavButton = styled.button<{ $primary?: boolean }>`
    ${tw`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 font-semibold`};
    ${(props) =>
        props.$primary
            ? tw`text-white shadow-[0_12px_30px_rgba(56,189,248,0.35)]`
            : tw`text-gray-100 border border-white/10 bg-white/5 hover:bg-white/10`};
    ${(props) =>
        props.$primary
            ? `
        background: linear-gradient(135deg, #38bdf8, #6366f1);
        &:hover { background: linear-gradient(135deg, #38bdf8, #7c83ff); }
    `
            : ''};
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12 text-gray-300`};
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500/60 rounded-2xl p-4 text-red-100`};
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-center justify-center gap-3 md:gap-4 flex-wrap text-center md:text-left w-full`};
    justify-self: center;
`;

// Map game types to API game keys and edition
// Bedrock shows Bedrock versions, others show Java versions
const getGameKey = (gameId: string): string => {
    const gameKeyMap: { [key: string]: string } = {
        vanilla: 'MINECRAFT-JAVA',
        bedrock: 'MINECRAFT-BEDROCK',
        cross: 'MINECRAFT-JAVA', // Cross uses Java versions
        plugin: 'MINECRAFT-JAVA', // Plugin uses Java versions
        mod: 'MINECRAFT-JAVA', // Mod uses Java versions
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
    const versionsPerPage = 6;

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                setLoading(true);
                setError(null);
                const gameKey = getGameKey(selectedGame.id);
                const apiVersions = await getVersions(gameKey);

                // Convert API response to Version format
                const versions: Version[] = apiVersions.map((v) => ({
                    id: v.id,
                    name: v.name,
                    javaVersion: v.runnerVersion ? v.runnerVersion.replace('java_', 'Java-') : 'Unknown',
                    isLatest: v.key === 'latest',
                    eggId: v.eggId, // Include eggId if provided by Spring Boot API
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
                    <ProgressFill />
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
                                    <JavaVersion>{version.javaVersion}</JavaVersion>
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
