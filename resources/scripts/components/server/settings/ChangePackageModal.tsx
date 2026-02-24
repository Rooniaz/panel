import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faSpinner, faChevronRight, faChevronDown, faServer } from '@fortawesome/free-solid-svg-icons';
import { changePackage } from '@/api/spring/servers';
import { getHardwareList, getHardwareDetail, PackageContainer, isHardwareIdValid, Hardware } from '@/api/spring/hardware';
import getUserProfile from '@/api/spring/userProfile';

const ModalContent = styled.div`
    ${tw`p-6`}
`;

const ModalTitle = styled.h2`
    ${tw`text-2xl font-bold text-white mb-6`}
`;

const Section = styled.div`
    ${tw`mb-6`}
`;

const SectionTitle = styled.h3`
    ${tw`text-lg font-semibold text-neutral-300 mb-3`}
`;

const CurrentPackageCard = styled.div`
    ${tw`p-4 rounded-lg border-2 mb-4`}
    ${css`
        border-color: rgba(59, 130, 246, 0.3);
        background: rgba(59, 130, 246, 0.1);
    `}
`;

const PackageName = styled.div`
    ${tw`text-xl font-bold text-white mb-2`}
`;

const PackageSpecs = styled.div`
    ${tw`text-xs text-neutral-400 space-y-0.5`}
`;

const PackageList = styled.div`
    ${tw`space-y-3 max-h-64 overflow-y-auto`}
`;

const HardwareList = styled.div`
    ${tw`space-y-2`}
`;

const HardwareRow = styled.div<{ $expanded: boolean }>`
    ${tw`rounded-lg border-2 transition-all overflow-hidden`}
    background: rgba(30, 41, 59, 0.6);
    border-color: ${(p: { $expanded: boolean }) => (p.$expanded ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)')};
`;

const HardwareRowHeader = styled.button`
    ${tw`w-full flex items-center justify-between p-3 text-left`}
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    &:hover {
        background: rgba(59, 130, 246, 0.08);
    }
`;

const HardwareRowTitle = styled.span`
    ${tw`font-semibold text-white flex items-center gap-2`}
`;

const HardwareRowChevron = styled.span<{ $expanded: boolean }>`
    ${tw`text-blue-400 transition-transform`}
    transform: ${(p: { $expanded: boolean }) => (p.$expanded ? 'rotate(90deg)' : 'rotate(0)')};
`;

const PackagesDropdown = styled.div`
    ${tw`border-t border-white/10 bg-black/20`}
`;

const PackagesDropdownInner = styled.div`
    ${tw`p-3 flex flex-wrap gap-3 max-h-72 overflow-y-auto`}
`;

const PackageCardWrap = styled.div`
    ${tw`min-w-[200px] max-w-[260px] flex-1`}
`;

const PackageCardBadge = styled.span<{ $type: 'current' | 'full' }>`
    ${tw`inline-block text-xs font-bold px-2 py-0.5 rounded mb-2`}
    ${(p) =>
        p.$type === 'current'
            ? css`
                  background: rgba(59, 130, 246, 0.3);
                  color: #93c5fd;
                  border: 1px solid rgba(59, 130, 246, 0.5);
              `
            : css`
                  background: rgba(239, 68, 68, 0.2);
                  color: #fca5a5;
                  border: 1px solid rgba(239, 68, 68, 0.4);
              `}
`;

const PackageCard = styled.div<{ $selected: boolean; $disabled?: boolean }>`
    ${tw`p-3 rounded-lg border-2 cursor-pointer transition-all`}
    ${({ $selected }) =>
        $selected
            ? css`
                  border-color: #3b82f6;
                  background: rgba(59, 130, 246, 0.2);
              `
            : css`
                  border-color: rgba(255, 255, 255, 0.1);
                  background: rgba(30, 41, 59, 0.5);
                  &:hover {
                      border-color: rgba(59, 130, 246, 0.5);
                      background: rgba(59, 130, 246, 0.1);
                  }
              `}
    ${({ $disabled }) =>
        $disabled &&
        css`
            opacity: 0.5;
            cursor: not-allowed;
            &:hover {
                border-color: rgba(255, 255, 255, 0.1);
                background: rgba(30, 41, 59, 0.5);
            }
        `}
`;

const PackageCardHeader = styled.div`
    ${tw`flex items-center justify-between gap-2 mb-1.5 min-w-0`}
`;

const PackageCardName = styled.div`
    ${tw`text-sm font-semibold text-white truncate min-w-0`}
`;

const PackageCardPrice = styled.div`
    ${tw`text-xs font-bold text-cyan-400 whitespace-nowrap flex-shrink-0`}
`;

const PriceInfo = styled.div`
    ${tw`p-4 rounded-lg border mb-4`}
    ${css`
        border-color: rgba(234, 179, 8, 0.3);
        background: rgba(234, 179, 8, 0.1);
    `}
`;

const PriceInfoRow = styled.div`
    ${tw`flex items-center justify-between mb-2`}
`;

const PriceInfoLabel = styled.span`
    ${tw`text-sm text-neutral-300`}
`;

const PriceInfoValue = styled.span<{ $positive?: boolean; $negative?: boolean }>`
    ${tw`text-base font-semibold`}
    ${({ $positive }) => $positive && tw`text-green-400`}
    ${({ $negative }) => $negative && tw`text-red-400`}
`;

const WarningBox = styled.div`
    ${tw`p-3 rounded-lg border mb-4`}
    ${css`
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.1);
    `}
`;

const WarningText = styled.div`
    ${tw`text-sm flex items-center gap-2`}
    ${css`
        color: #fcd34d;
    `}
`;

const ErrorBox = styled.div`
    ${tw`p-3 rounded-lg border mb-4`}
    ${css`
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.1);
    `}
`;

const ErrorText = styled.div`
    ${tw`text-sm`}
    ${css`
        color: #fca5a5;
    `}
`;

const ButtonGroup = styled.div`
    ${tw`flex gap-3 justify-end mt-6`}
`;

interface Package {
    id: number;
    name: string;
    cpu: number;
    ram: number;
    storage: number;
    price: number;
    isFull?: boolean;
}

interface ChangePackageModalProps {
    visible: boolean;
    onClose: () => void;
    serverId: number;
    serverName: string;
    currentPackage: {
        id: number;
        name: string;
        cpu: number;
        ram: number;
        storage: number;
        price: number;
    };
    hardwareId: string | null;
    onSuccess: () => void;
}

function parsePackagesFromDetail(categoryContainers: { [k: string]: PackageContainer[] }): Package[] {
    const list: Package[] = [];
    const parseNum = (v: string | number | undefined): number =>
        typeof v === 'number' ? v : parseInt(String(v || '').replace(/\s*GB$/i, ''), 10) || 0;

    Object.values(categoryContainers || {}).forEach((arr) => {
        (arr || []).forEach((pkg) => {
            const packageId = pkg.packageId || 0;
            const price = pkg.price != null ? pkg.price : pkg.hourlyRate;
            const cpu = typeof pkg.cpu === 'number' ? pkg.cpu : parseInt(String(pkg.cpu || ''), 10) || 0;
            const ram = parseNum(pkg.ram);
            const storage = parseNum(pkg.storage);
            const hasContainers = pkg.containers && pkg.containers.length > 0;
            const isFull = !hasContainers;
            list.push({
                id: packageId,
                name: pkg.name || '',
                cpu,
                ram,
                storage,
                price: Number(price) || 0,
                isFull,
            });
        });
    });
    return list.sort((a, b) => a.price - b.price);
}

export default ({ visible, onClose, serverId, serverName, currentPackage, hardwareId, onSuccess }: ChangePackageModalProps) => {
    const [hardwareList, setHardwareList] = useState<Hardware[]>([]);
    const [loadingHardware, setLoadingHardware] = useState(true);
    const [expandedHwId, setExpandedHwId] = useState<string | null>(null);
    const [packagesByHwId, setPackagesByHwId] = useState<Record<string, Package[]>>({});
    const [loadingHwId, setLoadingHwId] = useState<string | null>(null);
    const [errorHwId, setErrorHwId] = useState<Record<string, string>>({});
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userCredit, setUserCredit] = useState<number>(0);

    // Fetch hardware list (GET /category/hw) when modal opens
    useEffect(() => {
        if (!visible) return;
        setError(null);
        setLoadingHardware(true);
        getHardwareList()
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setHardwareList(list.filter((hw) => isHardwareIdValid(hw.id)));
            })
            .catch((err: any) => {
                setError(err?.message || 'โหลดรายการฮาร์ดแวร์ไม่ได้');
            })
            .finally(() => setLoadingHardware(false));
    }, [visible]);

    const loadPackagesFor = (hwId: string) => {
        if (!isHardwareIdValid(hwId) || packagesByHwId[hwId]) return;
        setLoadingHwId(hwId);
        setErrorHwId((prev) => ({ ...prev, [hwId]: '' }));
        getHardwareDetail(hwId)
            .then((detail) => {
                const list = parsePackagesFromDetail(detail.categoryContainers || {});
                setPackagesByHwId((prev) => ({ ...prev, [hwId]: list }));
            })
            .catch((err: any) => {
                setErrorHwId((prev) => ({ ...prev, [hwId]: err?.message || 'โหลดแพ็กเกจไม่ได้' }));
            })
            .finally(() => setLoadingHwId(null));
    };

    const toggleHardware = (hw: Hardware) => {
        const id = hw.id;
        if (expandedHwId === id) {
            setExpandedHwId(null);
            return;
        }
        setExpandedHwId(id);
        loadPackagesFor(id);
    };

    // Fetch user credit
    useEffect(() => {
        if (!visible) return;

        const fetchCredit = async () => {
            try {
                const profile = await getUserProfile();
                setUserCredit(profile.credit);
            } catch (err) {
                console.warn('Failed to fetch user credit:', err);
            }
        };

        fetchCredit();
    }, [visible]);

    const selectedPackage = selectedPackageId != null
        ? Object.values(packagesByHwId).flat().find((p) => p.id === selectedPackageId)
        : undefined;
    const priceDifference = selectedPackage ? selectedPackage.price - currentPackage.price : 0;

    const handleChangePackage = async () => {
        if (!selectedPackageId) {
            setError('กรุณาเลือก package ที่ต้องการ');
            return;
        }

        if (priceDifference > 0 && userCredit < priceDifference) {
            setError('เครดิตไม่พอสำหรับการเปลี่ยน package');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await changePackage(serverId, selectedPackageId);

            // Trigger credit refresh
            window.dispatchEvent(new CustomEvent('creditBalanceUpdated'));

            // Refresh server data
            onSuccess();

            // Close modal
            onClose();
        } catch (err: any) {
            setError(err?.message || 'เกิดข้อผิดพลาดในการเปลี่ยน package');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSelectedPackageId(null);
        setError(null);
        setExpandedHwId(null);
        setPackagesByHwId({});
        setErrorHwId({});
        onClose();
    };

    return (
        <Dialog open={visible} onClose={handleClose}>
            <ModalContent>
                <ModalTitle>เปลี่ยน Package</ModalTitle>

                {/* Current Package */}
                <Section>
                    <SectionTitle>Package ปัจจุบัน:</SectionTitle>
                    <CurrentPackageCard>
                        <PackageName>{currentPackage.name}</PackageName>
                        <PackageSpecs>
                            <div>vCPU: {currentPackage.cpu}%</div>
                            <div>RAM: {currentPackage.ram} GB</div>
                            <div>Disk: {currentPackage.storage} GB</div>
                            <div>ราคา: {currentPackage.price.toFixed(2)} THB/ชั่วโมง</div>
                        </PackageSpecs>
                    </CurrentPackageCard>
                </Section>

                {/* Package Selection: Hardware list → dropdown packages */}
                <Section>
                    <SectionTitle>เลือก Package ใหม่ (เลือกฮาร์ดแวร์แล้วเลือกแพ็กเกจ):</SectionTitle>
                    {loadingHardware ? (
                        <div css={tw`text-center py-6`}>
                            <FontAwesomeIcon icon={faSpinner} className={'animate-spin text-2xl text-blue-400'} />
                            <div css={tw`mt-2 text-neutral-300`}>กำลังโหลดรายการฮาร์ดแวร์...</div>
                        </div>
                    ) : hardwareList.length === 0 ? (
                        <div css={tw`text-center py-6 text-neutral-400`}>
                            {error || 'ไม่พบรายการฮาร์ดแวร์'}
                        </div>
                    ) : (
                        <HardwareList>
                            {hardwareList.map((hw) => {
                                const expanded = expandedHwId === hw.id;
                                const packages = packagesByHwId[hw.id];
                                const loadingPkgs = loadingHwId === hw.id;
                                const errMsg = errorHwId[hw.id];
                                return (
                                    <HardwareRow key={hw.id} $expanded={expanded}>
                                        <HardwareRowHeader type="button" onClick={() => toggleHardware(hw)}>
                                            <HardwareRowTitle>
                                                <FontAwesomeIcon icon={faServer} />
                                                <HardwareRowChevron $expanded={expanded}>
                                                    <FontAwesomeIcon icon={faChevronRight} />
                                                </HardwareRowChevron>
                                                {hw.name}
                                                {hw.description && (
                                                    <span css={tw`text-neutral-400 font-normal text-sm hidden sm:inline`}>
                                                        {' — '}{hw.description}
                                                    </span>
                                                )}
                                            </HardwareRowTitle>
                                            <HardwareRowChevron $expanded={expanded}>
                                                <FontAwesomeIcon icon={faChevronDown} />
                                            </HardwareRowChevron>
                                        </HardwareRowHeader>
                                        {expanded && (
                                            <PackagesDropdown>
                                                {loadingPkgs && (
                                                    <div css={tw`p-4 text-center text-neutral-400 text-sm`}>
                                                        <FontAwesomeIcon icon={faSpinner} spin /> กำลังโหลดแพ็กเกจ...
                                                    </div>
                                                )}
                                                {errMsg && (
                                                    <div css={tw`p-3 text-sm text-red-400`}>{errMsg}</div>
                                                )}
                                                {!loadingPkgs && !errMsg && packages && packages.length > 0 && (
                                                    <PackagesDropdownInner>
                                                        {packages.map((pkg) => {
                                                            const isCurrent = pkg.id === currentPackage.id;
                                                            const isFull = pkg.isFull === true;
                                                            const disabled = isCurrent || isFull;
                                                            return (
                                                                <PackageCardWrap key={pkg.id}>
                                                                    <PackageCard
                                                                        $selected={selectedPackageId === pkg.id}
                                                                        $disabled={disabled}
                                                                        onClick={() => !loading && !disabled && setSelectedPackageId(pkg.id)}
                                                                    >
                                                                        {isCurrent && (
                                                                            <PackageCardBadge $type="current">ที่เช่าอยู่</PackageCardBadge>
                                                                        )}
                                                                        {isFull && !isCurrent && (
                                                                            <PackageCardBadge $type="full">เต็ม</PackageCardBadge>
                                                                        )}
                                                                        <PackageCardHeader>
                                                                            <PackageCardName>{pkg.name}</PackageCardName>
                                                                            <PackageCardPrice>{pkg.price.toFixed(2)} THB/ชม.</PackageCardPrice>
                                                                        </PackageCardHeader>
                                                                        <PackageSpecs>
                                                                            <div>vCPU: {pkg.cpu}% · RAM: {pkg.ram} GB · Disk: {pkg.storage} GB</div>
                                                                        </PackageSpecs>
                                                                        {selectedPackageId === pkg.id && (
                                                                            <div css={tw`mt-2 text-blue-400 text-sm`}>
                                                                                <FontAwesomeIcon icon={faCheckCircle} /> เลือกแล้ว
                                                                            </div>
                                                                        )}
                                                                    </PackageCard>
                                                                </PackageCardWrap>
                                                            );
                                                        })}
                                                    </PackagesDropdownInner>
                                                )}
                                                {!loadingPkgs && !errMsg && packages && packages.length === 0 && (
                                                    <div css={tw`p-4 text-center text-neutral-400 text-sm`}>ไม่มีแพ็กเกจในฮาร์ดแวร์นี้</div>
                                                )}
                                            </PackagesDropdown>
                                        )}
                                    </HardwareRow>
                                );
                            })}
                        </HardwareList>
                    )}
                </Section>

                {/* Price Difference */}
                {selectedPackage && (
                    <Section>
                        <PriceInfo>
                            <PriceInfoRow>
                                <PriceInfoLabel>Package เก่า:</PriceInfoLabel>
                                <PriceInfoValue>{currentPackage.price.toFixed(2)} THB/ชั่วโมง</PriceInfoValue>
                            </PriceInfoRow>
                            <PriceInfoRow>
                                <PriceInfoLabel>Package ใหม่:</PriceInfoLabel>
                                <PriceInfoValue>{selectedPackage.price.toFixed(2)} THB/ชั่วโมง</PriceInfoValue>
                            </PriceInfoRow>
                            <PriceInfoRow>
                                <PriceInfoLabel>ราคาเพิ่มเติม:</PriceInfoLabel>
                                <PriceInfoValue $positive={priceDifference < 0} $negative={priceDifference > 0}>
                                    {priceDifference > 0
                                        ? `+${priceDifference.toFixed(2)} THB`
                                        : priceDifference < 0
                                        ? `${priceDifference.toFixed(2)} THB (ไม่มีการคืนเงิน)`
                                        : '0.00 THB'}
                                </PriceInfoValue>
                            </PriceInfoRow>
                            <PriceInfoRow>
                                <PriceInfoLabel>เครดิตปัจจุบัน:</PriceInfoLabel>
                                <PriceInfoValue>{userCredit.toFixed(2)} THB</PriceInfoValue>
                            </PriceInfoRow>
                            {priceDifference > 0 && userCredit < priceDifference && (
                                <PriceInfoRow>
                                    <PriceInfoValue $negative css={tw`text-red-400`}>
                                        ⚠️ เครดิตไม่พอ
                                    </PriceInfoValue>
                                </PriceInfoRow>
                            )}
                        </PriceInfo>
                    </Section>
                )}

                {/* Warning */}
                <WarningBox>
                    <WarningText>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>ข้อมูล server จะคงอยู่ (ไม่ใช่สร้างใหม่)</span>
                    </WarningText>
                </WarningBox>

                {/* Error Message */}
                {error && (
                    <ErrorBox>
                        <ErrorText>
                            <FontAwesomeIcon icon={faTimesCircle} /> {error}
                        </ErrorText>
                    </ErrorBox>
                )}

                {/* Actions */}
                <ButtonGroup>
                    <Button type={'button'} onClick={handleClose} disabled={loading} css={tw`bg-neutral-600 hover:bg-neutral-700`}>
                        ยกเลิก
                    </Button>
                    <Button
                        type={'button'}
                        onClick={handleChangePackage}
                        disabled={loading || !selectedPackageId || (priceDifference > 0 && userCredit < priceDifference)}
                        css={tw`bg-blue-600 hover:bg-blue-700`}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className={'animate-spin mr-2'} />
                                กำลังเปลี่ยน...
                            </>
                        ) : (
                            'เปลี่ยน Package'
                        )}
                    </Button>
                </ButtonGroup>
            </ModalContent>
        </Dialog>
    );
};

