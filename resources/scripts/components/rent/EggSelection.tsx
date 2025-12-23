import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType } from './RentServerContainer';
import { getEggs, Egg } from '@/api/spring/eggs';

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

const EggGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6`}
`;

const EggCard = styled.div<{ $selected: boolean }>`
    ${tw`relative rounded-lg p-6 cursor-pointer transition-all duration-300 border-2`}
    ${(props) =>
        props.$selected
            ? tw`border-blue-500 shadow-lg bg-blue-500/10`
            : tw`border-neutral-700 hover:border-blue-400 bg-neutral-800`}
`;

const EggIcon = styled.div`
    ${tw`w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl mb-4`}
`;

const EggName = styled.h3`
    ${tw`text-lg font-bold text-white mb-2`}
`;

const EggDescription = styled.p`
    ${tw`text-neutral-400 text-sm mb-3 line-clamp-2`}
`;

const DockerImages = styled.div`
    ${tw`flex flex-wrap gap-2 mt-3`}
`;

const DockerImageTag = styled.span`
    ${tw`px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300`}
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center`}
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
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
    onSelect: (egg: Egg) => void;
    onBack: () => void;
}

export default ({ selectedPackage, selectedGame, onSelect, onBack }: Props) => {
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [eggs, setEggs] = useState<Egg[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEggs = async () => {
            try {
                setLoading(true);
                setError(null);
                const gameKey = getGameKey(selectedGame.id);
                const response = await getEggs(gameKey, selectedPackage.packageId);
                setEggs(response.eggs);
            } catch (err: any) {
                setError(err.message || 'Failed to load eggs');
            } finally {
                setLoading(false);
            }
        };

        if (selectedGame && selectedPackage) {
            fetchEggs();
        }
    }, [selectedGame, selectedPackage]);

    const handleSelect = (egg: Egg) => {
        setSelectedEgg(egg);
        onSelect(egg);
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
                        <StepLabel $active={true}>เลือก Egg</StepLabel>
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
                <TitleText>เลือก Egg สำหรับ {selectedGame.name}</TitleText>
            </SectionTitle>

            <GameInfo>
                <GameIcon>{selectedGame.icon}</GameIcon>
                <GameDetails>
                    <GameName>{selectedGame.name}</GameName>
                </GameDetails>
            </GameInfo>

            {loading ? (
                <LoadingSpinner>
                    <div className='text-neutral-400'>กำลังโหลด Eggs...</div>
                </LoadingSpinner>
            ) : error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : (
                <>
                    <EggGrid>
                        {eggs.map((egg) => (
                            <EggCard
                                key={egg.id}
                                $selected={selectedEgg?.id === egg.id}
                                onClick={() => handleSelect(egg)}
                            >
                                {selectedEgg?.id === egg.id && (
                                    <SelectedIndicator>
                                        <FontAwesomeIcon icon={faCheck} className={'text-xs'} />
                                    </SelectedIndicator>
                                )}
                                <EggIcon>🥚</EggIcon>
                                <EggName>{egg.name}</EggName>
                                <EggDescription>{egg.description}</EggDescription>
                                {egg.dockerImages && Object.keys(egg.dockerImages).length > 0 && (
                                    <DockerImages>
                                        {Object.keys(egg.dockerImages)
                                            .slice(0, 3)
                                            .map((key) => (
                                                <DockerImageTag key={key}>{key}</DockerImageTag>
                                            ))}
                                        {Object.keys(egg.dockerImages).length > 3 && (
                                            <DockerImageTag>+{Object.keys(egg.dockerImages).length - 3}</DockerImageTag>
                                        )}
                                    </DockerImages>
                                )}
                            </EggCard>
                        ))}
                    </EggGrid>
                </>
            )}

            <NavigationButtons>
                <NavButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>← ย้อนกลับ</span>
                </NavButton>
                <NavButton $primary onClick={() => selectedEgg && onSelect(selectedEgg)} disabled={!selectedEgg}>
                    <span>ถัดไป →</span>
                </NavButton>
            </NavigationButtons>
        </Container>
    );
};
