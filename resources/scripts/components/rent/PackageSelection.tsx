import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Package } from './RentServerContainer';
import { getHardwareDetail } from '@/api/spring/hardware';

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

const PackageGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}
`;

const PackageCard = styled.div<{ $isFull: boolean; $isRecommended?: boolean }>`
    ${tw`relative rounded-lg p-6 cursor-pointer transition-all duration-300`}
    ${(props) => (props.$isRecommended ? tw`border-2 border-blue-500 shadow-lg` : tw`border border-neutral-700`)}
    ${(props) => (props.$isFull ? tw`opacity-50 cursor-not-allowed` : tw`hover:border-blue-500 hover:shadow-lg`)}
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
    ${(props) =>
        props.$isRecommended
            ? 'box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5), 0 4px 6px -2px rgba(59, 130, 246, 0.3);'
            : ''}
`;

const PackageImage = styled.div`
    ${tw`w-full h-32 mb-4 rounded bg-neutral-800`}
    background-size: cover;
    background-position: center;
`;

const PackageHeader = styled.div`
    ${tw`flex items-center justify-between mb-4`}
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`}
`;

const StatusBadge = styled.div<{ $isFull: boolean }>`
    ${tw`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold`}
    ${(props) => (props.$isFull ? tw`bg-red-500/20 text-red-400` : tw`bg-green-500/20 text-green-400`)}
`;

const RecommendedBadge = styled.div`
    ${tw`absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1`}
`;

const SpecsList = styled.div`
    ${tw`space-y-2 mb-4`}
`;

const SpecItem = styled.div`
    ${tw`flex items-center space-x-2 text-neutral-300`}
`;

const PriceInfo = styled.div`
    ${tw`flex items-center justify-between mt-4 pt-4 border-t border-neutral-700`}
`;

const PriceText = styled.div`
    ${tw`flex items-center space-x-2 text-blue-400 font-semibold`}
`;

const BackButton = styled.button`
    ${tw`flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 transition-colors mb-6`}
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

const HeaderSection = styled.div`
    ${tw`flex items-center justify-between mb-6`}
`;

interface Props {
    hardwareId: string;
    onSelect: (pkg: Package) => void;
    onBack: () => void;
}

export default ({ hardwareId, onSelect, onBack }: Props) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                setError(null);
                const hardwareDetail = await getHardwareDetail(hardwareId);

                // Convert API response to Package format
                const allPackages: Package[] = [];
                let packageIndex = 1; // Temporary: use index as packageId until Spring Boot API returns it

                Object.values(hardwareDetail.categoryContainers).forEach((categoryPackages) => {
                    categoryPackages.forEach((pkg) => {
                        // Check if package is full (has containers)
                        const isFull = pkg.containers.length > 0;

                        // Check if it's Diamond Pack (recommended)
                        const isRecommended = pkg.name.toLowerCase().includes('diamond');

                        allPackages.push({
                            id: `${hardwareId}-${pkg.name}`,
                            packageId: packageIndex++, // TODO: Get real packageId from Spring Boot API
                            name: pkg.name,
                            cpu: parseInt(pkg.cpu, 10),
                            ram: parseInt(pkg.ram.replace(' GB', ''), 10),
                            storage: parseInt(pkg.storage.replace(' GB', ''), 10),
                            pricePerHour: pkg.hourlyRate,
                            isFull,
                            isRecommended,
                        });
                    });
                });

                // Sort by priority (recommended first, then by price)
                allPackages.sort((a, b) => {
                    if (a.isRecommended && !b.isRecommended) return -1;
                    if (!a.isRecommended && b.isRecommended) return 1;
                    return a.pricePerHour - b.pricePerHour;
                });

                setPackages(allPackages);
            } catch (err: any) {
                setError(err.message || 'Failed to load packages');
            } finally {
                setLoading(false);
            }
        };

        if (hardwareId) {
            fetchPackages();
        }
    }, [hardwareId]);

    if (loading) {
        return (
            <Container>
                <LoadingSpinner>
                    <div className='text-neutral-400'>กำลังโหลดแพ็กเกจ...</div>
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
            <HeaderSection>
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>← ย้อนกลับ</span>
                </BackButton>
            </HeaderSection>

            <SectionTitle>
                <TitleBar />
                <TitleText>เลือกแพ็กเกจ</TitleText>
            </SectionTitle>

            <PackageGrid>
                {packages.map((pkg) => (
                    <PackageCard
                        key={pkg.id}
                        $isFull={pkg.isFull}
                        $isRecommended={pkg.isRecommended}
                        onClick={() => !pkg.isFull && onSelect(pkg)}
                    >
                        {pkg.isRecommended && (
                            <RecommendedBadge>
                                <span>⭐</span>
                                <span>RECOMMEND</span>
                            </RecommendedBadge>
                        )}
                        <PackageImage />
                        <PackageHeader>
                            <PackageName>{pkg.name}</PackageName>
                            <StatusBadge $isFull={pkg.isFull}>
                                <span className={'w-2 h-2 rounded-full bg-current'} />
                                <span>{pkg.isFull ? 'เซิร์ฟเวอร์เต็ม' : 'พร้อมใช้งาน'}</span>
                            </StatusBadge>
                        </PackageHeader>
                        <SpecsList>
                            <SpecItem>
                                <FontAwesomeIcon icon={faMicrochip} />
                                <span>CPU {pkg.cpu} Core</span>
                            </SpecItem>
                            <SpecItem>
                                <FontAwesomeIcon icon={faMemory} />
                                <span>RAM {pkg.ram} GB</span>
                            </SpecItem>
                            <SpecItem>
                                <FontAwesomeIcon icon={faHdd} />
                                <span>Storage {pkg.storage} GB</span>
                            </SpecItem>
                        </SpecsList>
                        <PriceInfo>
                            <PriceText>
                                <FontAwesomeIcon icon={faClock} />
                                <span>ชั่วโมงละ {pkg.pricePerHour} เครดิต</span>
                            </PriceText>
                        </PriceInfo>
                    </PackageCard>
                ))}
            </PackageGrid>
        </Container>
    );
};
