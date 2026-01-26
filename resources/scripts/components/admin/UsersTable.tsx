import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faCreditCard,
    faEye,
    faSpinner,
    faSearch,
    faFilter,
    faSort,
    faSortUp,
    faSortDown,
} from '@fortawesome/free-solid-svg-icons';
import Input from '@/components/elements/Input';
import UserDetailModal from './UserDetailModal';
import AdminTopupModal from './AdminTopupModal';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const TableContainer = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const TableHeader = styled.div`
    ${tw`px-6 py-4 border-b border-white/10`}
`;

const TableTitle = styled.h2`
    ${tw`text-xl font-bold text-white`}
`;

const Table = styled.table`
    ${tw`w-full`}
`;

const TableHead = styled.thead`
    ${tw`bg-neutral-900/50`}
`;

const TableHeaderRow = styled.tr`
    ${tw`border-b border-white/10`}
`;

const TableHeaderCell = styled.th`
    ${tw`px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider`}
`;

const SortableHeader = styled.div`
    ${tw`flex items-center gap-2 cursor-pointer hover:bg-neutral-800/50 transition-colors rounded px-2 py-1 -mx-2 -my-1`}
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
    ${tw`border-b border-white/5 transition-colors cursor-pointer`}

    &:hover {
        ${tw`bg-neutral-800/50`}
    }
`;

const TableCell = styled.td`
    ${tw`px-6 py-4 text-sm text-neutral-300`}
`;

const UserCell = styled.div`
    ${tw`flex items-center gap-3`}
`;

const Avatar = styled.div`
    ${tw`w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold`}
`;

const UserInfo = styled.div``;

const Username = styled.div`
    ${tw`text-white font-medium`}
`;

const Email = styled.div`
    ${tw`text-neutral-400 text-xs`}
`;

const ActionButton = styled.button`
    ${tw`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200`}
`;

const ViewButton = styled(ActionButton)`
    ${tw`bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30`}
`;

const TopupButton = styled(ActionButton)`
    ${tw`bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30`}
`;

const LoadingContainer = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const EmptyContainer = styled.div`
    ${tw`flex flex-col items-center justify-center py-12 text-neutral-400`}
`;

const SearchInput = styled(Input)`
    ${tw`w-full`}
`;

const FilterContainer = styled.div`
    ${tw`mb-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700`}
`;

const FilterRow = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4`}
`;

const FilterGroup = styled.div`
    ${tw`flex flex-col gap-2`}
`;

const FilterLabel = styled.label`
    ${tw`text-sm text-neutral-400 font-medium`}
`;

const FilterInput = styled(Input)`
    ${tw`w-full`}
`;

const FilterButton = styled.button`
    ${tw`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-neutral-700 hover:bg-neutral-600 text-neutral-300`}
`;

interface User {
    id: number;
    username: string;
    email: string;
    credit: number;
    createdAt?: string;
    registrationDate?: string;
}

interface Props {
    onRefresh?: () => void;
}

export default ({ onRefresh }: Props) => {
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page] = useState(0);
    const [size] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        username: '',
        email: '',
        creditMin: '',
        creditMax: '',
        dateFrom: '',
        dateTo: '',
    });
    const [sortConfig, setSortConfig] = useState<{
        key: keyof User | 'credit' | 'registrationDate';
        direction: 'asc' | 'desc';
    } | null>(null);

    const applyFilters = (userList: User[]) => {
        let filtered = [...userList];

        // Search filter (username or email)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (user) => user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
            );
        }

        // Username filter
        if (filters.username.trim()) {
            const query = filters.username.toLowerCase().trim();
            filtered = filtered.filter((user) => user.username.toLowerCase().includes(query));
        }

        // Email filter
        if (filters.email.trim()) {
            const query = filters.email.toLowerCase().trim();
            filtered = filtered.filter((user) => user.email.toLowerCase().includes(query));
        }

        // Credit range filter
        if (filters.creditMin) {
            const min = parseFloat(filters.creditMin);
            if (!isNaN(min)) {
                filtered = filtered.filter((user) => user.credit >= min);
            }
        }
        if (filters.creditMax) {
            const max = parseFloat(filters.creditMax);
            if (!isNaN(max)) {
                filtered = filtered.filter((user) => user.credit <= max);
            }
        }

        // Date range filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter((user) => {
                const userDate = user.registrationDate || user.createdAt;
                if (!userDate) return false;
                return new Date(userDate) >= fromDate;
            });
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter((user) => {
                const userDate = user.registrationDate || user.createdAt;
                if (!userDate) return false;
                return new Date(userDate) <= toDate;
            });
        }

        // Apply sorting
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'credit') {
                    aValue = a.credit;
                    bValue = b.credit;
                } else if (sortConfig.key === 'registrationDate') {
                    aValue = a.registrationDate || a.createdAt || '';
                    bValue = b.registrationDate || b.createdAt || '';
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                // For dates
                const aDate = new Date(aValue);
                const bDate = new Date(bValue);
                if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                    return sortConfig.direction === 'asc'
                        ? aDate.getTime() - bDate.getTime()
                        : bDate.getTime() - aDate.getTime();
                }

                return 0;
            });
        }

        setUsers(filtered);
    };

    const handleSort = (key: keyof User | 'credit' | 'registrationDate') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
                setLoading(false);
                return;
            }

            const response = await fetch(`${SPRING_BOOT_API_URL}/api/admin/users?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Handle different response formats
            let userList: User[] = [];
            if (Array.isArray(data)) {
                userList = data;
            } else if (data.users && Array.isArray(data.users)) {
                // Response format: { totalUsers: 6, users: [...] }
                userList = data.users;
            } else if (data.content && Array.isArray(data.content)) {
                // Paginated response format: { content: [...] }
                userList = data.content;
            } else if (data.data && Array.isArray(data.data)) {
                // Response format: { data: [...] }
                userList = data.data;
            }
            setAllUsers(userList);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    useEffect(() => {
        if (onRefresh) {
            fetchUsers();
        }
    }, [onRefresh]);

    useEffect(() => {
        if (allUsers.length > 0) {
            applyFilters(allUsers);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, allUsers, sortConfig]);

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    const handleTopupUser = (user: User) => {
        setSelectedUser(user);
        setShowTopupModal(true);
    };

    const handleTopupSuccess = () => {
        setShowTopupModal(false);
        fetchUsers();
        if (onRefresh) {
            onRefresh();
        }
    };

    if (loading) {
        return (
            <TableContainer>
                <TableHeader>
                    <TableTitle>รายชื่อผู้ใช้</TableTitle>
                </TableHeader>
                <LoadingContainer>
                    <FontAwesomeIcon icon={faSpinner} spin css={tw`text-2xl text-neutral-400`} />
                </LoadingContainer>
            </TableContainer>
        );
    }

    if (error) {
        return (
            <TableContainer>
                <TableHeader>
                    <TableTitle>รายชื่อผู้ใช้</TableTitle>
                </TableHeader>
                <EmptyContainer>
                    <div css={tw`text-red-400 mb-2`}>เกิดข้อผิดพลาด</div>
                    <div css={tw`text-sm`}>{error}</div>
                </EmptyContainer>
            </TableContainer>
        );
    }

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({
            username: '',
            email: '',
            creditMin: '',
            creditMax: '',
            dateFrom: '',
            dateTo: '',
        });
    };

    return (
        <>
            <TableContainer>
                <TableHeader>
                    <TableTitle>รายชื่อผู้ใช้</TableTitle>
                </TableHeader>

                <div css={tw`px-6 py-4 border-b border-white/10`}>
                    <div css={tw`relative mb-4`}>
                        <div css={tw`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none`}>
                            <FontAwesomeIcon icon={faSearch} css={tw`text-neutral-400 text-sm`} />
                        </div>
                        <SearchInput
                            type={'text'}
                            placeholder={'ค้นหาด้วยชื่อผู้ใช้หรืออีเมล...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            css={tw`pl-10`}
                        />
                    </div>

                    <FilterContainer>
                        <div css={tw`flex items-center gap-2 mb-4`}>
                            <FontAwesomeIcon icon={faFilter} css={tw`text-neutral-400`} />
                            <span css={tw`text-white font-medium`}>ตัวกรอง</span>
                        </div>
                        <FilterRow>
                            <FilterGroup>
                                <FilterLabel>ชื่อผู้ใช้</FilterLabel>
                                <FilterInput
                                    type={'text'}
                                    placeholder={'กรองชื่อผู้ใช้...'}
                                    value={filters.username}
                                    onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                                />
                            </FilterGroup>
                            <FilterGroup>
                                <FilterLabel>อีเมล</FilterLabel>
                                <FilterInput
                                    type={'text'}
                                    placeholder={'กรองอีเมล...'}
                                    value={filters.email}
                                    onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                />
                            </FilterGroup>
                            <FilterGroup>
                                <FilterLabel>เครดิตขั้นต่ำ</FilterLabel>
                                <FilterInput
                                    type={'number'}
                                    placeholder={'0.00'}
                                    value={filters.creditMin}
                                    onChange={(e) => setFilters({ ...filters, creditMin: e.target.value })}
                                />
                            </FilterGroup>
                            <FilterGroup>
                                <FilterLabel>เครดิตสูงสุด</FilterLabel>
                                <FilterInput
                                    type={'number'}
                                    placeholder={'999999.99'}
                                    value={filters.creditMax}
                                    onChange={(e) => setFilters({ ...filters, creditMax: e.target.value })}
                                />
                            </FilterGroup>
                            <FilterGroup>
                                <FilterLabel>วันที่เริ่มต้น</FilterLabel>
                                <FilterInput
                                    type={'date'}
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                />
                            </FilterGroup>
                            <FilterGroup>
                                <FilterLabel>วันที่สิ้นสุด</FilterLabel>
                                <FilterInput
                                    type={'date'}
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                />
                            </FilterGroup>
                        </FilterRow>
                        <div css={tw`flex justify-end`}>
                            <FilterButton onClick={clearFilters}>ล้างตัวกรอง</FilterButton>
                        </div>
                    </FilterContainer>
                </div>

                <Table>
                    <TableHead>
                        <TableHeaderRow>
                            <TableHeaderCell>
                                <SortableHeader onClick={() => handleSort('username')}>
                                    <span>ผู้ใช้</span>
                                    {sortConfig?.key === 'username' ? (
                                        sortConfig.direction === 'asc' ? (
                                            <FontAwesomeIcon icon={faSortUp} css={tw`text-cyan-400`} />
                                        ) : (
                                            <FontAwesomeIcon icon={faSortDown} css={tw`text-cyan-400`} />
                                        )
                                    ) : (
                                        <FontAwesomeIcon icon={faSort} css={tw`text-neutral-500 opacity-50`} />
                                    )}
                                </SortableHeader>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortableHeader onClick={() => handleSort('credit')}>
                                    <span>เครดิต</span>
                                    {sortConfig?.key === 'credit' ? (
                                        sortConfig.direction === 'asc' ? (
                                            <FontAwesomeIcon icon={faSortUp} css={tw`text-cyan-400`} />
                                        ) : (
                                            <FontAwesomeIcon icon={faSortDown} css={tw`text-cyan-400`} />
                                        )
                                    ) : (
                                        <FontAwesomeIcon icon={faSort} css={tw`text-neutral-500 opacity-50`} />
                                    )}
                                </SortableHeader>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortableHeader onClick={() => handleSort('registrationDate')}>
                                    <span>วันที่สมัคร</span>
                                    {sortConfig?.key === 'registrationDate' ? (
                                        sortConfig.direction === 'asc' ? (
                                            <FontAwesomeIcon icon={faSortUp} css={tw`text-cyan-400`} />
                                        ) : (
                                            <FontAwesomeIcon icon={faSortDown} css={tw`text-cyan-400`} />
                                        )
                                    ) : (
                                        <FontAwesomeIcon icon={faSort} css={tw`text-neutral-500 opacity-50`} />
                                    )}
                                </SortableHeader>
                            </TableHeaderCell>
                            <TableHeaderCell>จัดการ</TableHeaderCell>
                        </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} css={tw`text-center py-12`}>
                                    <EmptyContainer>
                                        <FontAwesomeIcon icon={faUser} css={tw`text-4xl mb-2`} />
                                        <div>ไม่พบข้อมูลผู้ใช้</div>
                                    </EmptyContainer>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <UserCell>
                                            <Avatar>
                                                <FontAwesomeIcon icon={faUser} />
                                            </Avatar>
                                            <UserInfo>
                                                <Username>{user.username}</Username>
                                                <Email>{user.email}</Email>
                                            </UserInfo>
                                        </UserCell>
                                    </TableCell>
                                    <TableCell>
                                        <div css={tw`text-white font-medium`}>{user.credit.toFixed(2)} B</div>
                                    </TableCell>
                                    <TableCell>
                                        <div css={tw`text-neutral-400`}>
                                            {user.registrationDate || user.createdAt
                                                ? new Date(
                                                      user.registrationDate || user.createdAt || ''
                                                  ).toLocaleDateString('th-TH', {
                                                      year: 'numeric',
                                                      month: 'long',
                                                      day: 'numeric',
                                                  })
                                                : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div css={tw`flex items-center gap-2`}>
                                            <ViewButton onClick={() => handleViewUser(user)}>
                                                <FontAwesomeIcon icon={faEye} css={tw`mr-1`} />
                                                ดูรายละเอียด
                                            </ViewButton>
                                            <TopupButton onClick={() => handleTopupUser(user)}>
                                                <FontAwesomeIcon icon={faCreditCard} css={tw`mr-1`} />
                                                เติมเงิน
                                            </TopupButton>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedUser && (
                <>
                    <UserDetailModal
                        user={selectedUser}
                        visible={showDetailModal}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedUser(null);
                        }}
                    />
                    <AdminTopupModal
                        user={selectedUser}
                        visible={showTopupModal}
                        onClose={() => {
                            setShowTopupModal(false);
                            setSelectedUser(null);
                        }}
                        onSuccess={handleTopupSuccess}
                    />
                </>
            )}
        </>
    );
};
