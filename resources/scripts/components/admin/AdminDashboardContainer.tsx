import React, { useState, useEffect } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faCreditCard,
    faChartLine,
    faCalendarWeek,
    faCalendarAlt,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitlePlugin,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import Spinner from '@/components/elements/Spinner';
import UsersTable from './UsersTable';
import { theme } from 'twin.macro';
import { hexToRgba } from '@/lib/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitlePlugin, Tooltip, Legend, Filler);

const Container = styled.div`
    ${tw`min-h-screen bg-neutral-900 py-8 lg:ml-64`}
`;

const ContentWrapper = styled.div`
    ${tw`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}
`;

const Header = styled.div`
    ${tw`mb-8`}
`;

const Title = styled.h1`
    ${tw`text-3xl font-bold text-white mb-2`}
`;

const Subtitle = styled.p`
    ${tw`text-neutral-400`}
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`}
`;

const StatCard = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
`;

const StatIcon = styled.div<{ $color: string }>`
    ${tw`w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
    background: ${(props) => props.$color};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const StatLabel = styled.div`
    ${tw`text-neutral-400 text-sm mb-2`}
`;

const StatValue = styled.div`
    ${tw`text-3xl font-bold text-white mb-1`}
`;

const StatChange = styled.div<{ $positive?: boolean }>`
    ${tw`text-sm flex items-center gap-1`}
    color: ${(props) => (props.$positive ? '#10b981' : '#ef4444')};
`;

const ChartsSection = styled.div`
    ${tw`grid grid-cols-1 lg:grid-cols-2 gap-6`}
`;

const UsersTableSection = styled.div``;

const ChartCard = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ChartTitle = styled.h2`
    ${tw`text-xl font-bold text-white mb-4`}
`;

const ChartPlaceholder = styled.div`
    ${tw`h-64 bg-neutral-900/50 rounded-lg flex items-center justify-center border border-white/5`}
`;

const PlaceholderText = styled.p`
    ${tw`text-neutral-500 text-sm`}
`;

const SPRING_BOOT_API_URL = 'http://localhost:9000';

interface DashboardStats {
    totalUsers: number;
    totalTopupToday: number;
    totalTopupWeek: number;
    totalTopupMonth: number;
    usersChange: number | null;
    topupTodayChange: number | null;
    topupWeekChange: number | null;
    topupMonthChange: number | null;
}

interface ApiResponse {
    totalUsers: number;
    todayTopup: number;
    weekTopup: number;
    monthTopup: number;
    todayChange: number | null;
    weekChange: number | null;
    monthChange: number | null;
}

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin);
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalTopupToday: 0,
        totalTopupWeek: 0,
        totalTopupMonth: 0,
        usersChange: null,
        topupTodayChange: null,
        topupWeekChange: null,
        topupMonthChange: null,
    });
    const [error, setError] = useState<string | null>(null);
    const [dailyTopupData, setDailyTopupData] = useState<{ date: string; amount: number }[]>([]);
    const [monthlyUsersData, setMonthlyUsersData] = useState<{ month: string; count: number }[]>([]);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [chartsError, setChartsError] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (rootAdmin === false) {
            history.push('/');
        }
    }, [rootAdmin, history]);

    const fetchCharts = async () => {
        if (!rootAdmin) {
            return;
        }

        setChartsLoading(true);
        setChartsError(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setChartsError('ไม่พบ token');
                setChartsLoading(false);
                return;
            }

            // Fetch daily topup data
            const dailyTopupResponse = await fetch(`${SPRING_BOOT_API_URL}/api/admin/dashboard/graphs/daily-topup`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!dailyTopupResponse.ok) {
                let errorMessage = `HTTP error! status: ${dailyTopupResponse.status}`;
                try {
                    const errorData = await dailyTopupResponse.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            const dailyTopup = await dailyTopupResponse.json();
            setDailyTopupData(dailyTopup || []);

            // Fetch monthly users data
            const monthlyUsersResponse = await fetch(
                `${SPRING_BOOT_API_URL}/api/admin/dashboard/graphs/monthly-users`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!monthlyUsersResponse.ok) {
                let errorMessage = `HTTP error! status: ${monthlyUsersResponse.status}`;
                try {
                    const errorData = await monthlyUsersResponse.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            const monthlyUsers = await monthlyUsersResponse.json();
            setMonthlyUsersData(monthlyUsers || []);
        } catch (err: any) {
            console.error('Failed to fetch charts data:', err);
            setChartsError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลกราฟ');
        } finally {
            setChartsLoading(false);
        }
    };

    // Fetch dashboard stats from Spring Boot API
    useEffect(() => {
        const fetchStats = async () => {
            if (!rootAdmin) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setError('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${SPRING_BOOT_API_URL}/api/admin/dashboard/stats`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 403) {
                    setError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: ApiResponse = await response.json();

                // Map API response to component state
                setStats({
                    totalUsers: data.totalUsers || 0,
                    totalTopupToday: data.todayTopup || 0,
                    totalTopupWeek: data.weekTopup || 0,
                    totalTopupMonth: data.monthTopup || 0,
                    usersChange: data.monthChange, // Using monthChange for users change
                    topupTodayChange: data.todayChange,
                    topupWeekChange: data.weekChange,
                    topupMonthChange: data.monthChange,
                });
            } catch (err: any) {
                console.error('Failed to fetch dashboard stats:', err);
                setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        fetchCharts();
    }, [rootAdmin]);

    if (rootAdmin === false) {
        return null;
    }

    if (loading) {
        return (
            <Container>
                <ContentWrapper>
                    <div css={tw`flex items-center justify-center min-h-screen`}>
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
                    <div css={tw`flex items-center justify-center min-h-screen`}>
                        <div css={tw`text-center`}>
                            <div css={tw`text-red-400 text-xl font-semibold mb-2`}>เกิดข้อผิดพลาด</div>
                            <div css={tw`text-neutral-400`}>{error}</div>
                        </div>
                    </div>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <ContentWrapper>
                <Header>
                    <Title>Admin Dashboard</Title>
                    <Subtitle>ภาพรวมระบบและการจัดการ</Subtitle>
                </Header>

                <StatsGrid>
                    <StatCard>
                        <StatIcon $color='linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'>
                            <FontAwesomeIcon icon={faUsers} css={tw`text-white text-xl`} />
                        </StatIcon>
                        <StatLabel>จำนวนผู้ใช้ทั้งหมด</StatLabel>
                        <StatValue>{stats.totalUsers.toLocaleString()}</StatValue>
                        {stats.usersChange !== null && stats.usersChange !== 0 && (
                            <StatChange $positive={stats.usersChange > 0}>
                                <FontAwesomeIcon icon={faChartLine} css={tw`text-xs`} />
                                <span>{Math.abs(stats.usersChange).toFixed(1)}% จากเดือนที่แล้ว</span>
                            </StatChange>
                        )}
                    </StatCard>

                    <StatCard>
                        <StatIcon $color='linear-gradient(135deg, #10b981 0%, #059669 100%)'>
                            <FontAwesomeIcon icon={faCreditCard} css={tw`text-white text-xl`} />
                        </StatIcon>
                        <StatLabel>จำนวนเงินเติม (วันนี้)</StatLabel>
                        <StatValue>{stats.totalTopupToday.toLocaleString()} B</StatValue>
                        {stats.topupTodayChange !== null && stats.topupTodayChange !== 0 && (
                            <StatChange $positive={stats.topupTodayChange > 0}>
                                <FontAwesomeIcon icon={faChartLine} css={tw`text-xs`} />
                                <span>{Math.abs(stats.topupTodayChange).toFixed(1)}% จากเมื่อวาน</span>
                            </StatChange>
                        )}
                    </StatCard>

                    <StatCard>
                        <StatIcon $color='linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'>
                            <FontAwesomeIcon icon={faCalendarWeek} css={tw`text-white text-xl`} />
                        </StatIcon>
                        <StatLabel>จำนวนเงินเติม (สัปดาห์นี้)</StatLabel>
                        <StatValue>{stats.totalTopupWeek.toLocaleString()} B</StatValue>
                        {stats.topupWeekChange !== null && stats.topupWeekChange !== 0 && (
                            <StatChange $positive={stats.topupWeekChange > 0}>
                                <FontAwesomeIcon icon={faChartLine} css={tw`text-xs`} />
                                <span>{Math.abs(stats.topupWeekChange).toFixed(1)}% จากสัปดาห์ที่แล้ว</span>
                            </StatChange>
                        )}
                    </StatCard>

                    <StatCard>
                        <StatIcon $color='linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'>
                            <FontAwesomeIcon icon={faCalendarAlt} css={tw`text-white text-xl`} />
                        </StatIcon>
                        <StatLabel>จำนวนเงินเติม (เดือนนี้)</StatLabel>
                        <StatValue>{stats.totalTopupMonth.toLocaleString()} B</StatValue>
                        {stats.topupMonthChange !== null && stats.topupMonthChange !== 0 && (
                            <StatChange $positive={stats.topupMonthChange > 0}>
                                <FontAwesomeIcon icon={faChartLine} css={tw`text-xs`} />
                                <span>{Math.abs(stats.topupMonthChange).toFixed(1)}% จากเดือนที่แล้ว</span>
                            </StatChange>
                        )}
                    </StatCard>
                </StatsGrid>

                <ChartsSection>
                    <ChartCard>
                        <ChartTitle>กราฟจำนวนเงินเติม (รายวัน)</ChartTitle>
                        {chartsLoading ? (
                            <ChartPlaceholder>
                                <PlaceholderText>
                                    <FontAwesomeIcon icon={faSpinner} spin css={tw`mr-2`} />
                                    กำลังโหลดข้อมูล...
                                </PlaceholderText>
                            </ChartPlaceholder>
                        ) : chartsError ? (
                            <ChartPlaceholder>
                                <PlaceholderText css={tw`text-red-400`}>{chartsError}</PlaceholderText>
                            </ChartPlaceholder>
                        ) : dailyTopupData.length === 0 ? (
                            <ChartPlaceholder>
                                <PlaceholderText>ไม่มีข้อมูล</PlaceholderText>
                            </ChartPlaceholder>
                        ) : (
                            <div css={tw`h-64`}>
                                <Line
                                    data={{
                                        labels: dailyTopupData.map((item) =>
                                            new Date(item.date).toLocaleDateString('th-TH', {
                                                month: 'short',
                                                day: 'numeric',
                                            })
                                        ),
                                        datasets: [
                                            {
                                                label: 'จำนวนเงินเติม (B)',
                                                data: dailyTopupData.map((item) => item.amount),
                                                borderColor: theme('colors.blue.400'),
                                                backgroundColor: hexToRgba(theme('colors.blue.700'), 0.5),
                                                fill: true,
                                                tension: 0.4,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: true,
                                                labels: {
                                                    color: theme('colors.gray.300'),
                                                },
                                            },
                                            tooltip: {
                                                enabled: true,
                                                backgroundColor: theme('colors.neutral.800'),
                                                titleColor: theme('colors.gray.200'),
                                                bodyColor: theme('colors.gray.300'),
                                                borderColor: theme('colors.white'),
                                                borderWidth: 1,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                grid: {
                                                    color: theme('colors.gray.700'),
                                                },
                                                ticks: {
                                                    color: theme('colors.gray.400'),
                                                },
                                            },
                                            y: {
                                                grid: {
                                                    color: theme('colors.gray.700'),
                                                },
                                                ticks: {
                                                    color: theme('colors.gray.400'),
                                                    callback: function (value) {
                                                        return value + ' B';
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard>
                        <ChartTitle>กราฟจำนวนผู้ใช้ (รายเดือน)</ChartTitle>
                        {chartsLoading ? (
                            <ChartPlaceholder>
                                <PlaceholderText>
                                    <FontAwesomeIcon icon={faSpinner} spin css={tw`mr-2`} />
                                    กำลังโหลดข้อมูล...
                                </PlaceholderText>
                            </ChartPlaceholder>
                        ) : chartsError ? (
                            <ChartPlaceholder>
                                <PlaceholderText css={tw`text-red-400`}>{chartsError}</PlaceholderText>
                            </ChartPlaceholder>
                        ) : monthlyUsersData.length === 0 ? (
                            <ChartPlaceholder>
                                <PlaceholderText>ไม่มีข้อมูล</PlaceholderText>
                            </ChartPlaceholder>
                        ) : (
                            <div css={tw`h-64`}>
                                <Line
                                    data={{
                                        labels: monthlyUsersData.map((item) =>
                                            new Date(item.month).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                            })
                                        ),
                                        datasets: [
                                            {
                                                label: 'จำนวนผู้ใช้',
                                                data: monthlyUsersData.map((item) => item.count),
                                                borderColor: theme('colors.green.400'),
                                                backgroundColor: hexToRgba(theme('colors.green.700'), 0.5),
                                                fill: true,
                                                tension: 0.4,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: true,
                                                labels: {
                                                    color: theme('colors.gray.300'),
                                                },
                                            },
                                            tooltip: {
                                                enabled: true,
                                                backgroundColor: theme('colors.neutral.800'),
                                                titleColor: theme('colors.gray.200'),
                                                bodyColor: theme('colors.gray.300'),
                                                borderColor: theme('colors.white'),
                                                borderWidth: 1,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                grid: {
                                                    color: theme('colors.gray.700'),
                                                },
                                                ticks: {
                                                    color: theme('colors.gray.400'),
                                                },
                                            },
                                            y: {
                                                grid: {
                                                    color: theme('colors.gray.700'),
                                                },
                                                ticks: {
                                                    color: theme('colors.gray.400'),
                                                    stepSize: 1,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </ChartCard>
                </ChartsSection>

                <UsersTableSection css={tw`mt-8`}>
                    <UsersTable />
                </UsersTableSection>
            </ContentWrapper>
        </Container>
    );
};
