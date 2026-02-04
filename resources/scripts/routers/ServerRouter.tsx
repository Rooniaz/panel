import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TransitionRouter from '@/TransitionRouter';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExternalLinkAlt,
    faTerminal,
    faFolderOpen,
    faUserFriends,
    faCloudDownloadAlt,
    faNetworkWired,
    faBolt,
    faCog,
    faClipboardList,
    faCubes,
    faPlug,
    faUsers,
    faCube,
    faList,
    faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import getMenuOrder from '@/api/account/getMenuOrder';
import updateMenuOrder from '@/api/account/updateMenuOrder';

const MainContent = styled.div`
    ${tw`ml-0 lg:ml-64 min-h-screen relative`}
    z-index: 1;
    @media (max-width: 1023px) {
        width: 100%;
        padding-left: 0;
    }
`;

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');
    const [menuOrders, setMenuOrders] = useState<Record<string, number>>({});
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const navIcons: Record<string, any> = {
        Console: faTerminal,
        Files: faFolderOpen,
        Users: faUserFriends,
        Backups: faCloudDownloadAlt,
        Network: faNetworkWired,
        Startup: faBolt,
        Settings: faCog,
        Activity: faClipboardList,
        Mods: faCubes,
        Plugins: faPlug,
        'Minecraft Player Manager': faUsers,
        'Player Manager': faUsers,
        'Minecraft Version': faCube,
        Version: faCube,
        'Server Properties': faList,
        Modpacks: faCubes,
        Worlds: faGlobe,
        Configs: faList,
        Versions: faCube,
        'Bedrock Addons': faCubes,
        'Bedrock Config': faCog,
        'Bedrock Version': faCube,
    };

    const navThaiNames: Record<string, string> = {
        Console: 'คอนโซล',
        Files: 'ไฟล์',
        Users: 'ผู้ใช้',
        Backups: 'แบ็คอัพ',
        Network: 'เครือข่าย',
        Startup: 'เริ่มต้น',
        Settings: 'ตั้งค่า',
        Activity: 'ประวัติ',
        Mods: 'Mods',
        Plugins: 'Plugins',
        'Minecraft Player Manager': 'จัดการผู้เล่น Minecraft',
        'Player Manager': 'จัดการผู้เล่น',
        'Minecraft Version': 'เวอร์ชัน Minecraft',
        Version: 'เวอร์ชัน',
        'Server Properties': 'คุณสมบัติเซิร์ฟเวอร์',
        Modpacks: 'Modpacks',
        Worlds: 'Worlds',
        Configs: 'Configs',
        Versions: 'Versions',
        'Bedrock Addons': 'Bedrock Addons',
        'Bedrock Config': 'Bedrock Config',
        'Bedrock Version': 'Bedrock Version',
    };

    const renderNavLabel = (name?: string) => {
        if (!name) return null;
        const icon = navIcons[name];
        const thaiName = navThaiNames[name] || name;
        return icon ? (
            <span className={'flex items-center gap-2'}>
                <FontAwesomeIcon icon={icon} />
                <span>{thaiName}</span>
            </span>
        ) : (
            thaiName
        );
    };

    // Check if server is Bedrock edition
    const isBedrockServer = React.useMemo(() => {
        if (!serverData) return false;
        const eggId = serverData.egg?.id;
        const eggName = serverData.egg?.name?.toLowerCase() || '';
        const dockerImage = (serverData.dockerImage || '').toLowerCase();
        const description = (serverData.description || '').toLowerCase();

        return (
            eggId === 16 || // Vanilla Bedrock egg ID
            eggName.includes('bedrock') ||
            eggName.includes('mcbe') ||
            dockerImage.includes('bedrock') ||
            dockerImage.includes('mcbe') ||
            description.includes('bedrock') ||
            description.includes('mcbe')
        );
    }, [serverData]);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        // Load menu order
        getMenuOrder()
            .then((response) => {
                // Convert array to object for easier lookup
                const ordersObj = response.orders.reduce((acc, path, index) => {
                    acc[path] = index;
                    return acc;
                }, {} as Record<string, number>);
                setMenuOrders(ordersObj);
            })
            .catch(() => {
                // Ignore error, use default order
            });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            <Sidebar />
            <MainContent>
                {!uuid || !id ? (
                    error ? (
                        <ServerError message={error} />
                    ) : (
                        <Spinner size={'large'} centered />
                    )
                ) : (
                    <>
                        <CSSTransition timeout={150} classNames={'fade'} appear in>
                            <SubNavigation>
                                <div>
                                    {(() => {
                                        const filteredRoutes = routes.server.filter((route) => {
                                            // Hide Bedrock routes if server is not Bedrock
                                            if (!route.name) return false;
                                            if (route.path.startsWith('/bedrock/')) {
                                                return isBedrockServer;
                                            }
                                            // Hide Java Edition routes (mods, plugins, minecraft player manager, minecraft version) if server is Bedrock
                                            if (isBedrockServer) {
                                                const javaEditionRoutes = [
                                                    '/mods',
                                                    '/plugins',
                                                    '/minecraft/player-manager',
                                                    '/minecraft/version',
                                                    '/modpacks',
                                                    '/minecraft-worlds',
                                                ];
                                                return !javaEditionRoutes.includes(route.path);
                                            }
                                            return true;
                                        });

                                        // Sort routes by menu order
                                        const sortedRoutes = [...filteredRoutes].sort((a, b) => {
                                            const orderA = menuOrders[a.path] ?? 999;
                                            const orderB = menuOrders[b.path] ?? 999;
                                            return orderA - orderB;
                                        });

                                        const handleDragStart = (e: React.DragEvent, index: number) => {
                                            setDraggedIndex(index);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/html', '');
                                        };

                                        const handleDragOver = (e: React.DragEvent, index: number) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                            setDragOverIndex(index);
                                        };

                                        const handleDragLeave = () => {
                                            setDragOverIndex(null);
                                        };

                                        const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
                                            e.preventDefault();
                                            setDragOverIndex(null);

                                            if (draggedIndex === null || draggedIndex === dropIndex) {
                                                setDraggedIndex(null);
                                                return;
                                            }

                                            const newRoutes = [...sortedRoutes];
                                            const [removed] = newRoutes.splice(draggedIndex, 1);
                                            newRoutes.splice(dropIndex, 0, removed);

                                            // Update menu order
                                            const newOrders: string[] = newRoutes.map((r) => r.path);
                                            try {
                                                await updateMenuOrder(newOrders);
                                                setMenuOrders(
                                                    newOrders.reduce((acc, path, index) => {
                                                        acc[path] = index;
                                                        return acc;
                                                    }, {} as Record<string, number>)
                                                );
                                            } catch (error) {
                                                console.error('Failed to update menu order:', error);
                                            }

                                            setDraggedIndex(null);
                                        };

                                        return sortedRoutes.map((route, index) => {
                                            const isDragging = draggedIndex === index;
                                            const isDragOver = dragOverIndex === index;

                                            const navLinkContent = (
                                                <NavLink
                                                    to={to(route.path, true)}
                                                    exact={route.exact}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, index)}
                                                    style={{
                                                        opacity: isDragging ? 0.5 : 1,
                                                        transform: isDragOver ? 'translateX(10px)' : 'translateX(0)',
                                                        cursor: 'grab',
                                                    }}
                                                >
                                                    {renderNavLabel(route.name)}
                                                </NavLink>
                                            );

                                            return route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    {navLinkContent}
                                                </Can>
                                            ) : (
                                                <React.Fragment key={route.path}>{navLinkContent}</React.Fragment>
                                            );
                                        });
                                    })()}
                                    {rootAdmin && (
                                        // eslint-disable-next-line react/jsx-no-target-blank
                                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        </a>
                                    )}
                                </div>
                            </SubNavigation>
                        </CSSTransition>
                        <InstallListener />
                        <TransferListener />
                        <WebsocketHandler />
                        {inConflictState &&
                        (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                            <ConflictStateRenderer />
                        ) : (
                            <ErrorBoundary>
                                <TransitionRouter>
                                    <Switch location={location}>
                                        {routes.server
                                            .filter((route) => {
                                                // Hide Bedrock routes if server is not Bedrock
                                                if (route.path.startsWith('/bedrock/')) {
                                                    return isBedrockServer;
                                                }
                                                // Hide Java Edition routes (mods, plugins, minecraft player manager, minecraft version) if server is Bedrock
                                                if (isBedrockServer) {
                                                    const javaEditionRoutes = [
                                                        '/mods',
                                                        '/plugins',
                                                        '/minecraft/player-manager',
                                                        '/minecraft/version',
                                                        '/modpacks',
                                                        '/minecraft-worlds',
                                                    ];
                                                    return !javaEditionRoutes.includes(route.path);
                                                }
                                                return true;
                                            })
                                            .map(({ path, permission, component: Component }) => (
                                                <PermissionRoute
                                                    key={path}
                                                    permission={permission}
                                                    path={to(path)}
                                                    exact
                                                >
                                                    <Spinner.Suspense>
                                                        <Component />
                                                    </Spinner.Suspense>
                                                </PermissionRoute>
                                            ))}
                                        <Route path={'*'} component={NotFound} />
                                    </Switch>
                                </TransitionRouter>
                            </ErrorBoundary>
                        )}
                    </>
                )}
            </MainContent>
        </React.Fragment>
    );
};
