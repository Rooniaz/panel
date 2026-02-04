import http from '@/api/http';
import { getPaginationSet, PaginatedResult } from '@/api/http';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Pagination from '@/components/elements/Pagination';
import Select from '@/components/elements/Select';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import useSWR from 'swr';
import tw from 'twin.macro';
import MinecraftWorldRow from './MinecraftWorldRow';
import FlashMessageRender from '@/components/FlashMessageRender';

type MinecraftMapProvider = 'curseforge' | 'minecraftmaps' | 'minecraftfrance' | 'minecraftfr';

interface MinecraftMap {
    id: string;
    name: string;
    url: string;
    icon_url: string | null;
}

export interface MinecraftWorld {
    name: string;
    defaultable: boolean;
}

interface MinecraftWorldsResponse {
    worlds: MinecraftWorld[];
    defaultWorld: string | null;
}

type MinecraftMapsResponse = PaginatedResult<MinecraftMap>;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || 1);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [minecraftMapProvider, setMinecraftMapProvider] = useState<MinecraftMapProvider>('curseforge');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [installing, setInstalling] = useState<boolean>(false);
    const shortUuid = ServerContext.useStoreState((state) => state.server.data!.id);

    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    const {
        data: worldsResponse,
        error: worldsError,
        mutate: mutateWorlds,
    } = useSWR<MinecraftWorldsResponse>(`worlds-${uuid}`, async () => {
        const { data } = await http.get(`/api/client/servers/${uuid}/minecraft-worlds`);
        return data;
    });
    const { data: maps, error: mapsError } = useSWR<MinecraftMapsResponse>(
        `minecraft-maps-${minecraftMapProvider}-${searchQuery}-${page}-${pageSize}`,
        async () => {
            const { data } = await http.get(`/api/client/servers/${uuid}/minecraft-worlds/maps`, {
                params: {
                    provider: minecraftMapProvider,
                    search_query: searchQuery,
                    page_size: pageSize,
                    page,
                },
            });
            return {
                items: data.data || [],
                pagination: getPaginationSet(data.meta.pagination),
            };
        }
    );

    useEffect(() => {
        if (!maps) return;
        if (maps.pagination.currentPage > 1 && !maps.items.length) {
            setPage(1);
        }
    }, [maps?.pagination.currentPage]);

    useEffect(() => {
        if (!worldsError && !mapsError) {
            clearFlashes('minecraft-worlds');
            clearFlashes('minecraft-maps');
            return;
        }
        if (worldsError) {
            clearAndAddHttpError({ error: worldsError, key: 'minecraft-worlds' });
        }
        if (mapsError) {
            clearAndAddHttpError({ error: mapsError, key: 'minecraft-maps' });
        }
    }, [worldsError, mapsError]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(
            null,
            document.title,
            `/server/${shortUuid}/minecraft-worlds${page <= 1 ? '' : `?page=${page}`}`
        );
    }, [page]);

    const installMap = (mapId: string) => {
        setInstalling(true);

        http.post(`/api/client/servers/${uuid}/minecraft-worlds/maps/install`, {
            provider: minecraftMapProvider,
            mapId,
        })
            .then(() => {
                addFlash({
                    key: 'minecraft-maps',
                    message:
                        'แผนที่ถูกจัดตารางการติดตั้งเรียบร้อยแล้ว อาจไม่สามารถติดตั้งได้หากไฟล์ที่ดาวน์โหลดไม่สามารถแตกไฟล์ได้',
                    type: 'success',
                });
                mutateWorlds();
            })
            .finally(() => {
                setInstalling(false);
            });
    };

    return (
        <ServerContentBlock title={'Worlds'} showFlashKey='minecraft-worlds'>
            <div css={tw`my-10`}>
                {!worldsError && worldsResponse ? (
                    worldsResponse.worlds.length ? (
                        worldsResponse.worlds.map((world, index) => (
                            <MinecraftWorldRow
                                key={world.name}
                                isDefault={world.name === worldsResponse.defaultWorld}
                                className={index > 0 ? 'mt-2' : undefined}
                                mutate={mutateWorlds}
                                world={world}
                            />
                        ))
                    ) : (
                        <p css={tw`text-center text-sm text-neutral-300`}>
                            ไม่พบโลกของ &quot;Minecraft: Java Edition&quot;
                        </p>
                    )
                ) : (
                    <Spinner centered size='base' />
                )}
                <h2 css={tw`text-neutral-300 mb-4 px-4 text-2xl mt-8`}>Maps</h2>
                <FlashMessageRender byKey={'minecraft-maps'} css={tw`mb-4`} />
                <div css={tw`flex flex-wrap gap-4`}>
                    <div css={tw`min-w-[112px]`}>
                        <Label htmlFor='map_provider'>ผู้ให้บริการ</Label>
                        <Select
                            name='map_provider'
                            value={minecraftMapProvider}
                            onChange={(event) => setMinecraftMapProvider(event.target.value as MinecraftMapProvider)}
                        >
                            <option value='curseforge'>CurseForge</option>
                            {/*<option value='minecraftmaps'>Minecraft Maps</option>
                                <option value='minecraftfrance'>Minecraft-France</option>
                                <option value='minecraftfr'>Minecraft.fr</option>
                                */}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor={'page_size'}>จำนวนต่อหน้า</Label>
                        <Select
                            name='page_size'
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(Number(event.target.value));
                            }}
                        >
                            <option value='10'>10</option>
                            <option value='25'>25</option>
                            <option value='50'>50</option>
                        </Select>
                    </div>
                    <div css={tw`w-full md:w-auto md:flex-1`}>
                        <Label htmlFor='search_query'>ค้นหา</Label>
                        <Input
                            type='text'
                            name='search_query'
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                            }}
                        />
                    </div>
                </div>
                <div css={tw`mt-3`}>
                    {!installing && !mapsError && maps ? (
                        <Pagination data={maps} onPageSelect={setPage}>
                            {({ items }) =>
                                items.length > 0 ? (
                                    <div className='grid lg:grid-cols-3 gap-2'>
                                        {items.map((map) => (
                                            <GreyRowBox key={map.id}>
                                                <img
                                                    src={map.icon_url ?? 'https://placehold.co/32'}
                                                    css={tw`rounded-md w-8 h-8 sm:w-12 sm:h-12 object-contain flex items-center justify-center`}
                                                />
                                                <a css={tw`ml-3 w-9/12`} href={map.url}>
                                                    {map.name}
                                                </a>
                                                <button
                                                    title='ติดตั้ง'
                                                    css={tw`ml-auto text-neutral-400 hover:text-green-400 transition-colors duration-150`}
                                                    onClick={() => installMap(map.id)}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} css={tw`h-3 w-3`} />
                                                </button>
                                            </GreyRowBox>
                                        ))}
                                    </div>
                                ) : (
                                    <p css={tw`text-center text-sm text-neutral-300`}>
                                        ไม่พบแผนที่ของ &quot;Minecraft: Java Edition&quot; ตามคำค้นหาของคุณ
                                    </p>
                                )
                            }
                        </Pagination>
                    ) : (
                        <Spinner centered size='base' />
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};
