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
    width: 100%;
`;

const SettingsCard = styled.div`
    ${tw`bg-neutral-800 rounded-lg p-6 space-y-6`}
`;

const SectionTitle = styled.h3`
    ${tw`text-xl font-bold text-white mb-4`}
`;

const GameSelectionInfo = styled.div`
    ${tw`flex items-center space-x-4 p-4 bg-neutral-700 rounded-lg`}
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

const InputGroup = styled.div`
    ${tw`space-y-2`}
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300 mb-2`}
`;

const Input = styled.input`
    ${tw`w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors`}
`;

const AddonSection = styled.div`
    ${tw`space-y-4`}
`;

const AddonItem = styled.div`
    ${tw`flex items-center justify-between p-4 bg-neutral-700 rounded-lg`}
`;

const AddonInfo = styled.div`
    ${tw`flex items-center space-x-3 flex-1`}
`;

const AddonIcon = styled.div`
    ${tw`w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white`}
`;

const AddonDetails = styled.div`
    ${tw`flex-1`}
`;

const AddonName = styled.h4`
    ${tw`text-white font-semibold`}
`;

const AddonDescription = styled.p`
    ${tw`text-sm text-neutral-400`}
`;

const FreeBadge = styled.span`
    ${tw`ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold`}
`;

const NavigationButtons = styled.div`
    ${tw`flex items-center justify-between mt-6`}
`;

const NavButton = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
    ${tw`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors`}
    ${(props) => {
        if (props.$disabled) return tw`opacity-50 cursor-not-allowed`;
        if (props.$primary)
            return tw`bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600`;
        return tw`bg-neutral-800 text-neutral-300 hover:bg-neutral-700`;
    }}
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
