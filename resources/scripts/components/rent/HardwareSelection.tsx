import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, Hardware } from '@/api/spring/hardware';

const Container = styled.div`
    ${tw`space-y-6`}
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
    ${tw`grid grid-cols-2 gap-6 mb-8`}
`;

const HardwareTypeButton = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center justify-center space-x-4 p-6 rounded-lg border-2 transition-all`}
    ${(props) =>
        props.$selected
            ? tw`border-yellow-500 shadow-lg`
            : tw`border-neutral-700 bg-neutral-800 hover:border-yellow-400`}
    ${(props) =>
        props.$selected
            ? `
                background-color: rgba(234, 179, 8, 0.1);
                box-shadow: 0 10px 15px -3px rgba(234, 179, 8, 0.5), 0 4px 6px -2px rgba(234, 179, 8, 0.3);
            `
            : ''}
`;

const HardwareTypeIcon = styled.div`
    ${tw`w-16 h-16 flex items-center justify-center text-4xl`}
`;

const HardwareTypeName = styled.span`
    ${tw`text-xl font-bold text-white`}
`;

const SelectedIndicator = styled.div`
    ${tw`absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center`}
`;

const ProcessorSection = styled.div`
    ${tw`space-y-4`}
`;

const ProcessorHeader = styled.div`
    ${tw`flex items-center space-x-3 mb-4`}
`;

const ProcessorIcon = styled.div`
    ${tw`w-8 h-8 flex items-center justify-center text-xl`}
`;

const ProcessorSubtitle = styled.h3`
    ${tw`text-lg font-semibold text-white`}
`;

const ProcessorGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 gap-4`}
`;

const ProcessorCard = styled.button<{ $selected: boolean }>`
    ${tw`relative flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left`}
    ${(props) =>
        props.$selected
            ? tw`border-yellow-500 shadow-lg`
            : tw`border-neutral-700 bg-neutral-800 hover:border-yellow-400`}
    ${(props) =>
        props.$selected
            ? `
                background-color: rgba(234, 179, 8, 0.1);
                box-shadow: 0 10px 15px -3px rgba(234, 179, 8, 0.5), 0 4px 6px -2px rgba(234, 179, 8, 0.3);
            `
            : ''}
`;

const ProcessorInfo = styled.div`
    ${tw`flex-1`}
`;

const ProcessorName = styled.div`
    ${tw`text-lg font-semibold text-white mb-1`}
`;

const ProcessorDescription = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const NewBadge = styled.span`
    ${tw`ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold`}
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
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
                    const firstType = data[0].key as 'AMD' | 'Intel';
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

    const amdHardware = hardwareList.filter((h) => h.key === 'AMD');
    const intelHardware = hardwareList.filter((h) => h.key === 'Intel');
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
                    <HardwareTypeIcon>⚡</HardwareTypeIcon>
                    <HardwareTypeName>AMD</HardwareTypeName>
                </HardwareTypeButton>

                <HardwareTypeButton $selected={selectedType === 'Intel'} onClick={() => handleTypeSelect('Intel')}>
                    {selectedType === 'Intel' && (
                        <SelectedIndicator>
                            <FontAwesomeIcon icon={faCheck} className='text-xs' />
                        </SelectedIndicator>
                    )}
                    <HardwareTypeIcon>🔷</HardwareTypeIcon>
                    <HardwareTypeName>Intel</HardwareTypeName>
                </HardwareTypeButton>
            </HardwareTypeGrid>

            {selectedType && (
                <ProcessorSection>
                    <ProcessorHeader>
                        <ProcessorIcon>{selectedType === 'AMD' ? '⚡' : '🔷'}</ProcessorIcon>
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
