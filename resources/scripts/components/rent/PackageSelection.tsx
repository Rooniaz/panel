import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Package } from './RentServerContainer';
import { getHardwareDetail } from '@/api/spring/hardware';
import { getAvailabilityBadge } from '@/api/spring/packageAvailability';

// Animations
const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
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

const bounce = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
`;

const progressPulse = keyframes`
    0%, 100% { opacity: 1; transform: scaleY(1); }
    50% { opacity: 0.8; transform: scaleY(1.05); }
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl sm:rounded-3xl backdrop-blur-xl p-3 sm:p-4 md:p-6 border mb-4 sm:mb-6`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-1 sm:gap-2 md:gap-3 mb-4 md:mb-6`};
    @media (max-width: 640px) {
        gap: 0.25rem;
    }
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-1 sm:gap-2 md:gap-3 flex-1`};
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
    ${tw`space-y-4 w-full max-w-6xl mx-auto px-3 sm:px-0`};
    position: relative;
    /* แก้ไขจุดนี้: เปลี่ยนจาก 200% เป็นค่าที่พอดีกับ Container */
    overflow: hidden; /* ตัดส่วนที่ฟุ้งเกินขอบออก */
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
const SectionTitle = styled.div`
    ${tw`flex items-center gap-4 mb-6`};
`;

const TitleBar = styled.div`
    ${tw`w-2 h-12 rounded-full relative overflow-hidden`};
    background: linear-gradient(180deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 100% 200%;
    animation: ${gradientShift} 3s ease infinite;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
`;

const TitleText = styled.h2`
    ${tw`text-3xl font-bold tracking-tight`};
    background: linear-gradient(135deg, #ffffff, #a0aec0, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
`;

const PackageGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 p-1 sm:p-2`};
    overflow: visible;
`;

const PackageCard = styled.div<{ $isFull: boolean; $isRecommended?: boolean }>`
    ${tw`relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-300 overflow-hidden`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
    backdrop-filter: blur(10px);
    ${(props) =>
        props.$isRecommended
            ? css`
                  animation: ${glow} 3s ease-in-out infinite;
              `
            : css`
                  &:hover {
                      transform: translateY(-6px) scale(1.02);
                  }
              `};
    ${(props) => (props.$isFull ? tw`opacity-50 cursor-not-allowed hover:translate-y-0` : '')};

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

    &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s;
    }

    &:hover::after {
        opacity: 1;
    }
`;

const PackageImage = styled.div<{ $backgroundImage?: string }>`
    ${tw`w-full h-40 mb-5 rounded-2xl relative overflow-hidden`}
    background: ${({ $backgroundImage }) =>
        $backgroundImage
            ? `url(${$backgroundImage})`
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15))'};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: ${shimmer} 3s infinite;
    }

    ${PackageCard}:hover & {
        transform: scale(1.05);
    }
`;

const PackageHeader = styled.div`
    ${tw`flex items-center justify-between mb-4`};
`;

const PackageName = styled.h3`
    ${tw`text-xl font-bold text-white`};
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const StatusBadge = styled.div<{ $status?: 'available' | 'limited' | 'unavailable' }>`
    ${tw`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border`};
    ${(props) => {
        const status = props.$status || 'available';
        if (status === 'unavailable') {
            return `
                border: 1px solid rgba(248, 113, 113, 0.6);
                color: #fecdd3;
                background: rgba(248, 113, 113, 0.15);
                box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
            `;
        } else if (status === 'limited') {
            return `
                border: 1px solid rgba(251, 191, 36, 0.6);
                color: #fef3c7;
                background: rgba(251, 191, 36, 0.15);
                box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
            `;
        } else {
            return `
                border: 1px solid rgba(74, 222, 128, 0.6);
                color: #dcfce7;
                background: rgba(74, 222, 128, 0.15);
                box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
            `;
        }
    }};
`;

const RecommendedBadge = styled.div`
    ${tw`absolute top-5 right-5 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 text-white border z-20`};
    background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 200% 200%;
    animation: ${gradientShift} 3s ease infinite;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
    animation: ${pulse} 2s ease-in-out infinite, ${gradientShift} 3s ease infinite;

    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: inherit;
        background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
        opacity: 0.5;
        filter: blur(8px);
        z-index: -1;
    }
`;

const SpecsList = styled.div`
    ${tw`space-y-3 mb-5`};
`;

const SpecItem = styled.div`
    ${tw`flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all duration-300`};
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: rgba(203, 213, 225, 0.9);

    &:hover {
        background: rgba(56, 189, 248, 0.1);
        border-color: rgba(56, 189, 248, 0.4);
        transform: translateX(4px);
    }
`;

const PriceInfo = styled.div`
    ${tw`flex items-center justify-between pt-5 border-t border-white/10`};
`;

const PriceText = styled.div`
    ${tw`flex items-center space-x-2 font-bold relative overflow-hidden rounded-xl px-4 py-2.5`};
    background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
    background-size: 200% 200%;
    animation: ${gradientShift} 3s ease infinite;
    color: white;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);

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

    ${PackageCard}:hover &::before {
        left: 100%;
    }
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl text-neutral-100 transition-all duration-300 border backdrop-blur-md mb-6`};
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

const LoadingSpinner = styled.div`
    ${tw`flex items-center justify-center py-16 text-gray-300`};
`;

const ErrorMessage = styled.div`
    ${tw`rounded-3xl p-6 backdrop-blur-xl`};
    border: 1px solid rgba(248, 113, 113, 0.6);
    background: rgba(248, 113, 113, 0.15);
    color: #fecdd3;
    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
`;

const HeaderSection = styled.div`
    ${tw`flex items-center justify-between mb-6`};
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
    const [progress, setProgress] = useState(60);

    useEffect(() => {
        // Animate progress from 60% to 80% (Step 4 of 5)
        setProgress(60);
        const timer = setTimeout(() => {
            setProgress(80);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch hardware detail (includes availability data in containers)
                const hardware = await getHardwareDetail(hardwareId);

                const allPackages: Package[] = [];
                let packageIndex = 1;

                Object.values(hardware.categoryContainers).forEach((categoryPackages: any) => {
                    categoryPackages.forEach((pkg: any) => {
                        const packageId = pkg.packageId || packageIndex++;
                        const pricePerHour = pkg.price ?? pkg.hourlyRate;

                        // Get availability from containers array
                        // ถ้า containers มี elements = package ว่าง (มี container IDs)
                        // ถ้า containers ว่าง = package ไม่ว่าง (ไม่มี container IDs)
                        const hasContainers = pkg.containers && pkg.containers.length > 0;
                        const status = hasContainers ? 'available' : 'unavailable';
                        const isFull = !hasContainers;
                        const isRecommended = pkg.name.toLowerCase().includes('diamond');

                        allPackages.push({
                            id: `${hardwareId}-${pkg.name}`,
                            packageId: packageId,
                            name: pkg.name,
                            cpu: parseInt(pkg.cpu, 10),
                            ram: parseInt(pkg.ram.replace(' GB', ''), 10),
                            storage: parseInt(pkg.storage.replace(' GB', ''), 10),
                            pricePerHour: pricePerHour,
                            isFull: isFull,
                            isRecommended: isRecommended,
                            // Store availability status for display
                            capacity: pkg.capacity,
                            rentedCount: pkg.rentedCount,
                            availableCount: hasContainers ? pkg.containers.length : 0, // ใช้จำนวน containers แทน
                            status: status,
                        });
                    });
                });

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
                        <StepLabel $active={false}>เลือกฮาร์ดแวร์</StepLabel>
                    </Step>
                    <Step $active={true} $completed={false}>
                        <StepCircle $active={true} $completed={false}>
                            4
                        </StepCircle>
                        <StepLabel $active={true}>เลือกแพ็กเกจ</StepLabel>
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
                        <img src='/Grass-Block.png' alt='Progress' />
                    </ProgressIcon>
                </ProgressBar>
            </ProgressSection>

            <SectionTitle>
                <TitleBar />
                <TitleText>เลือกแพ็กเกจ</TitleText>
            </SectionTitle>

            <PackageGrid>
                {packages.map((pkg, index) => {
                    // ใช้ index เพื่อวนรูปภาพ: package 1, 2, 3, 1, 2, 3, ...
                    const imageIndex = (index % 3) + 1;
                    const packageImage = `/package${imageIndex}.gif?v=1`;

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
                                <StatusBadge $status={pkg.status || 'available'}>
                                    <span className={'w-2 h-2 rounded-full bg-current'} />
                                    <span>{getAvailabilityBadge(pkg.status || 'available')}</span>
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
