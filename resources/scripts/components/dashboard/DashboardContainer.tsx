import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerCard from '@/components/dashboard/ServerCard';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components/macro';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const Container = styled.div`
        ${tw`min-h-screen sm:py-6 lg:ml-64 overflow-x-hidden relative`}
        position: relative;
        z-index: 1;
        
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
    `;

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <Container>
            <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
                {rootAdmin && (
                    <div css={tw`mb-6 flex justify-end items-center`}>
                        <p css={tw`uppercase text-xs text-neutral-400 mr-2 font-semibold`}>
                            {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                        />
                    </div>
                )}
                {!servers ? (
                    <Spinner centered size={'large'} />
                ) : (
                    <Pagination data={servers} onPageSelect={setPage}>
                        {({ items }) =>
                            items.length > 0 ? (
                                <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
                                    {items.map((server) => (
                                        <ServerCard key={server.uuid} server={server} />
                                    ))}
                                </div>
                            ) : (
                                <p css={tw`text-center text-sm text-neutral-400 py-12`}>
                                    {showOnlyAdmin
                                        ? 'There are no other servers to display.'
                                        : 'There are no servers associated with your account.'}
                                </p>
                            )
                        }
                    </Pagination>
                )}
            </PageContentBlock>
        </Container>
    );
};
