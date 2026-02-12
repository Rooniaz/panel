import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMicrochip, faServer, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, Hardware } from '@/api/spring/hardware';
import Spinner from '@/components/elements/Spinner';

// Animations
const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.02); }
`;

const glow = keyframes`
    0%, 100% { 
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3),
            0 0 0 1px rgba(59, 130, 246, 0.3);
    }
    50% { 
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(99, 102, 241, 0.5),
            0 0 0 1px rgba(59, 130, 246, 0.5);
    }
`;

const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const bounce = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
`;

const progressPulse = keyframes`
    0%, 100% { opacity: 1; transform: scaleY(1); }
    50% { opacity: 0.8; transform: scaleY(1.05); }
`;

const ProgressSection = styled.div`
    ${tw`rounded-3xl backdrop-blur-xl p-6 border mb-6`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-3 mb-6`};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-3 flex-1`};
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

const Container = styled.div`
    ${tw`w-full space-y-4 relative`}
    height: auto;
    margin-bottom: 0 !important;
    padding-bottom: 2rem !important;
    position: relative;
    z-index: 1;
    
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
const HeaderCard = styled.div`
    ${tw`rounded-2xl p-8 border border-white/10 backdrop-blur-sm relative`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
    }
`;

const HeaderTitle = styled.h2`
    ${tw`text-3xl font-bold text-white mb-2 flex items-center gap-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const HeaderSubtitle = styled.p`
    ${tw`text-neutral-400 text-sm`}
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl text-neutral-100 transition-all duration-300 border backdrop-blur-md self-start mb-4`};
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

const HardwareTypeCard = styled.div`
    ${tw`rounded-2xl p-6 border border-white/10 backdrop-blur-sm mb-6 relative`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;

    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const SectionTitle = styled.h3`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center gap-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const HardwareTypeGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 gap-6`}
`;

const HardwareTypeButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex flex-col items-center justify-center gap-5 p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    min-height: 200px;

    ${({ $selected }) =>
        $selected
            ? css`
                  border-color: rgba(59, 130, 246, 0.6);
                  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(59, 130, 246, 0.2);
                  transform: translateY(-4px) scale(1.01);
                  animation: ${glow} 2s ease-in-out infinite;
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
              `
            : css`
                  border-color: rgba(255, 255, 255, 0.1);
                  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
                  &:hover {
                      border-color: rgba(59, 130, 246, 0.4);
                      box-shadow: 0 15px 50px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.2),
                          inset 0 1px 0 rgba(255, 255, 255, 0.12);
                      transform: translateY(-2px);
                      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.97) 100%);
                  }
              `}

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        transition: left 0.5s;
    }

    &:hover::before {
        left: 100%;
    }
`;

const HardwareTypeIcon = styled.div<{ $selected: boolean }>`
    ${tw`flex items-center justify-center rounded-full shadow-lg overflow-hidden relative`}
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    padding: 16px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    ${({ $selected }) =>
        $selected &&
        css`
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(34, 211, 238, 0.3) 100%);
            border-color: rgba(59, 130, 246, 0.6);
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5), inset 0 0 30px rgba(59, 130, 246, 0.2);
            animation: ${pulse} 3s ease-in-out infinite;
        `}

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
        transition: all 0.3s;
    }

    ${HardwareTypeButton}:hover & {
        transform: scale(1.05);
        box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15);
    }
`;

const HardwareTypeName = styled.span<{ $selected: boolean }>`
    ${tw`text-2xl font-bold tracking-wide`}
    ${({ $selected }) =>
        $selected
            ? css`
                  background: linear-gradient(135deg, #ffffff 0%, #60a5fa 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              `
            : css`
                  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              `}
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10`}
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: ${pulse} 2s ease-in-out infinite;
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
`;

const ProcessorSection = styled.div`
    ${tw`space-y-6`}
`;

const ProcessorIcon = styled.div`
    ${tw`w-12 h-12 flex items-center justify-center rounded-xl`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    border: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
    }
`;

const ProcessorSubtitle = styled.h3`
    ${tw`text-xl font-bold`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const ProcessorSectionHeader = styled.div`
    ${tw`mb-6`}
`;

const ProcessorSectionTitle = styled.div`
    ${tw`flex items-center gap-3 mb-2`}
`;

const ProcessorSectionSubtitle = styled.p`
    ${tw`text-sm text-neutral-400 ml-11`}
`;

const ProcessorGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}
`;

const ProcessorCard = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    min-height: 100px;

    ${({ $selected }) =>
        $selected
            ? css`
                  border-color: rgba(59, 130, 246, 0.6);
                  box-shadow: 0 15px 50px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
                  transform: translateY(-2px) scale(1.01);
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
              `
            : css`
                  border-color: rgba(255, 255, 255, 0.1);
                  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
                  &:hover {
                      border-color: rgba(59, 130, 246, 0.4);
                      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.2),
                          inset 0 1px 0 rgba(255, 255, 255, 0.12);
                      transform: translateY(-2px);
                      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.97) 100%);
                  }
              `}

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        transition: left 0.5s;
    }

    &:hover::before {
        left: 100%;
    }
`;

const ProcessorInfo = styled.div`
    ${tw`flex-1`}
`;

const ProcessorName = styled.div<{ $selected: boolean }>`
    ${tw`text-lg font-bold mb-2 flex items-center flex-wrap gap-2`}
    ${({ $selected }) =>
        $selected
            ? css`
                  background: linear-gradient(135deg, #ffffff 0%, #60a5fa 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              `
            : css`
                  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              `}
`;

const ProcessorDescriptionText = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const NewBadge = styled.span`
    ${tw`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest relative overflow-hidden inline-flex items-center justify-center`}
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
    color: #1e293b;
    border: 1.5px solid rgba(251, 191, 36, 0.7);
    box-shadow: 0 0 25px rgba(251, 191, 36, 0.6), 0 4px 12px rgba(251, 191, 36, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(217, 119, 6, 0.3);
    animation: ${pulse} 2s ease-in-out infinite;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1;
    min-width: 36px;
    height: 20px;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        animation: ${shimmer} 2.5s infinite;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
        pointer-events: none;
    }
`;

const SelectionIndicator = styled.div`
    ${tw`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    border: 2px solid rgba(59, 130, 246, 0.3);
    transition: all 0.3s;

    ${ProcessorCard}[$selected="true"] & {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        border-color: rgba(34, 197, 94, 0.5);
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
    }
`;

const SpinnerContainer = styled.div`
    ${tw`flex items-center justify-center py-16`}
`;

const ErrorMessage = styled.div`
    ${tw`rounded-xl p-6 border border-red-500/50`}
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%);
    color: #fca5a5;
    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
`;

interface Props {
    onSelect: (hardware: Hardware) => void;
    onBack?: () => void;
}

export default ({ onSelect, onBack }: Props) => {
    const [hardwareList, setHardwareList] = useState<Hardware[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'AMD' | 'Intel' | null>(null);
    const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);
    const [progress, setProgress] = useState(40);

    useEffect(() => {
        // Animate progress from 40% to 60% (Step 3 of 5)
        setProgress(40);
        const timer = setTimeout(() => {
            setProgress(60);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchHardware = async () => {
            let attempts = 0;
            const maxAttempts = 10;
            const delay = 500;

            const waitForToken = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const checkToken = () => {
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                            resolve();
                        } else if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkToken, delay);
                        } else {
                            reject(
                                new Error('Authentication token not found. Please refresh the page and login again.')
                            );
                        }
                    };
                    checkToken();
                });
            };

            try {
                setLoading(true);
                setError(null);

                await waitForToken();

                const token = localStorage.getItem('auth_token');
                if (token) {
                    console.log('Token found, length:', token.length);
                    console.log('Token preview:', token.substring(0, 30) + '...');
                } else {
                    throw new Error('Token not found after waiting');
                }

                const data = await getHardwareList();
                setHardwareList(data);

                if (data.length > 0) {
                    const firstKey = data[0].key?.toUpperCase();
                    const firstType = (firstKey === 'AMD' ? 'AMD' : 'Intel') as 'AMD' | 'Intel';
                    setSelectedType(firstType);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load hardware');
            } finally {
                setLoading(false);
            }
        };

        fetchHardware();
    }, []);

    const amdHardware = hardwareList.filter((h) => h.key?.toUpperCase() === 'AMD');
    const intelHardware = hardwareList.filter((h) => h.key?.toUpperCase() === 'INTEL');
    const currentHardwareList = selectedType === 'AMD' ? amdHardware : intelHardware;

    const handleTypeSelect = (type: 'AMD' | 'Intel') => {
        setSelectedType(type);
        setSelectedHardware(null);
    };

    const handleProcessorSelect = (hardware: Hardware) => {
        setSelectedHardware(hardware);
        onSelect(hardware);
    };

    if (loading) {
        return (
            <Container>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faMicrochip} />
                        <span>เลือกฮาร์ดแวร์</span>
                    </HeaderTitle>
                    <HeaderSubtitle>เลือกประเภทและรุ่นของโปรเซสเซอร์ที่ต้องการ</HeaderSubtitle>
                </HeaderCard>
                <HardwareTypeCard>
                    <SpinnerContainer>
                        <Spinner size={'large'} />
                    </SpinnerContainer>
                </HardwareTypeCard>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faMicrochip} />
                        <span>เลือกฮาร์ดแวร์</span>
                    </HeaderTitle>
                    <HeaderSubtitle>เลือกประเภทและรุ่นของโปรเซสเซอร์ที่ต้องการ</HeaderSubtitle>
                </HeaderCard>
                <HardwareTypeCard>
                    <ErrorMessage>{error}</ErrorMessage>
                </HardwareTypeCard>
            </Container>
        );
    }

    return (
        <Container>
            {onBack && (
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>ย้อนกลับ</span>
                </BackButton>
            )}
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
                        <StepLabel $active={true}>เลือกฮาร์ดแวร์</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            4
                        </StepCircle>
                        <StepLabel $active={false}>เลือกแพ็กเกจ</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            5
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
            <HeaderCard>
                <HeaderTitle>
                    <FontAwesomeIcon icon={faMicrochip} />
                    <span>เลือกฮาร์ดแวร์</span>
                </HeaderTitle>
                <HeaderSubtitle>เลือกประเภทและรุ่นของโปรเซสเซอร์ที่ต้องการ</HeaderSubtitle>
            </HeaderCard>

            <HardwareTypeCard>
                <SectionTitle>
                    <FontAwesomeIcon icon={faServer} />
                    <span>เลือกประเภทโปรเซสเซอร์</span>
                </SectionTitle>
                <HardwareTypeGrid>
                    <HardwareTypeButton $selected={selectedType === 'AMD'} onClick={() => handleTypeSelect('AMD')}>
                        {selectedType === 'AMD' && (
                            <SelectedIndicator>
                                <FontAwesomeIcon icon={faCheck} className={'text-sm'} />
                            </SelectedIndicator>
                        )}
                        <HardwareTypeIcon $selected={selectedType === 'AMD'}>
                            <img src='/amd-icon.png' alt='AMD' />
                        </HardwareTypeIcon>
                        <HardwareTypeName $selected={selectedType === 'AMD'}>AMD</HardwareTypeName>
                    </HardwareTypeButton>

                    <HardwareTypeButton $selected={selectedType === 'Intel'} onClick={() => handleTypeSelect('Intel')}>
                        {selectedType === 'Intel' && (
                            <SelectedIndicator>
                                <FontAwesomeIcon icon={faCheck} className={'text-sm'} />
                            </SelectedIndicator>
                        )}
                        <HardwareTypeIcon $selected={selectedType === 'Intel'}>
                            <img src='/intel-icon.png' alt='Intel' />
                        </HardwareTypeIcon>
                        <HardwareTypeName $selected={selectedType === 'Intel'}>Intel</HardwareTypeName>
                    </HardwareTypeButton>
                </HardwareTypeGrid>
            </HardwareTypeCard>

            {selectedType && (
                <>
                    <ProcessorSectionHeader>
                        <ProcessorSectionTitle>
                            <ProcessorIcon>
                                <img
                                    src={selectedType === 'AMD' ? '/amd-icon.png' : '/intel-icon.png'}
                                    alt={selectedType}
                                />
                            </ProcessorIcon>
                            <ProcessorSubtitle>
                                {selectedType === 'AMD' ? 'AMD Processors' : 'Intel Processors'}
                            </ProcessorSubtitle>
                        </ProcessorSectionTitle>
                        <ProcessorSectionSubtitle>เลือกรุ่นโปรเซสเซอร์ที่ต้องการ</ProcessorSectionSubtitle>
                    </ProcessorSectionHeader>

                    <HardwareTypeCard>
                        <ProcessorSection>
                            <ProcessorGrid>
                                {currentHardwareList.map((hardware) => (
                                    <ProcessorCard
                                        key={hardware.id}
                                        $selected={selectedHardware?.id === hardware.id}
                                        onClick={() => handleProcessorSelect(hardware)}
                                    >
                                        <ProcessorInfo>
                                            <ProcessorName $selected={selectedHardware?.id === hardware.id}>
                                                {hardware.name}
                                                {hardware.priority === 0 && <NewBadge>NEW</NewBadge>}
                                            </ProcessorName>
                                            <ProcessorDescriptionText>{hardware.description}</ProcessorDescriptionText>
                                        </ProcessorInfo>
                                        <SelectionIndicator>
                                            {selectedHardware?.id === hardware.id && (
                                                <FontAwesomeIcon icon={faCheck} className={'text-xs text-white'} />
                                            )}
                                        </SelectionIndicator>
                                    </ProcessorCard>
                                ))}
                            </ProcessorGrid>
                        </ProcessorSection>
                    </HardwareTypeCard>
                </>
            )}
        </Container>
    );
};
