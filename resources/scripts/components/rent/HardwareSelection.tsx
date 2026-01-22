import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, Hardware } from '@/api/spring/hardware';

const Container = styled.div`
    ${tw`space-y-8 relative w-full max-w-full`};
    background: linear-gradient(180deg, rgba(6, 12, 24, 0.9) 0%, rgba(4, 10, 20, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.04);
    box-shadow: 0 25px 60px -25px rgba(0, 0, 0, 0.55);
    border-radius: 20px;
    padding: 20px 12px;
    
    @media (min-width: 640px) {
        padding: 24px 16px;
    }
    
    @media (min-width: 1024px) {
        padding: 28px 20px;
    }
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.18), transparent 30%),
            radial-gradient(circle at 85% 0%, rgba(16, 185, 129, 0.16), transparent 30%);
        opacity: 0.9;
        pointer-events: none;
    }
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

const HardwareTypeGrid = styled.div`
    ${tw`grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8`};
`;

const HardwareTypeButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex flex-col items-center justify-center space-y-3 p-6 rounded-2xl border-2 transition-all`};
    background: linear-gradient(135deg, rgba(14, 23, 40, 0.9), rgba(8, 15, 28, 0.95));
    border-color: ${({ $selected }) => ($selected ? 'rgba(255, 185, 64, 0.9)' : 'rgba(255,255,255,0.06)')};
    box-shadow: ${({ $selected }) =>
        $selected
            ? '0 20px 35px -18px rgba(255,185,64,0.65), 0 10px 25px -20px rgba(59,130,246,0.45)'
            : '0 10px 25px -22px rgba(0,0,0,0.55)'};
    transform: ${({ $selected }) => ($selected ? 'translateY(-2px)' : 'none')};

    &:hover {
        border-color: rgba(255, 185, 64, 0.8);
        box-shadow: 0 18px 32px -20px rgba(255, 185, 64, 0.55), 0 12px 28px -24px rgba(59, 130, 246, 0.35);
        transform: translateY(-2px);
    }
`;

const HardwareTypeIcon = styled.div`
    ${tw`flex items-center justify-center rounded-full shadow-lg overflow-hidden`};
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    padding: 8px;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

const HardwareTypeName = styled.span`
    ${tw`text-xl font-bold text-white tracking-wide`};
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center`}
`;

const ProcessorSection = styled.div`
    ${tw`space-y-4 relative z-10`};
`;

const ProcessorHeader = styled.div`
    ${tw`flex items-center space-x-3 mb-4`};
`;

const ProcessorIcon = styled.div`
    ${tw`w-9 h-9 flex items-center justify-center rounded-full shadow-lg overflow-hidden`};
    background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
    padding: 4px;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

const ProcessorSubtitle = styled.h3`
    ${tw`text-lg font-semibold text-white tracking-wide`};
`;

const ProcessorGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5`};
`;

const ProcessorCard = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(12, 18, 36, 0.95));
    border-color: ${({ $selected }) => ($selected ? 'rgba(255,185,64,0.9)' : 'rgba(255,255,255,0.06)')};
    box-shadow: ${({ $selected }) =>
        $selected
            ? '0 14px 28px -18px rgba(255,185,64,0.65), 0 10px 24px -20px rgba(59,130,246,0.35)'
            : '0 12px 28px -24px rgba(0,0,0,0.6)'};
    transform: ${({ $selected }) => ($selected ? 'translateY(-2px)' : 'none')};

    &:hover {
        border-color: rgba(255, 185, 64, 0.8);
        transform: translateY(-2px);
    }
`;

const ProcessorInfo = styled.div`
    ${tw`flex-1`};
`;

const ProcessorName = styled.div`
    ${tw`text-lg font-semibold text-white mb-1`};
`;

const ProcessorDescription = styled.div`
    ${tw`text-sm text-neutral-400`};
`;

const NewBadge = styled.span`
    ${tw`ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs font-semibold tracking-wide`};
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12 text-neutral-300`};
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`};
`;

interface Props {
    onSelect: (hardware: Hardware) => void;
}

export default ({ onSelect }: Props) => {
    const [hardwareList, setHardwareList] = useState<Hardware[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'AMD' | 'Intel' | null>(null);
    const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);

    useEffect(() => {
        const fetchHardware = async () => {
            // Wait for token to be available (max 5 seconds)
            let attempts = 0;
            const maxAttempts = 10;
            const delay = 500; // 500ms

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

                // Wait for token before making API call
                await waitForToken();

                // Verify token exists and log it for debugging
                const token = localStorage.getItem('auth_token');
                if (token) {
                    console.log('Token found, length:', token.length);
                    console.log('Token preview:', token.substring(0, 30) + '...');
                } else {
                    throw new Error('Token not found after waiting');
                }

                const data = await getHardwareList();
                setHardwareList(data);

                // Auto-select first type if available
                if (data.length > 0) {
                    // ✅ แปลง key เป็น uppercase เพื่อเปรียบเทียบ (รองรับทั้ง 'AMD'/'INTEL' และ 'AMD'/'Intel')
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

    // ✅ Filter hardware โดยไม่สน case (uppercase/lowercase)
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
                <LoadingSpinner>
                    <div className='text-neutral-400'>กำลังโหลดข้อมูล...</div>
                </LoadingSpinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <ErrorMessage>{error}</ErrorMessage>
            </Container>
        );
    }

    return (
        <Container>
            <SectionTitle>
                <TitleBar />
                <TitleText>เลือกฮาร์ดแวร์</TitleText>
            </SectionTitle>

            <HardwareTypeGrid>
                <HardwareTypeButton $selected={selectedType === 'AMD'} onClick={() => handleTypeSelect('AMD')}>
                    {selectedType === 'AMD' && (
                        <SelectedIndicator>
                            <FontAwesomeIcon icon={faCheck} className='text-xs' />
                        </SelectedIndicator>
                    )}
                    <HardwareTypeIcon>
                        <img src="/amd-icon.png" alt="AMD" />
                    </HardwareTypeIcon>
                    <HardwareTypeName>AMD</HardwareTypeName>
                </HardwareTypeButton>

                <HardwareTypeButton $selected={selectedType === 'Intel'} onClick={() => handleTypeSelect('Intel')}>
                    {selectedType === 'Intel' && (
                        <SelectedIndicator>
                            <FontAwesomeIcon icon={faCheck} className='text-xs' />
                        </SelectedIndicator>
                    )}
                    <HardwareTypeIcon>
                        <img src="/intel-icon.png" alt="Intel" />
                    </HardwareTypeIcon>
                    <HardwareTypeName>Intel</HardwareTypeName>
                </HardwareTypeButton>
            </HardwareTypeGrid>

            {selectedType && (
                <ProcessorSection>
                    <ProcessorHeader>
                        <ProcessorIcon>
                            <img 
                                src={selectedType === 'AMD' ? '/amd-icon.png' : '/intel-icon.png'} 
                                alt={selectedType} 
                            />
                        </ProcessorIcon>
                        <ProcessorSubtitle>
                            {selectedType === 'AMD' ? 'AMD Processors' : 'Intel Processors'}
                        </ProcessorSubtitle>
                    </ProcessorHeader>
                    <div className='text-neutral-400 text-sm mb-4'>Select the hardware model you want.</div>

                    <ProcessorGrid>
                        {currentHardwareList.map((hardware) => (
                            <ProcessorCard
                                key={hardware.id}
                                $selected={selectedHardware?.id === hardware.id}
                                onClick={() => handleProcessorSelect(hardware)}
                            >
                                {selectedHardware?.id === hardware.id && (
                                    <SelectedIndicator>
                                        <FontAwesomeIcon icon={faCheck} className='text-xs' />
                                    </SelectedIndicator>
                                )}
                                <ProcessorInfo>
                                    <ProcessorName>
                                        {hardware.name}
                                        {hardware.priority === 0 && <NewBadge>NEW</NewBadge>}
                                    </ProcessorName>
                                    <ProcessorDescription>{hardware.description}</ProcessorDescription>
                                </ProcessorInfo>
                            </ProcessorCard>
                        ))}
                    </ProcessorGrid>
                </ProcessorSection>
            )}
        </Container>
    );
};
