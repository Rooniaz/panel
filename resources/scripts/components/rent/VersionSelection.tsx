import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType, Version } from './RentServerContainer';
import getVersions from '@/api/spring/versions';

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
    width: 66.66%;
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

const GameInfo = styled.div`
    ${tw`flex items-center space-x-3 mb-6 p-4 bg-neutral-800 rounded-lg`}
`;

const GameIcon = styled.div`
    ${tw`w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl`}
`;

const GameDetails = styled.div`
    ${tw`flex-1`}
`;

const GameName = styled.h3`
    ${tw`text-lg font-semibold text-white`}
`;

const GameVersion = styled.p`
    ${tw`text-sm text-neutral-400`}
`;

const VersionGrid = styled.div`
    ${tw`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6`}
`;

const VersionButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center space-x-3 p-4 rounded-lg border-2 transition-all`}
    ${(props) =>
        props.$selected
            ? tw`border-blue-500 bg-blue-500/20`
            : tw`border-neutral-700 bg-neutral-800 hover:border-blue-400`}
`;

const VersionIcon = styled.div`
    ${tw`w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white`}
`;

const VersionInfo = styled.div`
    ${tw`flex-1 text-left`}
`;

const VersionName = styled.div`
    ${tw`font-semibold text-white`}
`;

const JavaVersion = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center`}
`;

const Pagination = styled.div`
    ${tw`flex items-center justify-center space-x-2`}
`;

const PageButton = styled.button<{ $active?: boolean }>`
    ${tw`px-3 py-1 rounded transition-colors`}
    ${(props) =>
        props.$active ? tw`bg-blue-500 text-white` : tw`bg-neutral-800 text-neutral-400 hover:bg-neutral-700`}
`;

const NavigationButtons = styled.div`
    ${tw`flex items-center justify-between mt-6`}
`;

const NavButton = styled.button<{ $primary?: boolean }>`
    ${tw`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors`}
    ${(props) =>
        props.$primary
            ? tw`bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600`
            : tw`bg-neutral-800 text-neutral-300 hover:bg-neutral-700`}
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

// Map game types to API game keys
const getGameKey = (gameId: string): string => {
    const gameKeyMap: { [key: string]: string } = {
        vanilla: 'MINECRAFT-JAVA',
        bedrock: 'MINECRAFT-BEDROCK',
        cross: 'MINECRAFT-CROSS',
        plugin: 'MINECRAFT-PLUGIN',
        mod: 'MINECRAFT-MOD',
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

    const handleSelect = (version: Version) => {
        setSelectedVersion(version);
        onSelect(version);
    };

    return (
        <Container>
            <HeaderSection>
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>← ย้อนกลับ</span>
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
                    <PageButton
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        ←
                    </PageButton>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PageButton key={page} $active={currentPage === page} onClick={() => setCurrentPage(page)}>
                            {page}
                        </PageButton>
                    ))}
                    <PageButton
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                    >
                        →
                    </PageButton>
                </Pagination>
            )}

            <NavigationButtons>
                <NavButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>← ย้อนกลับ</span>
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
