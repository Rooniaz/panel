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
    faDatabase,
    faClock,
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
        Databases: faDatabase,
        Schedules: faClock,
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

    const renderNavLabel = (name?: string) => {
        if (!name) return null;
        const icon = navIcons[name];
        return icon ? (
            <span className={'flex items-center gap-2'}>
                <FontAwesomeIcon icon={icon} />
                <span>{name}</span>
            </span>
        ) : (
            name
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
                                    {routes.server
                                        .filter((route) => {
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
                                        })
                                        .map((route) =>
                                            route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    <NavLink to={to(route.path, true)} exact={route.exact}>
                                                        {renderNavLabel(route.name)}
                                                    </NavLink>
                                                </Can>
                                            ) : (
                                                <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                                    {renderNavLabel(route.name)}
                                                </NavLink>
                                            )
                                        )}
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
