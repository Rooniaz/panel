import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSignOutAlt,
    faServer,
    faList,
    faChartLine,
    faCrown,
    faCreditCard,
    faEnvelope,
    faCog,
    faCogs,
    faBars,
    faTimes,
    faChartBar,
    faCube,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Avatar from '@/components/Avatar';
import getUserProfile from '@/api/spring/userProfile';

const SidebarContainer = styled.div<{ $open: boolean }>`
    ${tw`fixed left-0 top-0 h-full bg-neutral-900 w-64 shadow-lg z-50 flex flex-col transition-transform duration-300`};
    transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};

    @media (min-width: 1024px) {
        transform: translateX(0);
    }
`;

const HamburgerButton = styled.button`
    ${tw`fixed top-4 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-900 text-white shadow-lg border border-neutral-800`};
    transition: all 0.3s ease;

    &:hover {
        ${tw`bg-neutral-800 scale-110`};
    }

    &:active {
        ${tw`scale-95`};
    }
`;

const Overlay = styled.div<{ $open: boolean }>`
    ${tw`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden`};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
`;

const LogoSection = styled.div`
    ${tw`p-6 border-b border-neutral-800`}
`;

const LogoLink = styled(Link)`
    ${tw`flex items-center space-x-3 no-underline text-blue-400 hover:text-blue-300 transition-colors`}
`;

const LogoIcon = styled.div`
    ${tw`w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl`}
`;

const LogoText = styled.span`
    ${tw`text-2xl font-bold`}
`;

const UserSection = styled.div`
    ${tw`p-4 border-b border-neutral-800`}
`;

const UserInfo = styled.div`
    ${tw`flex items-center space-x-3 mb-3`}
`;

const UserAvatar = styled.div`
    ${tw`w-12 h-12 rounded-lg overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0`}
`;

const UserDetails = styled.div`
    ${tw`flex-1`}
`;

const Username = styled.div`
    ${tw`text-white font-semibold text-sm`}
`;

const MemberBadge = styled.button`
    ${tw`mt-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded flex items-center space-x-1 hover:bg-blue-600 transition-colors`}
`;

const CreditInfo = styled.div`
    ${tw`text-neutral-300 text-sm mt-3`}
`;

const MenuSection = styled.div`
    ${tw`flex-1 overflow-y-auto py-4`}
`;

const MenuItem = styled(NavLink)`
    ${tw`flex items-center space-x-3 px-6 py-3 text-neutral-300 no-underline transition-colors hover:bg-neutral-800 hover:text-white`}

    &.active {
        ${tw`bg-blue-500/20 text-blue-400 border-r-2 border-blue-500`}
    }
`;

const MenuIcon = styled.div`
    ${tw`w-5 flex items-center justify-center`}
`;

const MenuText = styled.span`
    ${tw`text-sm`}
`;

const AdminMenuItem = styled.a`
    ${tw`flex items-center space-x-3 px-6 py-3 text-neutral-300 no-underline transition-colors hover:bg-neutral-800 hover:text-white`}
`;

const LogoutButton = styled.button`
    ${tw`flex items-center space-x-3 px-6 py-3 text-neutral-300 w-full text-left transition-colors hover:bg-neutral-800 hover:text-white border-t border-neutral-800`}
`;

export default () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [creditBalance, setCreditBalance] = useState<string>('0.00');

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    // Fetch user profile and credit
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                return;
            }

            try {
                const profile = await getUserProfile();
                setCreditBalance(profile.credit.toFixed(2));
                localStorage.setItem('user_credit', profile.credit.toString());
            } catch (error) {
                console.warn('Failed to fetch user profile:', error);
                // Try to get credit from localStorage as fallback
                const storedCredit = localStorage.getItem('user_credit');
                if (storedCredit) {
                    setCreditBalance(parseFloat(storedCredit).toFixed(2));
                }
            }
        };

        // Fetch immediately if token exists
        fetchProfile();

        // Listen for profile updates from login
        const handleProfileUpdate = (event: CustomEvent) => {
            const profile = event.detail;
            setCreditBalance(profile.credit.toFixed(2));
        };

        window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);

        return () => {
            window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
        };
    }, []);

    return (
        <>
            <SpinnerOverlay visible={isLoggingOut} />
            <HamburgerButton onClick={() => setMenuOpen((s) => !s)}>
                <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
            </HamburgerButton>
            <Overlay $open={menuOpen} onClick={() => setMenuOpen(false)} />
            <SidebarContainer $open={menuOpen}>
                <LogoSection>
                    <LogoLink to={'/'}>
                        <LogoIcon>
                            <FontAwesomeIcon icon={faServer} />
                        </LogoIcon>
                        <LogoText>MCHost</LogoText>
                    </LogoLink>
                </LogoSection>

                <UserSection>
                    <UserInfo>
                        <UserAvatar>
                            <Avatar.User />
                        </UserAvatar>
                        <UserDetails>
                            <Username>{user?.username || 'User'}</Username>
                            <MemberBadge>
                                <span>🧱</span>
                                <span>MEMBER</span>
                            </MemberBadge>
                        </UserDetails>
                    </UserInfo>
                    <CreditInfo>เครดิตคงเหลือ: {creditBalance} B</CreditInfo>
                </UserSection>

                <MenuSection>
                    <MenuItem to={'/'} exact>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faServer} />
                        </MenuIcon>
                        <MenuText>เช่าเซิร์ฟเวอร์</MenuText>
                    </MenuItem>
                    <MenuItem to={'/servers'}>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faList} />
                        </MenuIcon>
                        <MenuText>เซิร์ฟเวอร์ของฉัน</MenuText>
                    </MenuItem>
                    <AdminMenuItem
                        href={'https://www.youtube.com/watch?v=4PgOJwUCdIc&list=RD4PgOJwUCdIc&start_radio=1'}
                        target={'_blank'}
                        rel={'noreferrer'}
                    >
                        <MenuIcon>
                            <FontAwesomeIcon icon={faChartLine} />
                        </MenuIcon>
                        <MenuText>สถานะเซิร์ฟเวอร์</MenuText>
                    </AdminMenuItem>
                    <MenuItem to={'/subscription'}>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faCrown} />
                        </MenuIcon>
                        <MenuText>สถานะสมาชิก</MenuText>
                    </MenuItem>
                    <MenuItem to={'/topup'}>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faCreditCard} />
                        </MenuIcon>
                        <MenuText>เติมเงิน</MenuText>
                    </MenuItem>
                    <MenuItem to={'/contact'}>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faEnvelope} />
                        </MenuIcon>
                        <MenuText>ติดต่อเรา</MenuText>
                    </MenuItem>
                    <MenuItem to={'/account'}>
                        <MenuIcon>
                            <FontAwesomeIcon icon={faCog} />
                        </MenuIcon>
                        <MenuText>ตั้งค่าบัญชี</MenuText>
                    </MenuItem>
                    {rootAdmin && (
                        <>
                            <MenuItem to={'/admin-dashboard'}>
                                <MenuIcon>
                                    <FontAwesomeIcon icon={faChartBar} />
                                </MenuIcon>
                                <MenuText>Dashboard</MenuText>
                            </MenuItem>
                            <MenuItem to={'/add-server'}>
                                <MenuIcon>
                                    <FontAwesomeIcon icon={faServer} />
                                </MenuIcon>
                                <MenuText>Add Server</MenuText>
                            </MenuItem>
                            <AdminMenuItem href={'/admin'} rel={'noreferrer'}>
                                <MenuIcon>
                                    <FontAwesomeIcon icon={faCogs} />
                                </MenuIcon>
                                <MenuText>ตั้งระบบ admin</MenuText>
                            </AdminMenuItem>
                        </>
                    )}
                </MenuSection>

                <LogoutButton onClick={onTriggerLogout}>
                    <MenuIcon>
                        <FontAwesomeIcon icon={faSignOutAlt} />
                    </MenuIcon>
                    <MenuText>ออกจากระบบ</MenuText>
                </LogoutButton>
            </SidebarContainer>
        </>
    );
};
