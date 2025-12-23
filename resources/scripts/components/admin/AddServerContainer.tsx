import React, { useState, useEffect } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faBox, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { getHardwareList, Hardware, getHardwareDetail, HardwareDetail } from '@/api/spring/hardware';
import { deleteHardware, deletePackage } from '@/api/spring/admin';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import AddHardwareModal from './AddHardwareModal';
import AddPackageModal from './AddPackageModal';

const Container = styled.div`
    ${tw`min-h-screen bg-neutral-900 py-8`}
`;

const ContentWrapper = styled.div`
    ${tw`max-w-7xl mx-auto px-4`}
`;

const Section = styled.div`
    ${tw`mb-8 bg-neutral-800 rounded-xl p-6 border border-white/10`}
    box-shadow: 0 10px 25px rgba(0,0,0,.3);
`;

const SectionHeader = styled.div`
    ${tw`flex items-center justify-between mb-6`}
`;

const SectionTitle = styled.h2`
    ${tw`text-2xl font-bold text-white flex items-center space-x-3`}
`;

const SectionIcon = styled.div`
    ${tw`w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white`}
`;

const Table = styled.table`
    ${tw`w-full`}
`;

const TableHeader = styled.thead`
    ${tw`bg-neutral-700`}
`;

const TableHeaderCell = styled.th`
    ${tw`px-4 py-3 text-left text-sm font-semibold text-neutral-300`}
`;

const TableBody = styled.tbody`
    ${tw`bg-neutral-800`}
`;

const TableRow = styled.tr`
    ${tw`border-b border-neutral-700 hover:bg-neutral-700 transition-colors`}
`;

const TableCell = styled.td`
    ${tw`px-4 py-3 text-sm text-neutral-300`}
`;

const ActionButton = styled.button`
    ${tw`px-3 py-1 rounded text-sm font-semibold transition-colors`}
`;

const DeleteButton = styled(ActionButton)`
    ${tw`bg-red-500/20 text-red-400 hover:bg-red-500/30`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

const EmptyMessage = styled.div`
    ${tw`text-center py-8 text-neutral-400`}
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
            alert(err.message || 'Failed to delete package');
        } finally {
            setDeleting(null);
        }
    };

    const handleAddHardwareSuccess = async (hardware: Hardware) => {
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

    const handleOpenAddPackageModal = (hwId: string, categoryId: string) => {
        setSelectedHwId(hwId);
        setSelectedCategoryId(categoryId);
        setShowAddPackageModal(true);
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
                        <Button css={tw`bg-blue-500 hover:bg-blue-600`} onClick={() => setShowAddHardwareModal(true)}>
                            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
                            เพิ่ม Hardware
                        </Button>
                    </SectionHeader>

                    {hardwareList.length === 0 ? (
                        <EmptyMessage>ไม่มี Hardware</EmptyMessage>
                    ) : (
                        <Table>
                            <TableHeader>
                                <tr>
                                    <TableHeaderCell>ID</TableHeaderCell>
                                    <TableHeaderCell>Name</TableHeaderCell>
                                    <TableHeaderCell>Description</TableHeaderCell>
                                    <TableHeaderCell>Priority</TableHeaderCell>
                                    <TableHeaderCell>Key</TableHeaderCell>
                                    <TableHeaderCell>Actions</TableHeaderCell>
                                </tr>
                            </TableHeader>
                            <TableBody>
                                {hardwareList.map((hw) => (
                                    <TableRow key={hw.id}>
                                        <TableCell>{hw.id}</TableCell>
                                        <TableCell css={tw`font-semibold text-white`}>{hw.name}</TableCell>
                                        <TableCell>{hw.description}</TableCell>
                                        <TableCell>{hw.priority}</TableCell>
                                        <TableCell css={tw`font-mono`}>{hw.key}</TableCell>
                                        <TableCell>
                                            <DeleteButton
                                                onClick={() => handleDeleteHardware(hw.id)}
                                                disabled={deleting === hw.id}
                                            >
                                                <FontAwesomeIcon icon={faTrash} className={'mr-1'} />
                                                {deleting === hw.id ? 'กำลังลบ...' : 'ลบ'}
                                            </DeleteButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Section>

                {/* Packages Section */}
                {hardwareList.map((hw) => {
                    const detail = hardwareDetails[hw.id];
                    if (!detail) return null;

                    const categories = Object.keys(detail.categoryContainers);
                    if (categories.length === 0) return null;

                    return (
                        <Section key={hw.id}>
                            <SectionHeader>
                                <SectionTitle>
                                    <SectionIcon>
                                        <FontAwesomeIcon icon={faBox} />
                                    </SectionIcon>
                                    <span>Packages - {hw.name}</span>
                                </SectionTitle>
                            </SectionHeader>

                            {categories.map((categoryId) => {
                                const packages = detail.categoryContainers[categoryId];

                                return (
                                    <div key={categoryId} css={tw`mb-6`}>
                                        <div css={tw`flex items-center justify-between mb-4`}>
                                            <h3 css={tw`text-lg font-semibold text-white`}>Category: {categoryId}</h3>
                                            <Button
                                                css={tw`bg-blue-500 hover:bg-blue-600`}
                                                onClick={() => handleOpenAddPackageModal(hw.id, categoryId)}
                                            >
                                                <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
                                                เพิ่ม Package
                                            </Button>
                                        </div>
                                        {packages.length === 0 && (
                                            <div css={tw`text-center py-4 text-neutral-400`}>
                                                ไม่มี Package ใน Category นี้
                                            </div>
                                        )}
                                        <Table>
                                            <TableHeader>
                                                <tr>
                                                    <TableHeaderCell>Name</TableHeaderCell>
                                                    <TableHeaderCell>Description</TableHeaderCell>
                                                    <TableHeaderCell>CPU</TableHeaderCell>
                                                    <TableHeaderCell>RAM</TableHeaderCell>
                                                    <TableHeaderCell>Storage</TableHeaderCell>
                                                    <TableHeaderCell>Hourly Rate</TableHeaderCell>
                                                    <TableHeaderCell>Priority</TableHeaderCell>
                                                    <TableHeaderCell>Actions</TableHeaderCell>
                                                </tr>
                                            </TableHeader>
                                            <TableBody>
                                                {packages.map((pkg) => (
                                                    <TableRow key={pkg.name}>
                                                        <TableCell css={tw`font-semibold text-white`}>
                                                            {pkg.name}
                                                        </TableCell>
                                                        <TableCell>{pkg.description}</TableCell>
                                                        <TableCell>{pkg.cpu}</TableCell>
                                                        <TableCell>{pkg.ram}</TableCell>
                                                        <TableCell>{pkg.storage}</TableCell>
                                                        <TableCell>{pkg.hourlyRate} เครดิต</TableCell>
                                                        <TableCell>{pkg.priority}</TableCell>
                                                        <TableCell>
                                                            <DeleteButton
                                                                onClick={() =>
                                                                    handleDeletePackage(hw.id, categoryId, pkg.name)
                                                                }
                                                                disabled={
                                                                    deleting === `${hw.id}-${categoryId}-${pkg.name}`
                                                                }
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} className={'mr-1'} />
                                                                {deleting === `${hw.id}-${categoryId}-${pkg.name}`
                                                                    ? 'กำลังลบ...'
                                                                    : 'ลบ'}
                                                            </DeleteButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                );
                            })}
                        </Section>
                    );
                })}

                {/* Modals */}
                <AddHardwareModal
                    visible={showAddHardwareModal}
                    onDismissed={() => setShowAddHardwareModal(false)}
                    onSuccess={handleAddHardwareSuccess}
                />

                {selectedHwId && selectedCategoryId && (
                    <AddPackageModal
                        visible={showAddPackageModal}
                        onDismissed={() => {
                            setShowAddPackageModal(false);
                            setSelectedHwId(null);
                            setSelectedCategoryId(null);
                        }}
                        onSuccess={handleAddPackageSuccess}
                        hwId={selectedHwId}
                        categoryId={selectedCategoryId}
                    />
                )}
            </ContentWrapper>
        </Container>
    );
};
