import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faArrowLeft, faCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Package, GameType } from './RentServerContainer';
import { getEggs, Egg } from '@/api/spring/eggs';

const Container = styled.div`
    ${tw`space-y-6 w-full max-w-4xl mx-auto px-3 sm:px-0 overflow-x-hidden`};
`;

const HeaderSection = styled.div`
    ${tw`flex flex-col lg:flex-row gap-3 lg:items-stretch lg:justify-between mb-4`};
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-neutral-100 transition-all duration-200 border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-800 hover:to-slate-700 hover:-translate-y-0.5 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.35)] w-full lg:w-auto min-h-[70px]`};
`;

const HeaderCards = styled.div`
    ${tw`flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`};
`;

const Card = styled.div`
    ${tw`rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/70 backdrop-blur shadow-[0_18px_45px_rgba(0,0,0,0.35)] p-4 flex items-center gap-3 min-h-[90px]`};
`;

const PackageIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-2xl flex items-center justify-center shadow-lg`};
`;

const PackageDetails = styled.div`
    ${tw`space-y-1 flex-1`};
`;

const PackageName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const PackageSpecs = styled.div`
    ${tw`flex flex-wrap gap-3 text-sm text-slate-200`};
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
            ? tw`bg-emerald-500 text-white`
            : props.$active
            ? tw`bg-sky-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.45)]`
            : tw`bg-white/10 text-slate-300 border border-white/10`};
`;

const StepLabel = styled.span<{ $active: boolean }>`
    ${tw`text-sm`};
    ${(props) => (props.$active ? tw`text-white font-semibold` : tw`text-slate-300`)}
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
    ${tw`w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-xl flex items-center justify-center shadow-lg`};
`;

const GameDetails = styled.div`
    ${tw`flex-1`};
`;

const GameName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const EggGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4`};
`;

const EggCard = styled.div<{ $selected: boolean }>`
    ${tw`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border`};
    ${(props) =>
        props.$selected
            ? tw`border-sky-400 shadow-[0_16px_40px_rgba(56,189,248,0.25)] bg-sky-500/10`
            : tw`border-white/10 hover:border-sky-400/80 bg-white/5 hover:-translate-y-0.5`};
`;

const EggIcon = styled.div`
    ${tw`w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-lg flex items-center justify-center mb-3`};
`;

const EggName = styled.h3`
    ${tw`text-base font-semibold text-white mb-1`};
`;

const EggDescription = styled.p`
    ${tw`text-slate-300 text-sm mb-2 leading-relaxed`};
`;

const DockerImages = styled.div`
    ${tw`flex flex-wrap gap-2 mt-2`};
`;

const DockerImageTag = styled.span`
    ${tw`px-2 py-1 rounded-full text-xs text-slate-100 border border-white/10 bg-white/10`};
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white`};
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12 text-slate-300`};
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500/60 rounded-2xl p-4 text-red-100`};
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6`};
`;

const NavButton = styled.button<{ $primary?: boolean }>`
    ${tw`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 font-semibold`};
    ${(props) =>
        props.$primary
            ? tw`text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow-[0_12px_30px_rgba(56,189,248,0.35)] hover:from-sky-500 hover:to-indigo-400`
            : tw`text-slate-100 border border-white/10 bg-white/5 hover:bg-white/10`};
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
                    <span>ย้อนกลับ</span>
                </BackButton>
                <HeaderCards>
                    <Card>
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
                    </Card>
                    <Card>
                        <PackageDetails>
                            <PackageName>เครดิต / ชั่วโมง</PackageName>
                            <PackageSpecs>
                                <span className='text-2xl font-semibold text-white'>
                                    {selectedPackage.pricePerHour}
                                </span>
                                <span className='text-slate-300'>เครดิต</span>
                                <span className='text-slate-400'>/ ชั่วโมง</span>
                            </PackageSpecs>
                        </PackageDetails>
                    </Card>
                    <Card>
                        <PackageDetails>
                            <PackageName>ขั้นตอน 2 / 3</PackageName>
                            <PackageSpecs>
                                <span className='text-slate-300'>เลือกเวอร์ชันเกมที่ต้องการ</span>
                            </PackageSpecs>
                        </PackageDetails>
                    </Card>
                </HeaderCards>
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
                    <span>ย้อนกลับ</span>
                </NavButton>
                <NavButton $primary onClick={() => selectedEgg && onSelect(selectedEgg)} disabled={!selectedEgg}>
                    <span>ถัดไป</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                </NavButton>
            </NavigationButtons>
        </Container>
    );
};
