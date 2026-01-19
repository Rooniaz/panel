import React, { useCallback, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import {
    FastQueryResponse,
    Player,
    PlayerItemsResponse,
    WorldInfo,
    getFastQueryData,
    getDetectedWorlds,
    getPlayerItems,
    checkAutosave,
    unbanIpWithCommand,
} from '@/api/server/mcpmanager';
import PlayersList from './List';
import PlayerDetails from './Details';
import Spinner from '@/components/elements/Spinner';
import ContentBox from '@/components/elements/ContentBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
const PlayerManagerContainer = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<FastQueryResponse | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('online');
    const [playerItems, setPlayerItems] = useState<PlayerItemsResponse | null>(null);
    const [worlds, setWorlds] = useState<WorldInfo[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<string>('world');
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const uuid = server.uuid;
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const handleModalStateChange = useCallback((modalOpen: boolean) => {
        setIsModalOpen(modalOpen);
    }, []);
    const refreshData = useCallback(() => {
        setRefreshing(true);
        clearFlashes('player-manager');
        getFastQueryData(uuid)
            .then((data) => {
                setData(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setError(null);
                }
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'player-manager', error });
                setError(httpErrorToHuman(error));
            })
            .finally(() => {
                setRefreshing(false);
                setLoading(false);
            });
    }, [uuid, clearFlashes, clearAndAddHttpError]);
    const loadWorlds = useCallback(() => {
        getDetectedWorlds(uuid)
            .then((response) => {
                setWorlds(response.worlds);
                if (response.worlds.length > 0) {
                    const worldWithData = response.worlds.find((w) => w.has_player_data);
                    if (worldWithData) {
                        setSelectedWorld(worldWithData.name);
                    } else if (response.worlds.length > 0) {
                        setSelectedWorld(response.worlds[0].name);
                    }
                }
            })
            .catch((error) => {
                console.error('Failed to load worlds:', error);
            });
    }, [uuid]);
    const loadPlayerItems = useCallback(
        (player: Player) => {
            if (!player.uuid) return;
            getPlayerItems(uuid, player.uuid, selectedWorld)
                .then((data) => {
                    setPlayerItems(data);
                })
                .catch((error) => {
                    console.error('Failed to load player items:', error);
                    setPlayerItems({
                        inventory: [],
                        ender_chest: [],
                        armor: [],
                        offhand: [],
                        error: httpErrorToHuman(error),
                    });
                });
        },
        [uuid, selectedWorld]
    );
    useEffect(() => {
        checkAutosave(uuid).catch((error: any) => console.error('Failed to check autosave:', error));
        loadWorlds();
    }, [uuid, loadWorlds]);
    useEffect(() => {
        refreshData();
        if (selectedPlayer && selectedPlayer.uuid) {
            loadPlayerItems(selectedPlayer);
        }
    }, []);
    useEffect(() => {
        if (!isModalOpen) {
            refreshData();
            if (selectedPlayer && selectedPlayer.uuid) {
                loadPlayerItems(selectedPlayer);
            }
        }
    }, [selectedPlayer, selectedWorld, isModalOpen]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isModalOpen) {
                refreshData();
                if (selectedPlayer && selectedPlayer.uuid) {
                    loadPlayerItems(selectedPlayer);
                }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedPlayer, selectedWorld, refreshData, loadPlayerItems, handleModalStateChange, isModalOpen]);
    const handlePlayerSelect = (player: Player) => {
        setSelectedPlayer(player);
    };
    const handleRefresh = () => {
        refreshData();
        if (selectedPlayer && selectedPlayer.uuid) {
            loadPlayerItems(selectedPlayer);
        }
    };
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedPlayer(null);
        setPlayerItems(null);
    };
    const handleWorldChange = (world: string) => {
        setSelectedWorld(world);
        if (selectedPlayer && selectedPlayer.uuid) {
            loadPlayerItems(selectedPlayer);
        }
    };
    const handleUnbanIp = (ip: string) => {
        if (!window.confirm(`Are you sure you want to unban IP: ${ip}?`)) {
            return;
        }
        clearFlashes('player-manager');
        unbanIpWithCommand(uuid, ip)
            .then(() => {
                clearFlashes('player-manager');
                useFlash().addFlash({
                    key: 'player-manager',
                    message: `Successfully unbanned IP: ${ip}`,
                    type: 'success',
                });
                refreshData();
            })
            .catch((error: any) => {
                clearAndAddHttpError({ key: 'player-manager', error });
            });
    };
    return (
        <ServerContentBlock title={'Player Manager'} showFlashKey={'player-manager'}>
            {loading ? (
                <Spinner size={'large'} centered />
            ) : error ? (
                <ContentBox css={tw`relative`}>
                    <div css={tw`p-6 text-center`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} css={tw`text-yellow-400 text-3xl mb-3`} />
                        <p css={tw`text-red-400 text-lg mb-2`}>{error}</p>
                        <p css={tw`text-neutral-300 mt-2`}>
                            Make sure your Minecraft server is running and properly configured.
                        </p>
                    </div>
                </ContentBox>
            ) : (
                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10`}>
                    <div css={tw`md:col-span-1`}>
                        <div css={tw`sticky top-6`}>
                            <PlayersList
                                data={data}
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                                onPlayerSelect={handlePlayerSelect}
                                selectedPlayer={selectedPlayer}
                                onUnbanIp={handleUnbanIp}
                                serverStatus={status}
                            />
                        </div>
                    </div>
                    <div css={tw`md:col-span-2`}>
                        {selectedPlayer ? (
                            <PlayerDetails
                                player={selectedPlayer}
                                serverUuid={uuid}
                                onRefresh={handleRefresh}
                                playerItems={playerItems}
                                worlds={worlds}
                                selectedWorld={selectedWorld}
                                onWorldChange={handleWorldChange}
                                rootAdmin={rootAdmin}
                                fastQueryData={data}
                                onModalStateChange={handleModalStateChange}
                            />
                        ) : (
                            <ContentBox css={tw`relative`}>
                                <div css={tw`p-8 text-center`}>
                                    <FontAwesomeIcon icon={faGamepad} css={tw`text-neutral-500 text-4xl mb-4`} />
                                    <p css={tw`text-neutral-300 text-lg`}>
                                        Select a player from the list to view details
                                    </p>
                                </div>
                            </ContentBox>
                        )}
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};
export default PlayerManagerContainer;
