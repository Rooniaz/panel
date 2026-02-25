import React from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
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

const Container = styled.div`
    ${tw`space-y-4 w-full max-w-6xl mx-auto px-3 sm:px-0`};
    position: relative;

    overflow: hidden;
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
    ${tw`flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-3 md:gap-4 mb-6 w-full`};
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
`;

const PackageInfo = styled.div`
    ${tw`flex flex-col md:flex-row items-center md:items-center justify-center gap-3 md:gap-4 flex-1 flex-wrap text-center w-full`};
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
    ${tw`space-y-1 flex flex-col items-center`};
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`};
    background: linear-gradient(135deg, #ffffff, #a0aec0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const PackageSpecs = styled.div`
    ${tw`flex items-center justify-center gap-4 text-sm flex-wrap`};
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
    ${tw`rounded-2xl sm:rounded-3xl backdrop-blur-xl p-3 sm:p-4 md:p-6 border`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-1 sm:gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap`};
    @media (max-width: 640px) {
        gap: 0.25rem;
    }
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-1 sm:gap-2 md:gap-3 flex-1 min-w-[0]`};
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

const SettingsCard = styled.div`
    ${tw`rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 backdrop-blur-xl relative overflow-hidden`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));

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

const SectionTitle = styled.h3`
    ${tw`text-2xl font-bold mb-6 relative z-10`};
    background: linear-gradient(135deg, #ffffff, #a0aec0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const GameSelectionInfo = styled.div`
    ${tw`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl relative overflow-hidden`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));

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

const GameIcon = styled.div`
    ${tw`w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-2xl relative z-10 transition-transform duration-300`};
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);

    ${GameSelectionInfo}:hover & {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 15px 40px rgba(59, 130, 246, 0.6);
    }
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

const InputGroup = styled.div`
    ${tw`space-y-3 relative z-10`};
`;

const Label = styled.label`
    ${tw`block text-sm font-bold text-gray-200 mb-3 flex items-center gap-2`};
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const Input = styled.input`
    ${tw`w-full px-5 py-4 rounded-2xl text-white placeholder-gray-500 border transition-all duration-300 relative z-10`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);

    &:focus {
        outline: none;
        border-color: rgba(59, 130, 246, 0.8);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 12px 40px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }

    &::placeholder {
        color: rgba(156, 163, 175, 0.6);
    }
`;

const AddonSection = styled.div`
    ${tw`space-y-5 relative z-10`};
`;

const AddonItem = styled.div`
    ${tw`flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all duration-300`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);

    &:hover {
        border-color: rgba(59, 130, 246, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 15px 50px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

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

const AddonInfo = styled.div`
    ${tw`flex items-center gap-4 flex-1 relative z-10`};
`;

const AddonIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl text-white flex items-center justify-center relative z-10 transition-transform duration-300`};
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);

    ${AddonItem}:hover & {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.6);
    }
`;

const AddonDetails = styled.div`
    ${tw`flex-1 relative z-10`};
`;

const AddonName = styled.h4`
    ${tw`text-white font-bold mb-1 flex items-center gap-2`};
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const AddonDescription = styled.p`
    ${tw`text-sm text-gray-300`};
`;

const ErrorMessage = styled.div`
    ${tw`mt-2 p-3 rounded-xl flex items-center gap-2 text-sm`};
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    animation: ${pulse} 2s ease-in-out infinite;
`;

const InputError = styled(Input)`
    border-color: rgba(239, 68, 68, 0.6) !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15), 0 8px 32px rgba(0, 0, 0, 0.2) !important;

    &:focus {
        border-color: rgba(239, 68, 68, 0.8) !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2), 0 12px 40px rgba(239, 68, 68, 0.3) !important;
    }
`;

const FreeBadge = styled.span`
    ${tw`px-3 py-1 rounded-lg text-xs font-bold`};
    color: #dcfce7;
    border: 1px solid rgba(74, 222, 128, 0.4);
    background: rgba(74, 222, 128, 0.15);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8`};
`;

const NavButton = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
    ${tw`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl transition-all duration-300 font-bold relative overflow-hidden`};
    ${(props) => {
        if (props.$disabled) return tw`opacity-50 cursor-not-allowed bg-white/5 text-gray-200`;
        if (props.$primary) return tw`text-white`;
        return tw`text-gray-100 border border-white/10 bg-white/5 hover:bg-white/10`;
    }}
    ${(props) =>
        props.$primary &&
        !props.$disabled &&
        css`
            background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
            background-size: 200% 200%;
            animation: ${gradientShift} 3s ease infinite;
            box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
            &:hover {
                animation: ${glow} 2s ease-in-out infinite;
                transform: translateY(-2px);
            }
        `};

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

const LoadingOverlay = styled.div`
    ${tw`fixed inset-0 z-[9999] flex items-center justify-center`}
    background: linear-gradient(135deg, rgba(12, 18, 38, 0.98), rgba(15, 23, 42, 0.98));
    backdrop-filter: blur(20px);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
        animation: ${pulse} 3s ease-in-out infinite;
    }
`;

const LoadingCard = styled.div`
    ${tw`relative rounded-3xl p-12 max-w-lg w-full mx-4 border backdrop-blur-xl`}
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 60px rgba(59, 130, 246, 0.2);
    animation: ${glow} 3s ease-in-out infinite;

    &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
        background-size: 200% 200%;
        animation: ${gradientShift} 3s ease infinite;
        border-radius: inherit;
        z-index: -1;
        opacity: 0.5;
        filter: blur(10px);
    }
`;

const LoadingSpinner = styled.div`
    ${tw`w-24 h-24 rounded-full mx-auto mb-8 relative`}
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-right-color: #6366f1;
    animation: spin 1s linear infinite;

    &::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 4px solid transparent;
        border-top-color: #8b5cf6;
        border-right-color: #3b82f6;
        animation: spin 1.5s linear infinite reverse;
        filter: blur(2px);
    }

    &::after {
        content: '';
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
        animation: ${pulse} 2s ease-in-out infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const ProgressText = styled.p`
    ${tw`text-center text-white text-2xl font-bold mb-2 relative z-10`}
    background: linear-gradient(135deg, #ffffff, #a0aec0, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    animation: ${pulse} 2s ease-in-out infinite;
`;

const ProgressSubtext = styled.p`
    ${tw`text-center text-gray-400 text-sm mt-2 relative z-10`}
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
    const [progress, setProgress] = React.useState(80);

    React.useEffect(() => {
        // 4 ขั้น: step 4 = ตั้งค่าเซิร์ฟเวอร์
        setProgress(75);
        const timer = setTimeout(() => {
            setProgress(100);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Container>
            <HeaderSection>
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>กลับไปเลือกเกม</span>
                </BackButton>
                <PackageInfo>
                    {/* <PackageIcon>💎</PackageIcon> */}
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
                    <Step $active={false} $completed={true}>
                        <StepCircle $active={false} $completed={true}>
                            <FontAwesomeIcon icon={faCheck} />
                        </StepCircle>
                        <StepLabel $active={false}>เลือกเวอร์ชัน</StepLabel>
                    </Step>
                    <Step $active={false} $completed={true}>
                        <StepCircle $active={false} $completed={true}>
                            <FontAwesomeIcon icon={faCheck} />
                        </StepCircle>
                        <StepLabel $active={false}>เลือกฮาร์ดแวร์ & แพ็กเกจ</StepLabel>
                    </Step>
                    <Step $active={true} $completed={false}>
                        <StepCircle $active={true} $completed={false}>
                            4
                        </StepCircle>
                        <StepLabel $active={true}>ตั้งค่าเซิร์ฟเวอร์</StepLabel>
                    </Step>
                </ProgressSteps>
                <ProgressBar>
                    <ProgressFill $progress={progress} />
                    <ProgressIcon $progress={progress}>
                        <img src='/Grass-Block.png' alt='Progress' />
                    </ProgressIcon>
                </ProgressBar>
            </ProgressSection>

            <SettingsCard>
                <SectionTitle>ตั้งค่าเซิร์ฟเวอร์ของคุณ</SectionTitle>

                <GameSelectionInfo>
                    <GameIcon>{selectedGame.icon}</GameIcon>
                    <GameDetails>
                        <GameName>{selectedGame.name}</GameName>
                        <GameVersion>{selectedVersion.name}</GameVersion>
                    </GameDetails>
                </GameSelectionInfo>

                <InputGroup>
                    <Label>
                        <FontAwesomeIcon icon={faServer} />
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
                        <div className='flex items-center space-x-2 relative z-10'>
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
                        <ProgressSubtext>กรุณารอสักครู่ ระบบกำลังดำเนินการ</ProgressSubtext>
                    </LoadingCard>
                </LoadingOverlay>
            )}
        </Container>
    );
};
