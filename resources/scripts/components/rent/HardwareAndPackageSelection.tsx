import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronRight,
    faMicrochip,
    faMemory,
    faHdd,
    faClock,
    faArrowLeft,
    faCheck,
    faServer,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, getHardwareDetail, Hardware, PackageContainer, isHardwareIdValid } from '@/api/spring/hardware';
import { getAvailabilityBadge, getPackagesAvailability } from '@/api/spring/packageAvailability';
import Spinner from '@/components/elements/Spinner';
import { Package } from './RentServerContainer';

const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
`;

const bounce = keyframes`
    0%, 100% { transform: translateY(-50%); }
    50% { transform: translateY(calc(-50% - 8px)); }
`;

const progressPulse = keyframes`
    0%, 100% { opacity: 1; transform: scaleY(1); }
    50% { opacity: 0.8; transform: scaleY(1.05); }
`;

const ProgressSection = styled.div`
    ${tw`rounded-2xl sm:rounded-3xl backdrop-blur-xl p-3 sm:p-4 md:p-6 border mb-4 sm:mb-6`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    border-color: rgba(56, 189, 246, 0.2);
`;

const ProgressSteps = styled.div`
    ${tw`flex items-center justify-between gap-1 sm:gap-2 md:gap-3 mb-4 md:mb-6`};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`flex items-center gap-1 sm:gap-2 md:gap-3 flex-1`};
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
    ${tw`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-300 flex-shrink-0`};
    ${(p) => (p.$completed || p.$active ? tw`text-white` : tw`bg-white/5 text-gray-400 border border-white/10`)};
    ${(p) =>
        p.$completed &&
        css`
            background: linear-gradient(135deg, #22c55e, #16a34a);
        `};
    ${(p) =>
        p.$active &&
        css`
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            animation: ${pulse} 2s ease-in-out infinite;
        `};
`;

const StepLabel = styled.span<{ $active: boolean }>`
    ${tw`text-xs sm:text-sm font-medium hidden sm:block`};
    ${(p) => (p.$active ? tw`text-white` : tw`text-gray-400`)};
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
    width: ${(p) => p.$progress}%;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
`;

const ProgressIcon = styled.div<{ $progress: number }>`
    ${tw`absolute w-6 h-6 overflow-hidden z-20`};
    top: 50%;
    transform: translateY(-50%);
    left: ${(p) => p.$progress}%;
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
    padding-bottom: 2rem !important;
`;

const BackButton = styled.button`
    ${tw`inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-neutral-100 transition-all duration-300 border backdrop-blur-md mb-6`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.85));
    border-color: rgba(56, 189, 248, 0.2);
    &:hover {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2));
        border-color: rgba(56, 189, 248, 0.5);
    }
`;

const HeaderCard = styled.div`
    ${tw`rounded-2xl sm:rounded-3xl p-6 mb-6 border`};
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
    border-color: rgba(56, 189, 248, 0.2);
`;

const HeaderTitle = styled.h1`
    ${tw`text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2`};
    color: #fff;
`;

const HeaderSubtitle = styled.p`
    ${tw`text-sm text-neutral-400`};
`;

const HardwareList = styled.div`
    ${tw`space-y-3`};
`;

const HardwareCard = styled.div<{ $expanded: boolean }>`
    ${tw`rounded-2xl border-2 transition-all duration-300 overflow-hidden`};
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
    border-color: ${(p) => (p.$expanded ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)')};
    box-shadow: ${(p) => (p.$expanded ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none')};
`;

const HardwareCardHeader = styled.button`
    ${tw`w-full flex items-center justify-between p-4 sm:p-5 text-left`};
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    &:hover {
        background: rgba(59, 130, 246, 0.08);
    }
`;

const HardwareCardTitle = styled.div`
    ${tw`flex items-center gap-3`};
`;

const HardwareName = styled.span`
    ${tw`text-lg font-bold text-white`};
`;

const HardwareDesc = styled.span`
    ${tw`text-sm text-neutral-400 hidden sm:inline`};
`;

const Chevron = styled.div<{ $expanded: boolean }>`
    ${tw`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-blue-400 transition-transform`};
    transform: ${(p) => (p.$expanded ? 'rotate(90deg)' : 'rotate(0)')};
`;

const PackagesDropdown = styled.div`
    ${tw`border-t border-white/10 bg-black/20`};
`;

const PackagesInner = styled.div`
    ${tw`p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto`};
`;

const PackageCard = styled.div<{ $isFull: boolean; $isRecommended?: boolean }>`
    ${tw`rounded-xl p-4 cursor-pointer transition-all duration-300 border-2`};
    background: rgba(15, 23, 42, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
    ${(p) => p.$isFull && tw`opacity-50 cursor-not-allowed`};
    ${(p) =>
        !p.$isFull &&
        css`
            &:hover {
                border-color: rgba(59, 130, 246, 0.5);
                background: rgba(59, 130, 246, 0.1);
            }
        `};
`;

const PackageName = styled.div`
    ${tw`text-base font-bold text-white mb-2`};
`;

const PackageSpecs = styled.div`
    ${tw`text-sm text-neutral-400 space-y-1 mb-2`};
`;

const PackagePrice = styled.div`
    ${tw`text-sm font-bold text-cyan-400`};
`;

const LoadingPackages = styled.div`
    ${tw`p-6 flex items-center justify-center gap-2 text-neutral-400`};
`;

const ErrorPackages = styled.div`
    ${tw`p-4 text-sm text-red-400`};
`;

const SectionTitle = styled.h2`
    ${tw`text-xl font-bold text-white mb-4 flex items-center gap-2`};
    svg {
        color: rgb(56, 189, 248);
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }
`;

const SpinnerWrap = styled.div`
    ${tw`flex items-center justify-center py-16`};
`;

const ErrorMessage = styled.div`
    ${tw`rounded-xl p-6 border border-red-500/50 bg-red-500/10 text-red-200`};
`;

interface Props {
    onSelect: (hardware: Hardware, pkg: Package) => void;
    onBack: () => void;
}

function parsePackagesFromDetail(hardwareId: string, categoryContainers: { [k: string]: PackageContainer[] }): Package[] {
    const list: Package[] = [];
    let index = 1;
    const parseNum = (v: string | number | undefined): number =>
        typeof v === 'number' ? v : parseInt(String(v || '').replace(/\s*GB$/i, ''), 10) || 0;

    Object.values(categoryContainers || {}).forEach((arr) => {
        (arr || []).forEach((pkg) => {
            const packageId = pkg.packageId || index++;
            const pricePerHour = pkg.price != null ? pkg.price : pkg.hourlyRate;
            const cpu = typeof pkg.cpu === 'number' ? pkg.cpu : parseInt(String(pkg.cpu || ''), 10) || 0;
            const ram = parseNum(pkg.ram);
            const storage = parseNum(pkg.storage);
            const hasContainers = pkg.containers && pkg.containers.length > 0;
            // ใช้ isAvailable/status จาก API ถ้ามี (backend คำนวณจากความจุ node จริง)
            const apiUnavailable = pkg.isAvailable === false || pkg.status === 'unavailable';
            const status: 'available' | 'limited' | 'unavailable' = apiUnavailable
                ? 'unavailable'
                : pkg.status || (hasContainers ? 'available' : 'unavailable');
            const isFull = apiUnavailable || !hasContainers;
            const isRecommended = (pkg.name || '').toLowerCase().includes('diamond');

            list.push({
                id: `${hardwareId}-${pkg.name}`,
                packageId,
                name: pkg.name || '',
                cpu,
                ram,
                storage,
                pricePerHour: Number(pricePerHour) || 0,
                isFull,
                isRecommended,
                capacity: pkg.capacity,
                rentedCount: pkg.rentedCount,
                availableCount: hasContainers && !apiUnavailable ? (pkg.containers?.length ?? 0) : 0,
                status,
            });
        });
    });

    return list.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.pricePerHour - b.pricePerHour;
    });
}

export default ({ onSelect, onBack }: Props) => {
    const [hardwareList, setHardwareList] = useState<Hardware[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [packagesByHwId, setPackagesByHwId] = useState<Record<string, Package[]>>({});
    const [loadingHwId, setLoadingHwId] = useState<string | null>(null);
    const [errorHwId, setErrorHwId] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState(50);

    useEffect(() => {
        // 4 ขั้น: step 3 = เลือกฮาร์ดแวร์ & แพ็กเกจ (75%)
        setProgress(50);
        const t = setTimeout(() => setProgress(75), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getHardwareList();
                setHardwareList(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err?.message || 'โหลดรายการ hardware ไม่ได้');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const loadPackagesFor = (hwId: string) => {
        if (!isHardwareIdValid(hwId)) {
            setErrorHwId((prev) => ({ ...prev, [hwId]: 'Hardware ID ไม่ถูกต้อง (ต้องเป็น UUID)' }));
            return;
        }
        if (packagesByHwId[hwId]) return;

        setLoadingHwId(hwId);
        setErrorHwId((prev) => ({ ...prev, [hwId]: '' }));

        Promise.all([getHardwareDetail(hwId), getPackagesAvailability().catch(() => null)])
            .then(([detail, availability]) => {
                let list = parsePackagesFromDetail(hwId, detail.categoryContainers || {});
                // ถ้ามี API ความพร้อม ใช้ override สถานะเต็มตามความจุ node จริง
                if (availability?.packages?.length) {
                    const byId = new Map(availability.packages.map((p) => [p.packageId, p]));
                    const byName = new Map(availability.packages.map((p) => [p.packageName, p]));
                    list = list.map((p) => {
                        const avail = byId.get(p.packageId) ?? byName.get(p.name);
                        if (avail && (avail.isAvailable === false || avail.status === 'unavailable')) {
                            return { ...p, isFull: true, status: 'unavailable' as const };
                        }
                        if (avail && avail.status === 'limited') {
                            return { ...p, status: 'limited' as const, isFull: false };
                        }
                        return p;
                    });
                }
                setPackagesByHwId((prev) => ({ ...prev, [hwId]: list }));
            })
            .catch((err: any) => {
                setErrorHwId((prev) => ({ ...prev, [hwId]: err?.message || 'โหลด packages ไม่ได้' }));
            })
            .finally(() => setLoadingHwId(null));
    };

    const toggleExpand = (hw: Hardware) => {
        const id = hw.id;
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        loadPackagesFor(id);
    };

    const handleSelectPackage = (hardware: Hardware, pkg: Package) => {
        if (pkg.isFull) return;
        onSelect(hardware, pkg);
    };

    if (loading) {
        return (
            <Container>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faServer} />
                        <span>เลือกฮาร์ดแวร์และแพ็กเกจ</span>
                    </HeaderTitle>
                    <HeaderSubtitle>แสดงรายการฮาร์ดแวร์ก่อน จากนั้นกดที่ฮาร์ดแวร์เพื่อเลือกแพ็กเกจ</HeaderSubtitle>
                </HeaderCard>
                <SpinnerWrap>
                    <Spinner size="large" />
                </SpinnerWrap>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <BackButton onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>ย้อนกลับ</span>
                </BackButton>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faServer} />
                        <span>เลือกฮาร์ดแวร์และแพ็กเกจ</span>
                    </HeaderTitle>
                </HeaderCard>
                <ErrorMessage>{error}</ErrorMessage>
            </Container>
        );
    }

    return (
        <Container>
            <BackButton onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>ย้อนกลับ</span>
            </BackButton>

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
                        <StepLabel $active={true}>เลือกฮาร์ดแวร์ & แพ็กเกจ</StepLabel>
                    </Step>
                    <Step $active={false} $completed={false}>
                        <StepCircle $active={false} $completed={false}>
                            4
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
                    <FontAwesomeIcon icon={faServer} />
                    <span>เลือกฮาร์ดแวร์และแพ็กเกจ</span>
                </HeaderTitle>
                <HeaderSubtitle>
                    กดที่ฮาร์ดแวร์เพื่อขยาย dropdown แล้วเลือกแพ็กเกจที่ต้องการ
                </HeaderSubtitle>
            </HeaderCard>

            <SectionTitle>
                <FontAwesomeIcon icon={faMicrochip} />
                <span>รายการฮาร์ดแวร์ — กดเพื่อเลือกแพ็กเกจ</span>
            </SectionTitle>

            <HardwareList>
                {hardwareList.map((hw) => {
                    const expanded = expandedId === hw.id;
                    const packages = packagesByHwId[hw.id];
                    const loadingPkgs = loadingHwId === hw.id;
                    const errMsg = errorHwId[hw.id];

                    return (
                        <HardwareCard key={hw.id} $expanded={expanded}>
                            <HardwareCardHeader type="button" onClick={() => toggleExpand(hw)}>
                                <HardwareCardTitle>
                                    <Chevron $expanded={expanded}>
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </Chevron>
                                    <div>
                                        <HardwareName>{hw.name}</HardwareName>
                                        {hw.description && <HardwareDesc> — {hw.description}</HardwareDesc>}
                                    </div>
                                </HardwareCardTitle>
                                <Chevron $expanded={expanded}>
                                    <FontAwesomeIcon icon={faChevronDown} />
                                </Chevron>
                            </HardwareCardHeader>

                            {expanded && (
                                <PackagesDropdown>
                                    {loadingPkgs && (
                                        <LoadingPackages>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>กำลังโหลดแพ็กเกจ...</span>
                                        </LoadingPackages>
                                    )}
                                    {errMsg && <ErrorPackages>{errMsg}</ErrorPackages>}
                                    {!loadingPkgs && !errMsg && packages && packages.length === 0 && (
                                        <LoadingPackages>ไม่พบแพ็กเกจในฮาร์ดแวร์นี้</LoadingPackages>
                                    )}
                                    {!loadingPkgs && packages && packages.length > 0 && (
                                        <PackagesInner>
                                            {packages.map((pkg, idx) => {
                                                const imgIndex = (idx % 3) + 1;
                                                return (
                                                    <PackageCard
                                                        key={pkg.id}
                                                        $isFull={pkg.isFull}
                                                        $isRecommended={pkg.isRecommended}
                                                        onClick={() => handleSelectPackage(hw, pkg)}
                                                    >
                                                        {pkg.isRecommended && (
                                                            <span
                                                                css={tw`text-xs text-yellow-400 font-bold mb-1 block`}
                                                            >
                                                                ⭐ RECOMMEND
                                                            </span>
                                                        )}
                                                        <PackageName>{pkg.name}</PackageName>
                                                        <PackageSpecs>
                                                            <div>
                                                                <FontAwesomeIcon icon={faMicrochip} /> CPU {pkg.cpu} |{' '}
                                                                <FontAwesomeIcon icon={faMemory} /> {pkg.ram} GB |{' '}
                                                                <FontAwesomeIcon icon={faHdd} /> {pkg.storage} GB
                                                            </div>
                                                            <div>
                                                                <FontAwesomeIcon icon={faClock} /> ชั่วโมงละ {pkg.pricePerHour} เครดิต
                                                            </div>
                                                        </PackageSpecs>
                                                        <PackagePrice>
                                                            {getAvailabilityBadge(pkg.status || 'available')}
                                                        </PackagePrice>
                                                    </PackageCard>
                                                );
                                            })}
                                        </PackagesInner>
                                    )}
                                </PackagesDropdown>
                            )}
                        </HardwareCard>
                    );
                })}
            </HardwareList>

            {hardwareList.length === 0 && (
                <div css={tw`text-center py-8 text-neutral-400`}>ไม่มีรายการฮาร์ดแวร์</div>
            )}
        </Container>
    );
};
