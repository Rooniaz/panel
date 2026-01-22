import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Package } from './RentServerContainer';
import { getHardwareDetail } from '@/api/spring/hardware';

const Container = styled.div`
    ${tw`space-y-6 w-full max-w-6xl mx-auto px-3 sm:px-0`};
`;

const SectionTitle = styled.div`
    ${tw`flex items-center gap-3 mb-4`};
`;

const TitleBar = styled.div`
    ${tw`w-1.5 h-9 rounded-full`};
    background: linear-gradient(180deg, #38bdf8, #6366f1);
`;

const TitleText = styled.h2`
    ${tw`text-2xl font-bold text-white tracking-tight`};
`;

const PackageGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`};
`;

const PackageCard = styled.div<{ $isFull: boolean; $isRecommended?: boolean }>`
    ${tw`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border`};
    background: linear-gradient(135deg, rgba(16, 24, 40, 0.9), rgba(8, 15, 30, 0.9));
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    ${(props) => (props.$isRecommended ? tw`shadow-[0_8px_20px_rgba(56,189,248,0.15)]` : tw`border-white/5 hover:-translate-y-1`)};
    ${(props) =>
        props.$isRecommended
            ? `
        border-color: rgba(56, 189, 248, 0.3);
    `
            : `
        border-color: rgba(255,255,255,0.05);s
        &:hover { border-color: rgba(56, 189, 248, 0.3); }
    `};
    ${(props) => (props.$isFull ? tw`opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-white/5` : '')};
`;

const PackageImage = styled.div<{ $backgroundImage?: string }>`
    ${tw`w-full h-32 mb-4 rounded-xl`}
    background: ${({ $backgroundImage }) =>
        $backgroundImage
            ? `url(${$backgroundImage})`
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08))'};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 1px solid rgba(255, 255, 255, 0.06);
`;

const PackageHeader = styled.div`
    ${tw`flex items-center justify-between mb-3`};
`;

const PackageName = styled.h3`
    ${tw`text-lg font-semibold text-white`};
`;

const StatusBadge = styled.div<{ $isFull: boolean }>`
    ${tw`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border`};
    ${(props) =>
        props.$isFull
            ? `
        border: 1px solid rgba(248, 113, 113, 0.55);
        color: #fecdd3;
        background: rgba(248, 113, 113, 0.12);
    `
            : `
        border: 1px solid rgba(74, 222, 128, 0.55);
        color: #dcfce7;
        background: rgba(74, 222, 128, 0.12);
    `};
`;

const RecommendedBadge = styled.div`
    ${tw`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 text-white border border-white/10`};
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 12px 28px rgba(99, 102, 241, 0.35);
`;

const SpecsList = styled.div`
    ${tw`space-y-2 mb-4 text-gray-200`};
`;

const SpecItem = styled.div`
    ${tw`flex items-center gap-2 text-sm`};
`;

const PriceInfo = styled.div`
    ${tw`flex items-center justify-between pt-4 border-t border-white/10`};
`;

const PriceText = styled.div`
    ${tw`flex items-center space-x-2 font-semibold text-primary-300`};
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-neutral-100 transition-all duration-200 border border-white/10 hover:-translate-y-0.5 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.35)] mb-4`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.82));
    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.85));
    }
`;

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-12 text-gray-300`};
`;

const ErrorMessage = styled.div`
    ${tw`rounded-2xl p-4`};
    border: 1px solid rgba(248, 113, 113, 0.6);
    background: rgba(248, 113, 113, 0.12);
    color: #fecdd3;
`;

const HeaderSection = styled.div`
    ${tw`flex items-center justify-between mb-4`};
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
                        // Get real packageId from API (fallback to index if not provided)
                        const packageId = pkg.packageId || packageIndex++;

                        // Use price from packages table if available, otherwise use hourlyRate
                        const pricePerHour = pkg.price ?? pkg.hourlyRate;

                        // Get capacity and rented count from API
                        const capacity = pkg.capacity;
                        const rentedCount = pkg.rentedCount ?? 0;
                        const availableCount = pkg.availableCount ?? (capacity ? capacity - rentedCount : undefined);

                        // Check if package is full
                        // If capacity is provided, use it. Otherwise, check containers.length as fallback
                        const isFull = capacity !== undefined 
                            ? rentedCount >= capacity 
                            : pkg.containers.length > 0;

                        // Check if it's Diamond Pack (recommended)
                        const isRecommended = pkg.name.toLowerCase().includes('diamond');

                        allPackages.push({
                            id: `${hardwareId}-${pkg.name}`,
                            packageId: packageId,
                            name: pkg.name,
                            cpu: parseInt(pkg.cpu, 10),
                            ram: parseInt(pkg.ram.replace(' GB', ''), 10),
                            storage: parseInt(pkg.storage.replace(' GB', ''), 10),
                            pricePerHour: pricePerHour, // Use price from packages table
                            isFull: isFull,
                            isRecommended: isRecommended,
                            capacity: capacity,
                            rentedCount: rentedCount,
                            availableCount: availableCount,
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
                    <span>ย้อนกลับ</span>
                </BackButton>
            </HeaderSection>

            <SectionTitle>
                <TitleBar />
                <TitleText>เลือกแพ็กเกจ</TitleText>
            </SectionTitle>

            <PackageGrid>
                {packages.map((pkg) => {
                    // Get package background image (package1.gif to package6.gif)
                    const base = process.env.PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                    const packageImage = `${base}/package${pkg.packageId}.gif?v=1`;

                    return (
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
                            <PackageImage $backgroundImage={packageImage} />
                        <PackageHeader>
                            <PackageName>{pkg.name}</PackageName>
                            <StatusBadge $isFull={pkg.isFull}>
                                <span className={'w-2 h-2 rounded-full bg-current'} />
                                <span>
                                    {pkg.isFull 
                                        ? 'เซิร์ฟเวอร์เต็ม' 
                                        : pkg.availableCount !== undefined 
                                            ? `เหลือ ${pkg.availableCount} อัน` 
                                            : 'พร้อมใช้งาน'}
                                </span>
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
                    );
                })}
            </PackageGrid>
        </Container>
    );
};
