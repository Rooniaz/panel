import React, { useState, useEffect } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faServer,
    faBox,
    faTrash,
    faPlus,
    faClock,
    faMicrochip,
    faMemory,
    faHdd,
    faUsers,
    faDatabase,
    faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, Hardware, getHardwareDetail, HardwareDetail, PackageContainer } from '@/api/spring/hardware';
import { deleteHardware, deletePackage, copyPackage } from '@/api/spring/admin';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import AddHardwareModal from './AddHardwareModal';
import AddPackageModal from './AddPackageModal';

/**
 * Generate UUID v4 (same as in admin.ts)
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const Container = styled.div`
    ${tw`min-h-screen bg-neutral-900 py-8 lg:ml-64`}
`;

const ContentWrapper = styled.div`
    ${tw`max-w-7xl mx-auto px-4`}
`;

const Section = styled.div`
    ${tw`mb-8 bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 md:p-8 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-4px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const SectionHeader = styled.div`
    ${tw`flex items-center justify-between mb-6 pb-4 border-b border-white/10`}
`;

const SectionTitle = styled.h2`
    ${tw`text-2xl font-bold text-white flex items-center space-x-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const SectionIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
`;

const Table = styled.table`
    ${tw`w-full rounded-lg overflow-hidden`}
    border-collapse: separate;
    border-spacing: 0;
    min-width: 800px;

    @media (max-width: 768px) {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
`;

const TableHeader = styled.thead`
    ${tw`bg-gradient-to-r from-neutral-700/90 via-neutral-800/90 to-neutral-800/90 backdrop-blur-sm`}
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeaderCell = styled.th`
    ${tw`px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-neutral-100 uppercase tracking-wider`}
    border-bottom: 2px solid rgba(56, 189, 248, 0.4);
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
    &:first-child {
        border-top-left-radius: 12px;
        padding-left: 1.5rem;
    }
    &:last-child {
        border-top-right-radius: 12px;
        padding-right: 1.5rem;
    }
`;

const TableBody = styled.tbody`
    ${tw`bg-neutral-800/50`}
`;

const TableRow = styled.tr`
    ${tw`border-b border-white/5 transition-all duration-200 cursor-pointer`}
    background: linear-gradient(to right, transparent 0%, transparent 100%);

    &:hover {
        ${tw`bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent`}
        transform: translateX(4px);
        box-shadow: -4px 0 12px rgba(56, 189, 248, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
        border-left: 3px solid rgba(56, 189, 248, 0.5);
    }

    &:last-child {
        border-bottom: none;
    }
`;

const TableCell = styled.td`
    ${tw`px-4 md:px-6 py-4 text-xs md:text-sm text-neutral-300`}

    &:first-child {
        padding-left: 1.5rem;
    }
    &:last-child {
        padding-right: 1.5rem;
    }

    /* Make cells more readable */
    white-space: nowrap;
`;

const Badge = styled.span<{ $color?: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all duration-200`}
    ${(props) => {
        switch (props.$color) {
            case 'blue':
                return tw`bg-blue-500/20 border-blue-500/30 text-blue-300`;
            case 'green':
                return tw`bg-green-500/20 border-green-500/30 text-green-300`;
            case 'purple':
                return tw`bg-purple-500/20 border-purple-500/30 text-purple-300`;
            case 'yellow':
                return tw`bg-yellow-500/20 border-yellow-500/30 text-yellow-300`;
            case 'neutral':
                return tw`bg-neutral-700/50 border-neutral-600/50 text-neutral-400`;
            default:
                return tw`bg-neutral-700/50 border-neutral-600/50 text-neutral-400`;
        }
    }}
`;

const TableWrapper = styled.div`
    ${tw`overflow-x-auto rounded-lg`}
    &::-webkit-scrollbar {
        height: 8px;
    }
    &::-webkit-scrollbar-track {
        ${tw`bg-neutral-800/50 rounded-lg`}
    }
    &::-webkit-scrollbar-thumb {
        ${tw`bg-neutral-600 rounded-lg hover:bg-neutral-500`}
    }
`;

const ActionButton = styled.button`
    ${tw`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2`}
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`}
    }

    &:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    &:not(:disabled):active {
        transform: translateY(0);
    }
`;

const DeleteButton = styled(ActionButton)`
    ${tw`bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30`}
    &:hover {
        ${tw`border-red-500/50`}
    }
`;

const CopyButton = styled(ActionButton)`
    ${tw`bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30`}
    &:hover {
        ${tw`border-blue-500/50`}
    }
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

const EmptyMessage = styled.div`
    ${tw`text-center py-12 text-neutral-400`}
    ${tw`flex flex-col items-center justify-center space-y-4`}
    
    &::before {
        content: '📦';
        font-size: 3rem;
        opacity: 0.5;
    }
`;

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin);
    const history = useHistory();

    const [hardwareList, setHardwareList] = useState<Hardware[]>([]);
    const [hardwareDetails, setHardwareDetails] = useState<{ [key: string]: HardwareDetail }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showAddHardwareModal, setShowAddHardwareModal] = useState(false);
    const [showAddPackageModal, setShowAddPackageModal] = useState(false);
    const [selectedHwId, setSelectedHwId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
    const [editingPackage, setEditingPackage] = useState<{
        pkg: PackageContainer & { categoryId: string };
        hwId: string;
    } | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (rootAdmin === false) {
            history.push('/');
        }
    }, [rootAdmin, history]);

    // Fetch hardware list
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getHardwareList();
                setHardwareList(data);

                // Fetch details for each hardware
                const details: { [key: string]: HardwareDetail } = {};
                for (const hw of data) {
                    try {
                        const detail = await getHardwareDetail(hw.id);
                        details[hw.id] = detail;
                    } catch (err) {
                        console.warn(`Failed to fetch details for hardware ${hw.id}:`, err);
                    }
                }
                setHardwareDetails(details);
            } catch (err: any) {
                setError(err.message || 'Failed to load hardware');
            } finally {
                setLoading(false);
            }
        };

        if (rootAdmin) {
            fetchData();
        }
    }, [rootAdmin]);

    const handleDeleteHardware = async (hwId: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Hardware นี้?')) {
            return;
        }

        try {
            setDeleting(hwId);
            await deleteHardware(hwId);
            setHardwareList((prev) => prev.filter((hw) => hw.id !== hwId));
            setHardwareDetails((prev) => {
                const newDetails = { ...prev };
                delete newDetails[hwId];
                return newDetails;
            });
        } catch (err: any) {
            alert(err.message || 'Failed to delete hardware');
        } finally {
            setDeleting(null);
        }
    };

    const handleDeletePackage = async (hwId: string, categoryId: string, packageName: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Package นี้?')) {
            return;
        }

        try {
            setDeleting(`${hwId}-${categoryId}-${packageName}`);
            await deletePackage(hwId, categoryId, packageName);
            // Refresh hardware details
            const detail = await getHardwareDetail(hwId);
            setHardwareDetails((prev) => ({
                ...prev,
                [hwId]: detail,
            }));
        } catch (err: any) {
            // Display error message with better formatting
            let errorMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to delete package';

            // Check if it's a transaction rollback error
            if (
                errorMessage.includes('Transaction silently rolled back') ||
                errorMessage.includes('rollback-only') ||
                errorMessage.includes('transaction')
            ) {
                errorMessage = `ไม่สามารถลบ Package ได้: Spring Boot API มีปัญหา transaction management\n\nกรุณาแก้ไข Spring Boot API endpoint สำหรับลบ Package:\n- ตรวจสอบ exception handling ใน @Transactional method\n- ตรวจสอบว่าไม่มีการ mark transaction เป็น rollback-only โดยไม่ตั้งใจ\n- ใช้ try-catch เพื่อจัดการ exception ให้ถูกต้อง\n\nรายละเอียด: ${errorMessage}`;
            }
            // Check if it's a "Category not found" error (เพราะ Spring Boot ยังตรวจสอบ categories table ที่ถูกลบไปแล้ว)
            else if (
                errorMessage.includes('Category not found') ||
                errorMessage.includes('category not found') ||
                errorMessage.includes('categories')
            ) {
                errorMessage = `ไม่สามารถลบ Package ได้: Spring Boot API ยังตรวจสอบ Category ใน table ที่ถูกลบไปแล้ว\n\nกรุณาแก้ไข Spring Boot API endpoint สำหรับลบ Package:\n- ไม่ต้องตรวจสอบ Category existence\n- ลบ Package โดยใช้ hardwareId, categoryId (UUID), และ packageName\n\nรายละเอียด: ${errorMessage}`;
            }
            // Check if it's a foreign key constraint error
            else if (
                errorMessage.includes('foreign key constraint') ||
                errorMessage.includes('violates foreign key') ||
                errorMessage.includes('hardware_packages')
            ) {
                errorMessage = `ไม่สามารถลบ Package ได้: Package นี้ยังถูกใช้งานอยู่ในระบบ\n\nกรุณาติดต่อผู้ดูแลระบบเพื่อแก้ไขที่ Spring Boot API\n\nรายละเอียด: ${errorMessage}`;
            }

            alert(`เกิดข้อผิดพลาดในการลบ Package:\n\n${errorMessage}`);
            console.error('Failed to delete package:', err);
        } finally {
            setDeleting(null);
        }
    };

    const handleAddHardwareSuccess = async (hardware: Hardware) => {
        setEditingHardware(null); // ✅ Clear editing hardware after success
        // Refresh hardware list
        const data = await getHardwareList();
        setHardwareList(data);
        // Fetch details for new hardware
        try {
            const detail = await getHardwareDetail(hardware.id);
            setHardwareDetails((prev) => ({
                ...prev,
                [hardware.id]: detail,
            }));
        } catch (err) {
            console.warn(`Failed to fetch details for hardware ${hardware.id}:`, err);
        }
    };

    const handleAddPackageSuccess = async () => {
        if (!selectedHwId) return;
        // Refresh hardware details
        const detail = await getHardwareDetail(selectedHwId);
        setHardwareDetails((prev) => ({
            ...prev,
            [selectedHwId]: detail,
        }));
    };

    const handleOpenAddPackageModal = (hwId: string, categoryId: string | null) => {
        setSelectedHwId(hwId);
        setSelectedCategoryId(categoryId);
        setEditingPackage(null);
        setShowAddPackageModal(true);
    };

    const handleEditHardware = (hw: Hardware) => {
        setEditingHardware(hw);
        setShowAddHardwareModal(true);
    };

    const handleEditPackage = (pkg: PackageContainer & { categoryId: string }, hwId: string) => {
        setSelectedHwId(hwId);
        setSelectedCategoryId(pkg.categoryId);
        setEditingPackage({ pkg, hwId });
        setShowAddPackageModal(true);
    };

    const handleCopyPackage = async (sourcePkg: PackageContainer & { categoryId: string }, sourceHwId: string) => {
        // Ask user to select target hardware and category
        const targetHwId = prompt(
            `ต้องการคัดลอก Package "${sourcePkg.name}" ไปที่ Hardware ไหน?\n\nHardware ID:\n${hardwareList
                .map((hw, idx) => `${idx + 1}. ${hw.id.substring(0, 8)}... - ${hw.name}`)
                .join('\n')}\n\nกรุณาใส่เลข Hardware (1-${hardwareList.length}):`
        );

        if (!targetHwId) return;

        const targetHwIndex = parseInt(targetHwId, 10) - 1;
        if (targetHwIndex < 0 || targetHwIndex >= hardwareList.length) {
            alert('Hardware ID ไม่ถูกต้อง');
            return;
        }

        const targetHw = hardwareList[targetHwIndex];
        const targetDetail = hardwareDetails[targetHw.id];

        if (!targetDetail) {
            alert('ไม่พบข้อมูล Hardware');
            return;
        }

        // Try to fetch latest details if not available
        let categories = Object.keys(targetDetail.categoryContainers || {});
        if (categories.length === 0) {
            try {
                const updatedDetail = await getHardwareDetail(targetHw.id);
                setHardwareDetails((prev) => ({
                    ...prev,
                    [targetHw.id]: updatedDetail,
                }));
                categories = Object.keys(updatedDetail.categoryContainers || {});
            } catch (err) {
                console.error('Failed to fetch hardware details:', err);
            }
        }

        // ✅ ถ้า Hardware ปลายทางไม่มี Category ให้ generate UUID ใหม่สำหรับ targetCategoryId
        let targetCategoryId: string;
        if (categories.length === 0) {
            // ✅ Generate UUID อัตโนมัติ (เช่นเดียวกับ create package)
            targetCategoryId = generateUUID();
        } else if (categories.length === 1) {
            targetCategoryId = categories[0];
        } else {
            const categorySelection = prompt(
                `เลือก Category สำหรับ Package:\n\n${categories
                    .map((cat, idx) => `${idx + 1}. ${cat.substring(0, 8)}...`)
                    .join('\n')}\n\nกรุณาใส่เลข Category (1-${categories.length}):`
            );

            if (!categorySelection) return;

            const categoryIndex = parseInt(categorySelection, 10) - 1;
            if (categoryIndex < 0 || categoryIndex >= categories.length) {
                alert('Category ID ไม่ถูกต้อง');
                return;
            }

            targetCategoryId = categories[categoryIndex];
        }

        if (
            !confirm(
                `ต้องการคัดลอก Package "${sourcePkg.name}" ไปที่ Hardware "${
                    targetHw.name
                }" (Category: ${targetCategoryId.substring(0, 8)}...)?`
            )
        ) {
            return;
        }

        try {
            await copyPackage(sourceHwId, sourcePkg.categoryId, sourcePkg.name, targetHw.id, targetCategoryId);
            // Refresh target hardware details
            const detail = await getHardwareDetail(targetHw.id);
            setHardwareDetails((prev) => ({
                ...prev,
                [targetHw.id]: detail,
            }));
            alert('คัดลอก Package สำเร็จ');
        } catch (err: any) {
            alert(`เกิดข้อผิดพลาดในการคัดลอก Package: ${err.message || 'Unknown error'}`);
            console.error('Failed to copy package:', err);
        }
    };

    const handleAddHardwareModalClose = () => {
        setShowAddHardwareModal(false);
        setEditingHardware(null);
    };

    const handleAddPackageModalClose = () => {
        setShowAddPackageModal(false);
        setEditingPackage(null);
        setSelectedHwId(null);
        setSelectedCategoryId(null);
    };

    if (rootAdmin === false) {
        return null;
    }

    if (loading) {
        return (
            <Container>
                <ContentWrapper>
                    <div css={tw`flex items-center justify-center py-12`}>
                        <Spinner size={'large'} />
                    </div>
                </ContentWrapper>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <ContentWrapper>
                    <ErrorMessage>{error}</ErrorMessage>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <ContentWrapper>
                {/* Hardware Section */}
                <Section>
                    <SectionHeader>
                        <SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faServer} />
                            </SectionIcon>
                            <span>Hardware</span>
                        </SectionTitle>
                        <Button
                            css={tw`bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2 hover:scale-105 active:scale-95`}
                            onClick={() => setShowAddHardwareModal(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} css={tw`w-4 h-4`} />
                            <span> เพิ่ม Hardware</span>
                        </Button>
                    </SectionHeader>

                    {hardwareList.length === 0 ? (
                        <EmptyMessage>
                            <div css={tw`text-6xl mb-4 opacity-30`}>🖥️</div>
                            <div css={tw`text-xl font-semibold mb-2`}>ไม่มี Hardware</div>
                            <div css={tw`text-sm text-neutral-500`}>คลิกปุ่ม "เพิ่ม Hardware" เพื่อเริ่มต้น</div>
                        </EmptyMessage>
                    ) : (
                        <TableWrapper>
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableHeaderCell>ID</TableHeaderCell>
                                        <TableHeaderCell>Name</TableHeaderCell>
                                        <TableHeaderCell>Description</TableHeaderCell>
                                        <TableHeaderCell>Priority</TableHeaderCell>
                                        <TableHeaderCell>Key</TableHeaderCell>
                                        <TableHeaderCell css={tw`text-center`}>Actions</TableHeaderCell>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {hardwareList.map((hw) => (
                                        <TableRow
                                            key={hw.id}
                                            css={tw`cursor-pointer hover:bg-neutral-700/30 transition-colors`}
                                            onClick={(e) => {
                                                // Don't trigger if clicking on delete button
                                                if ((e.target as HTMLElement).closest('button')) {
                                                    return;
                                                }
                                                handleEditHardware(hw);
                                            }}
                                        >
                                            <TableCell css={tw`font-mono text-xs text-neutral-400`}>
                                                <code css={tw`bg-neutral-800/70 px-2 py-1 rounded`}>
                                                    {hw.id.substring(0, 8)}...
                                                </code>
                                            </TableCell>
                                            <TableCell css={tw`font-semibold text-white`}>{hw.name}</TableCell>
                                            <TableCell css={tw`text-neutral-400`}>{hw.description}</TableCell>
                                            <TableCell>
                                                <Badge $color='blue'>{hw.priority}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge $color='neutral' css={tw`font-mono text-xs`}>
                                                    {hw.key}
                                                </Badge>
                                            </TableCell>
                                            <TableCell css={tw`text-center`} onClick={(e) => e.stopPropagation()}>
                                                <DeleteButton
                                                    onClick={() => handleDeleteHardware(hw.id)}
                                                    disabled={deleting === hw.id}
                                                    css={tw`mx-auto`}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                    <span>{deleting === hw.id ? 'กำลังลบ...' : 'ลบ'}</span>
                                                </DeleteButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableWrapper>
                    )}
                </Section>

                {/* Packages Section */}
                {hardwareList.map((hw) => {
                    const detail = hardwareDetails[hw.id];
                    if (!detail) return null;

                    const categories = Object.keys(detail.categoryContainers);

                    // Helper function to open add package modal with category selection
                    const handleAddPackageClick = () => {
                        if (categories.length === 0) {
                            // ✅ Hardware นี้ไม่มี Category - สร้าง Package ได้เลย
                            // Spring Boot จะ generate categoryId อัตโนมัติ
                            handleOpenAddPackageModal(hw.id, null);
                            return;
                        }

                        if (categories.length === 1) {
                            // If only one category, open modal directly
                            handleOpenAddPackageModal(hw.id, categories[0]);
                        } else {
                            // If multiple categories, show selection dialog
                            const categoryName = prompt(
                                `กรุณาเลือก Category ID:\n${categories
                                    .map((cat, idx) => `${idx + 1}. ${cat}`)
                                    .join('\n')}\n\nใส่เลข Category (1-${categories.length}):`
                            );
                            const categoryIndex = parseInt(categoryName || '', 10) - 1;
                            if (categoryIndex >= 0 && categoryIndex < categories.length) {
                                handleOpenAddPackageModal(hw.id, categories[categoryIndex]);
                            }
                        }
                    };

                    return (
                        <Section key={hw.id}>
                            <SectionHeader>
                                <SectionTitle>
                                    <SectionIcon>
                                        <FontAwesomeIcon icon={faBox} />
                                    </SectionIcon>
                                    <span>Packages - {hw.name}</span>
                                </SectionTitle>
                                <Button
                                    css={tw`bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2 hover:scale-105 active:scale-95`}
                                    onClick={handleAddPackageClick}
                                >
                                    <FontAwesomeIcon icon={faPlus} css={tw`w-4 h-4`} />
                                    <span> เพิ่ม Package</span>
                                </Button>
                            </SectionHeader>

                            {(() => {
                                // If no categories, show message
                                if (categories.length === 0) {
                                    return (
                                        <div
                                            css={tw`text-center py-12 text-neutral-400 flex flex-col items-center space-y-3`}
                                        >
                                            <div css={tw`text-6xl opacity-30`}>⚠️</div>
                                            <div css={tw`text-lg font-semibold`}>Hardware นี้ไม่มี Category</div>
                                            <div css={tw`text-sm text-neutral-500`}>
                                                กรุณาเพิ่ม Category ใน Spring Boot API ก่อนเพิ่ม Package
                                            </div>
                                        </div>
                                    );
                                }

                                // Flatten all packages from all categories into a single array with category info
                                const allPackages: Array<PackageContainer & { categoryId: string }> = [];
                                categories.forEach((categoryId) => {
                                    const packages = detail.categoryContainers[categoryId];
                                    packages.forEach((pkg) => {
                                        allPackages.push({ ...pkg, categoryId });
                                    });
                                });

                                if (allPackages.length === 0) {
                                    return (
                                        <div
                                            css={tw`text-center py-12 text-neutral-400 flex flex-col items-center space-y-3`}
                                        >
                                            <div css={tw`text-6xl opacity-30`}>📦</div>
                                            <div css={tw`text-lg font-semibold`}>ไม่มี Package</div>
                                            <div css={tw`text-sm text-neutral-500`}>
                                                คลิกปุ่ม "เพิ่ม Package" เพื่อเริ่มต้น
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <TableWrapper>
                                        <Table>
                                            <TableHeader>
                                                <tr>
                                                    <TableHeaderCell>Name</TableHeaderCell>
                                                    <TableHeaderCell>Description</TableHeaderCell>
                                                    <TableHeaderCell>Category</TableHeaderCell>
                                                    <TableHeaderCell>CPU</TableHeaderCell>
                                                    <TableHeaderCell>RAM</TableHeaderCell>
                                                    <TableHeaderCell>Storage</TableHeaderCell>
                                                    <TableHeaderCell>Hourly Rate</TableHeaderCell>
                                                    <TableHeaderCell>Capacity</TableHeaderCell>
                                                    <TableHeaderCell>Priority</TableHeaderCell>
                                                    <TableHeaderCell css={tw`text-center`}>Actions</TableHeaderCell>
                                                </tr>
                                            </TableHeader>
                                            <TableBody>
                                                {allPackages.map((pkg) => (
                                                    <TableRow
                                                        key={`${pkg.categoryId}-${pkg.name}`}
                                                        css={tw`cursor-pointer hover:bg-neutral-700/30 transition-colors`}
                                                        onClick={(e) => {
                                                            // Don't trigger if clicking on buttons
                                                            if ((e.target as HTMLElement).closest('button')) {
                                                                return;
                                                            }
                                                            handleEditPackage(pkg, hw.id);
                                                        }}
                                                    >
                                                        <TableCell css={tw`font-semibold text-white`}>
                                                            <div css={tw`flex items-center space-x-2`}>
                                                                <FontAwesomeIcon
                                                                    icon={faBox}
                                                                    css={tw`w-4 h-4 text-blue-400`}
                                                                />
                                                                <span>{pkg.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell
                                                            css={tw`text-neutral-400 max-w-xs truncate`}
                                                            title={pkg.description}
                                                        >
                                                            {pkg.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='neutral' css={tw`font-mono text-xs`}>
                                                                <FontAwesomeIcon
                                                                    icon={faDatabase}
                                                                    css={tw`w-3 h-3 mr-1`}
                                                                />
                                                                {pkg.categoryId.substring(0, 8)}...
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='blue' css={tw`font-mono`}>
                                                                <FontAwesomeIcon
                                                                    icon={faMicrochip}
                                                                    css={tw`w-3 h-3 mr-1`}
                                                                />
                                                                {pkg.cpu}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='green'>
                                                                <FontAwesomeIcon
                                                                    icon={faMemory}
                                                                    css={tw`w-3 h-3 mr-1`}
                                                                />
                                                                {pkg.ram}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='purple'>
                                                                <FontAwesomeIcon icon={faHdd} css={tw`w-3 h-3 mr-1`} />
                                                                {pkg.storage}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='yellow'>
                                                                <FontAwesomeIcon
                                                                    icon={faClock}
                                                                    css={tw`w-3 h-3 mr-1`}
                                                                />
                                                                {pkg.hourlyRate} เครดิต
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {pkg.capacity !== undefined && pkg.capacity !== null ? (
                                                                <Badge $color='green'>
                                                                    <FontAwesomeIcon
                                                                        icon={faUsers}
                                                                        css={tw`w-3 h-3 mr-1`}
                                                                    />
                                                                    {pkg.capacity} อัน
                                                                </Badge>
                                                            ) : (
                                                                <Badge $color='neutral'>
                                                                    <FontAwesomeIcon
                                                                        icon={faBox}
                                                                        css={tw`w-3 h-3 mr-1`}
                                                                    />
                                                                    ไม่จำกัด
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge $color='blue'>{pkg.priority}</Badge>
                                                        </TableCell>
                                                        <TableCell
                                                            css={tw`text-center`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div css={tw`flex items-center justify-center space-x-2`}>
                                                                <CopyButton
                                                                    onClick={() => handleCopyPackage(pkg, hw.id)}
                                                                    css={tw`px-3 py-1.5 text-xs`}
                                                                    title='คัดลอกไป Hardware อื่น'
                                                                >
                                                                    <FontAwesomeIcon icon={faCopy} css={tw`w-3 h-3`} />
                                                                    <span css={tw`hidden md:inline`}>คัดลอก</span>
                                                                </CopyButton>
                                                                <DeleteButton
                                                                    onClick={() =>
                                                                        handleDeletePackage(
                                                                            hw.id,
                                                                            pkg.categoryId,
                                                                            pkg.name
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deleting ===
                                                                        `${hw.id}-${pkg.categoryId}-${pkg.name}`
                                                                    }
                                                                    css={tw`px-3 py-1.5 text-xs`}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} css={tw`w-3 h-3`} />
                                                                    <span>
                                                                        {deleting ===
                                                                        `${hw.id}-${pkg.categoryId}-${pkg.name}`
                                                                            ? 'กำลังลบ...'
                                                                            : 'ลบ'}
                                                                    </span>
                                                                </DeleteButton>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableWrapper>
                                );
                            })()}
                        </Section>
                    );
                })}

                {/* Modals */}
                <AddHardwareModal
                    visible={showAddHardwareModal}
                    onDismissed={() => {
                        setShowAddHardwareModal(false);
                        setEditingHardware(null); // ✅ Clear editing hardware when modal closes
                    }}
                    onSuccess={handleAddHardwareSuccess}
                    hardware={editingHardware} // ✅ Pass editing hardware to modal
                />

                {selectedHwId && (
                    <AddPackageModal
                        visible={showAddPackageModal}
                        onDismissed={handleAddPackageModalClose}
                        onSuccess={handleAddPackageSuccess}
                        hwId={selectedHwId}
                        categoryId={selectedCategoryId} // ✅ สามารถเป็น null ได้ (Spring Boot จะ generate อัตโนมัติ)
                        package={editingPackage?.pkg || null}
                        originalPackageName={editingPackage?.pkg.name}
                    />
                )}
            </ContentWrapper>
        </Container>
    );
};
