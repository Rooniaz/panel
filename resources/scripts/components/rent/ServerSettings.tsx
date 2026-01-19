import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMicrochip,
    faMemory,
    faHdd,
    faClock,
    faArrowLeft,
    faCheck,
    faServer,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Package, GameType, Version } from './RentServerContainer';
import Switch from '@/components/elements/Switch';

const Container = styled.div`
    ${tw`space-y-6 w-full max-w-6xl mx-auto px-3 sm:px-0`};
`;

const HeaderSection = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-3 md:gap-4 mb-5 w-full`};
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-neutral-100 transition-all duration-200 border border-white/10 hover:-translate-y-0.5 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.35)] self-start`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.82));
    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.85));
    }
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-4 flex-1 flex-wrap text-center md:text-left w-full`};
`;

const PackageIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-lg`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const PackageDetails = styled.div`
    ${tw`space-y-1`};
`;

const PackageName = styled.h3`
    ${tw`text-base font-semibold text-white`};
`;

const PackageSpecs = styled.div`
    ${tw`flex items-center gap-3 text-sm text-gray-300`};
`;

const PriceButton = styled.div`
    ${tw`h-full flex items-center justify-center rounded-2xl px-4 py-3 text-white font-semibold border border-white/10 self-center md:self-center`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl border border-white/10 backdrop-blur shadow-[0_18px_45px_rgba(0,0,0,0.35)] p-4`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.74));
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
    width: 100%;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
`;

const SettingsCard = styled.div`
    ${tw`rounded-2xl p-6 space-y-6 border border-white/10 bg-white/5 backdrop-blur shadow-[0_18px_45px_rgba(0,0,0,0.35)]`};
`;

const SectionTitle = styled.h3`
    ${tw`text-lg font-bold text-white mb-4`};
`;

const GameSelectionInfo = styled.div`
    ${tw`flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5`};
`;

const GameIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl text-white text-xl flex items-center justify-center shadow-lg`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const GameDetails = styled.div`
    ${tw`flex-1`};
`;

const GameName = styled.h3`
    ${tw`text-base font-semibold text-white`};
`;

const GameVersion = styled.p`
    ${tw`text-xs text-gray-300`};
`;

const InputGroup = styled.div`
    ${tw`space-y-2`};
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-gray-200 mb-2`};
`;

const Input = styled.input`
    ${tw`w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 border border-white/10 bg-white/5 focus:outline-none transition-colors`};
    &:focus {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
`;

const AddonSection = styled.div`
    ${tw`space-y-4`};
`;

const AddonItem = styled.div`
    ${tw`flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5`};
`;

const AddonInfo = styled.div`
    ${tw`flex items-center gap-3 flex-1`};
`;

const AddonIcon = styled.div`
    ${tw`w-10 h-10 rounded-xl text-white flex items-center justify-center`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
`;

const AddonDetails = styled.div`
    ${tw`flex-1`};
`;

const AddonName = styled.h4`
    ${tw`text-white font-semibold`};
`;

const AddonDescription = styled.p`
    ${tw`text-sm text-gray-300`};
`;

const FreeBadge = styled.span`
    ${tw`ml-2 px-2 py-1 rounded text-xs font-semibold`};
    color: #dcfce7;
    border: 1px solid rgba(74, 222, 128, 0.4);
    background: rgba(74, 222, 128, 0.15);
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6`};
`;

const NavButton = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
    ${tw`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 font-semibold`};
    ${(props) => {
        if (props.$disabled) return tw`opacity-50 cursor-not-allowed bg-white/5 text-gray-200`;
        if (props.$primary) return tw`text-white shadow-[0_12px_30px_rgba(56,189,248,0.35)]`;
        return tw`text-gray-100 border border-white/10 bg-white/5 hover:bg-white/10`;
    }}
    ${(props) =>
        props.$primary
            ? `
        background: linear-gradient(135deg, #38bdf8, #6366f1);
        &:hover { background: linear-gradient(135deg, #38bdf8, #7c83ff); }
    `
            : ''};
`;

interface Props {
    selectedPackage: Package;
    selectedGame: GameType;
    selectedVersion: Version;
    serverName: string;
    onServerNameChange: (name: string) => void;
    onCreate: () => void;
    onBack: () => void;
    isCreating?: boolean;
    creationProgress?: string;
}

const LoadingOverlay = styled.div`
    ${tw`fixed inset-0 bg-black/80 z-50 flex items-center justify-center`}
`;

const LoadingCard = styled.div`
    ${tw`bg-neutral-800 rounded-lg p-8 max-w-md w-full mx-4`}
`;

const LoadingSpinner = styled.div`
    ${tw`w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}
`;

const ProgressText = styled.p`
    ${tw`text-center text-white text-lg font-semibold`}
`;

export default ({
    selectedPackage,
    selectedGame,
    selectedVersion,
    serverName,
    onServerNameChange,
    onCreate,
    onBack,
    isCreating = false,
    creationProgress = '',
}: Props) => {
    const [backupEnabled, setBackupEnabled] = React.useState(true);

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
                                <FontAwesomeIcon icon={faMicrochip} className='mr-1' />
                                {selectedPackage.cpu} vCPU
                            </span>
                            <span>
                                <FontAwesomeIcon icon={faMemory} className='mr-1' />
                                {selectedPackage.ram} GB RAM
                            </span>
                            <span>
                                <FontAwesomeIcon icon={faHdd} className='mr-1' />
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
                    <Step $active={false} $completed={true}>
                        <StepCircle $active={false} $completed={true}>
                            <FontAwesomeIcon icon={faCheck} />
                        </StepCircle>
                        <StepLabel $active={false}>เลือกเวอร์ชัน</StepLabel>
                    </Step>
                    <Step $active={true} $completed={false}>
                        <StepCircle $active={true} $completed={false}>
                            3
                        </StepCircle>
                        <StepLabel $active={true}>ตั้งค่าเซิร์ฟเวอร์</StepLabel>
                    </Step>
                </ProgressSteps>
                <ProgressBar>
                    <ProgressFill />
                </ProgressBar>
            </ProgressSection>

            <SettingsCard>
                <SectionTitle>ตั้งค่าเซิร์ฟเวอร์ของคุณ</SectionTitle>

                <GameSelectionInfo>
                    <GameIcon>{selectedGame.icon}</GameIcon>
                    <GameDetails>
                        <GameName>{selectedGame.name}</GameName>
                        <GameVersion>
                            {selectedVersion.name} | {selectedVersion.javaVersion}
                        </GameVersion>
                    </GameDetails>
                </GameSelectionInfo>

                <InputGroup>
                    <Label>
                        <FontAwesomeIcon icon={faServer} className='mr-2' />
                        ตั้งชื่อเซิร์ฟเวอร์:
                    </Label>
                    <Input
                        type='text'
                        placeholder='ชื่อเซิร์ฟเวอร์'
                        value={serverName}
                        onChange={(e) => onServerNameChange(e.target.value)}
                    />
                </InputGroup>

                <AddonSection>
                    <Label>บริการเสริม:</Label>
                    <AddonItem>
                        <AddonInfo>
                            <AddonIcon>
                                <FontAwesomeIcon icon={faHdd} />
                            </AddonIcon>
                            <AddonDetails>
                                <AddonName>
                                    ระบบสำรองข้อมูล (Backup System)
                                    <FreeBadge>ฟรี</FreeBadge>
                                </AddonName>
                                <AddonDescription>สำรองข้อมูลเซิร์ฟเวอร์อัตโนมัติ</AddonDescription>
                            </AddonDetails>
                        </AddonInfo>
                        <div className='flex items-center space-x-2'>
                            <FontAwesomeIcon icon={faInfoCircle} className='text-neutral-400' />
                            <Switch
                                name='backup'
                                defaultChecked={backupEnabled}
                                onChange={(e) => {
                                    setBackupEnabled(e.target.checked);
                                }}
                            />
                        </div>
                    </AddonItem>
                </AddonSection>
            </SettingsCard>

            <NavigationButtons>
                <NavButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>ย้อนกลับ</span>
                </NavButton>
                <NavButton $primary onClick={onCreate} $disabled={!serverName.trim() || isCreating}>
                    <FontAwesomeIcon icon={faServer} />
                    <span>
                        {isCreating
                            ? 'กำลังสร้าง...'
                            : `สร้างเซิร์ฟเวอร์ (${selectedPackage.pricePerHour} เครดิต / ชั่วโมง)`}
                    </span>
                </NavButton>
            </NavigationButtons>

            {isCreating && (
                <LoadingOverlay>
                    <LoadingCard>
                        <LoadingSpinner />
                        <ProgressText>{creationProgress || 'กำลังสร้าง Server...'}</ProgressText>
                    </LoadingCard>
                </LoadingOverlay>
            )}
        </Container>
    );
};
