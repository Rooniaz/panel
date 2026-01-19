import React, { useEffect, useState, useRef } from 'react';
import InstallModal from '@/components/server/mods/InstallModal';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import { useFlashKey } from '@/plugins/useFlash';
import tw from 'twin.macro';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import http from '@/api/http';
import { useLocation } from 'react-router-dom';
import Alert from '@/components/elements/alert/Alert';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { formatDistanceToNow } from 'date-fns';
import Select from '@/components/elements/Select';
import Input from '@/components/elements/Input';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faClock,
    faThumbsUp,
    faBars,
    faPuzzlePiece,
    faGamepad,
    faSort,
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';

const FilterContainer = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4`};
`;

const FilterGroup = styled.div`
    ${tw`relative flex items-center`};
`;

const FilterIcon = styled(FontAwesomeIcon)`
    ${tw`absolute left-3 text-neutral-400 pointer-events-none`};
`;

const StyledSelect = styled(Select)`
    ${tw`pl-10 w-full`};
    & > option {
        ${tw`flex items-center`};
    }
`;

const StyledInput = styled(Input)`
    ${tw`w-full`};
    &::placeholder {
        ${tw`text-neutral-400`};
    }
`;

const ModCard = styled.div`
    ${tw`bg-neutral-700 rounded-lg shadow-md transition-all duration-150 hover:shadow-lg border border-neutral-600 hover:border-neutral-500 cursor-pointer relative overflow-hidden`};
    &:hover {
        transform: translateY(-2px);
        ${tw`shadow-xl`};

        &::after {
            opacity: 0.1;
        }
    }

    &::after {
        content: '';
        ${tw`absolute inset-0 bg-white opacity-0 transition-opacity duration-150`};
    }
`;

const ModHeader = styled.div`
    ${tw`flex items-start gap-4 p-4 border-b border-neutral-600`};
`;

const ModIcon = styled.img`
    ${tw`w-16 h-16 rounded-lg object-cover bg-neutral-600 border-2 border-neutral-500`};
`;

const PlaceholderIcon = styled.div`
    ${tw`w-16 h-16 rounded-lg bg-neutral-600 border-2 border-neutral-500 flex items-center justify-center text-neutral-300`};
`;

const ModInfo = styled.div`
    ${tw`flex-1 min-w-0`};
`;

const ModDescription = styled.p`
    ${tw`mt-1 text-sm text-neutral-200 line-clamp-1`};
`;

const ModFooter = styled.div`
    ${tw`p-4 flex items-center justify-between`};
`;

const ModStats = styled.div`
    ${tw`text-xs text-neutral-300 flex items-center gap-4`};
`;

const StatItem = styled.span`
    ${tw`flex items-center gap-1`};
    svg {
        ${tw`text-neutral-400`};
    }
`;

interface Mod {
    id: string;
    name: string;
    short_description: string;
    url: string;
    icon_url: string | null;
    author?: string;
    downloads?: number;
    followers?: number;
    categories?: string[];
    last_updated?: string;
}

interface ApiResponse {
    data: Mod[];
    meta: {
        pagination: {
            total: number;
            count: number;
            per_page: number;
            current_page: number;
            total_pages: number;
        };
    };
}

interface Filters {
    perPage: number;
    provider: string;
    minecraft_version: string;
    mod_loader: string;
    search_query: string;
    sort: string;
}

const PAGE_SIZES = [
    { value: '12', label: '12 per page' },
    { value: '24', label: '24 per page' },
    { value: '36', label: '36 per page' },
    { value: '48', label: '48 per page' },
];

const PROVIDERS = [
    { value: 'modrinth', label: 'Modrinth' },
    { value: 'curseforge', label: 'CurseForge' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Sort by Relevance' },
    { value: 'downloads', label: 'Sort by Downloads' },
    { value: 'updated', label: 'Sort by Last Updated' },
];

const MOD_LOADERS = [
    { value: '', label: 'All Loaders' },
    { value: 'forge', label: 'Forge' },
    { value: 'neoforge', label: 'NeoForge' },
    { value: 'fabric', label: 'Fabric' },
    { value: 'liteloader', label: 'LiteLoader' },
    { value: 'quilt', label: 'Quilt' },
    { value: 'modloader', label: "Risugami's ModLoader" },
    { value: 'rift', label: 'Rift' },
];

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);

    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);
    const { clearFlashes, addError } = useFlashKey('mods');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [mods, setMods] = useState<PaginatedResult<Mod> | null>(null);
    const [selectedMod, setSelectedMod] = useState<{ id: string; name: string; provider: string } | null>(null);
    const [minecraftVersions, setMinecraftVersions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'All Versions' },
    ]);
    const [filters, setFilters] = useState<Filters>({
        search_query: '',
        provider: 'modrinth',
        minecraft_version: '',
        mod_loader: '',
        perPage: 12,
        sort: 'relevance',
    });

    useEffect(() => {
        if (!filters || !filters.provider) {
            setFilters((prev) => ({
                search_query: prev?.search_query || '',
                provider: 'modrinth',
                minecraft_version: prev?.minecraft_version || '',
                mod_loader: prev?.mod_loader || '',
                perPage: prev?.perPage || 12,
                sort: prev?.sort || 'relevance',
            }));
        }
    }, [filters]);
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<number | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = window.setTimeout(() => {
            setFilters((prev) => ({ ...prev, search_query: value }));
            setPage(1);
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                window.clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        loadMods();
    }, [page, filters]);

    useEffect(() => {
        setMinecraftVersions([{ value: '', label: 'All Versions' }]);
        setFilters((prev) => ({ ...prev, minecraft_version: '', mod_loader: '' }));
        loadGameVersions();
    }, [filters.provider]);

    const loadGameVersions = () => {
        http.get(`/api/client/servers/${uuid}/mods/minecraft-versions`, {
            params: { provider: filters.provider },
        })
            .then(({ data }) => {
                const versions = data.map((version: string) => ({
                    value: version,
                    label: version,
                }));

                setMinecraftVersions([{ value: '', label: 'All Versions' }, ...versions]);
            })
            .catch((error) => {
                console.error('Error loading Minecraft versions:', error);
                addError('Failed to load Minecraft versions: ' + httpErrorToHuman(error));
            });
    };

    const loadMods = () => {
        setLoading(true);
        clearFlashes();

        const safeProvider = filters?.provider || 'modrinth';
        const safePageSize = filters?.perPage || 12;
        const safeSearchQuery = filters?.search_query || '';
        const safeMinecraftVersion = filters?.minecraft_version || '';
        const safeModLoader = filters?.mod_loader || '';
        const safeSort = filters?.sort || 'relevance';

        http.get<ApiResponse>(`/api/client/servers/${uuid}/mods`, {
            params: {
                page: page,
                page_size: safePageSize,
                provider: safeProvider,
                search_query: safeSearchQuery,
                minecraft_version: safeMinecraftVersion,
                mod_loader: safeModLoader,
                sort: safeSort,
            },
        })
            .then(({ data }) => {
                if (data && data.meta && data.meta.pagination) {
                    setMods({
                        items: data.data || [],
                        pagination: {
                            total: data.meta.pagination.total || 0,
                            count: data.meta.pagination.count || 0,
                            perPage: data.meta.pagination.per_page || 10,
                            currentPage: data.meta.pagination.current_page || 1,
                            totalPages: data.meta.pagination.total_pages || 1,
                        },
                    });
                } else {
                    setMods({
                        items: [],
                        pagination: {
                            total: 0,
                            count: 0,
                            perPage: 10,
                            currentPage: 1,
                            totalPages: 1,
                        },
                    });
                    console.warn('Received unexpected data structure from API');
                }
            })
            .catch((error) => {
                console.error('Error loading mods:', error);
                addError('Failed to load mods: ' + httpErrorToHuman(error));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleInstall = (modId: string, modName: string) => {
        const safeProvider = filters.provider || 'modrinth';

        setSelectedMod({
            id: modId || '',
            name: modName || 'Mod',
            provider: safeProvider,
        });
    };

    const onInstallSuccess = () => {
        setMessage({ type: 'warning', text: 'Mod installed successfully!' });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading && !mods) return <Spinner size={'large'} centered />;

    return (
        <ServerContentBlock title={'Minecraft Mods'} showFlashKey={'mods'} css={tw`flex flex-col`}>
            <FlashMessageRender byKey={'mods'} css={tw`mb-4`} />
            {message && (
                <Alert type={message.type === 'success' ? 'warning' : message.type} className={'mb-4'}>
                    {message.text}
                </Alert>
            )}

            {filters.provider === 'spigotmc' || filters.provider === 'curseforge' ? (
                <FilterContainer css={tw`grid-cols-1 md:grid-cols-2 lg:grid-cols-5`}>
                    <FilterGroup>
                        <FilterIcon icon={faBars} />
                        <StyledSelect
                            value={filters.provider || 'modrinth'}
                            onChange={(e) => {
                                const value = e?.target?.value || 'modrinth';
                                try {
                                    setFilters((prev) => ({
                                        ...prev,
                                        provider: value,
                                        minecraft_version: '',
                                        mod_loader: '',
                                    }));
                                    setPage(1);
                                } catch (error) {
                                    console.error('Error changing provider:', error);
                                }
                            }}
                        >
                            {PROVIDERS.map((provider) => (
                                <option key={provider.value} value={provider.value}>
                                    {provider.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.perPage ? filters.perPage.toString() : '12'}
                            onChange={(e) => {
                                const value = e.target.value || '12';
                                setFilters((prev) => ({ ...prev, perPage: parseInt(value) }));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZES.map((size) => (
                                <option key={size.value} value={size.value}>
                                    {size.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faGamepad} />
                        <StyledSelect
                            value={filters.minecraft_version}
                            onChange={(e) => {
                                setFilters((prev) => ({ ...prev, minecraft_version: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {minecraftVersions && minecraftVersions.length > 0 ? (
                                minecraftVersions.map((version) => (
                                    <option key={version?.value || 'unknown'} value={version?.value || ''}>
                                        {version?.label || 'Unknown'}
                                    </option>
                                ))
                            ) : (
                                <option value=''>All Versions</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.sort}
                            onChange={(e) => {
                                setFilters((prev) => ({ ...prev, sort: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {SORT_OPTIONS && SORT_OPTIONS.length > 0 ? (
                                SORT_OPTIONS.map((option) => (
                                    <option key={option?.value || 'unknown'} value={option?.value || 'downloads'}>
                                        {option?.label || 'Downloads'}
                                    </option>
                                ))
                            ) : (
                                <option value='downloads'>Downloads</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup css={tw`col-span-1 md:col-span-2 lg:col-span-1`}>
                        <StyledInput value={searchTerm} onChange={handleSearch} placeholder='Search mods...' />
                    </FilterGroup>
                </FilterContainer>
            ) : (
                <FilterContainer>
                    <FilterGroup>
                        <FilterIcon icon={faBars} />
                        <StyledSelect
                            value={filters.provider || 'modrinth'}
                            onChange={(e) => {
                                const value = e?.target?.value || 'modrinth';
                                try {
                                    setFilters((prev) => ({
                                        ...prev,
                                        provider: value,
                                        minecraft_version: '',
                                        mod_loader: '',
                                    }));
                                    setPage(1);
                                } catch (error) {
                                    console.error('Error changing provider:', error);
                                }
                            }}
                        >
                            {PROVIDERS.map((provider) => (
                                <option key={provider.value} value={provider.value}>
                                    {provider.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.perPage ? filters.perPage.toString() : '12'}
                            onChange={(e) => {
                                const value = e.target.value || '12';
                                setFilters((prev) => ({ ...prev, perPage: parseInt(value) }));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZES.map((size) => (
                                <option key={size.value} value={size.value}>
                                    {size.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faGamepad} />
                        <StyledSelect
                            value={filters.minecraft_version}
                            onChange={(e) => {
                                setFilters((prev) => ({ ...prev, minecraft_version: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {minecraftVersions && minecraftVersions.length > 0 ? (
                                minecraftVersions.map((version) => (
                                    <option key={version?.value || 'unknown'} value={version?.value || ''}>
                                        {version?.label || 'Unknown'}
                                    </option>
                                ))
                            ) : (
                                <option value=''>All Versions</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    {filters.provider === 'modrinth' && (
                        <FilterGroup>
                            <FilterIcon icon={faPuzzlePiece} />
                            <StyledSelect
                                value={filters.mod_loader}
                                onChange={(e) => {
                                    setFilters((prev) => ({ ...prev, mod_loader: e.target.value }));
                                    setPage(1);
                                }}
                            >
                                {MOD_LOADERS &&
                                    MOD_LOADERS.map((loader) => (
                                        <option key={loader?.value || ''} value={loader?.value || ''}>
                                            {loader?.label || 'All Loaders'}
                                        </option>
                                    ))}
                            </StyledSelect>
                        </FilterGroup>
                    )}

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.sort}
                            onChange={(e) => {
                                setFilters((prev) => ({ ...prev, sort: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {SORT_OPTIONS && SORT_OPTIONS.length > 0 ? (
                                SORT_OPTIONS.map((option) => (
                                    <option key={option?.value || 'unknown'} value={option?.value || 'downloads'}>
                                        {option?.label || 'Downloads'}
                                    </option>
                                ))
                            ) : (
                                <option value='downloads'>Downloads</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <StyledInput value={searchTerm} onChange={handleSearch} placeholder='Search mods...' />
                    </FilterGroup>
                </FilterContainer>
            )}

            {loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <Pagination
                    data={
                        mods || {
                            items: [],
                            pagination: { total: 0, count: 0, perPage: 10, currentPage: 1, totalPages: 1 },
                        }
                    }
                    onPageSelect={setPage}
                >
                    {({ items }) => (
                        <div css={tw`grid gap-4 md:grid-cols-2 lg:grid-cols-3`}>
                            {items.length > 0 ? (
                                items.map((mod: Mod) => (
                                    <ModCard key={mod.id} onClick={() => handleInstall(mod.id, mod.name)}>
                                        <ModHeader>
                                            {mod.icon_url ? (
                                                <ModIcon src={mod.icon_url} alt={mod.name} />
                                            ) : (
                                                <PlaceholderIcon>
                                                    <FontAwesomeIcon icon={faPuzzlePiece} size='2x' />
                                                </PlaceholderIcon>
                                            )}
                                            <ModInfo>
                                                <h3 css={tw`text-sm font-semibold truncate mb-1`}>{mod.name}</h3>
                                                {mod.author && mod.author.trim() !== '' && (
                                                    <p css={tw`text-xs text-neutral-300 mb-1`}>By {mod.author}</p>
                                                )}
                                                <ModDescription>{mod.short_description}</ModDescription>
                                            </ModInfo>
                                        </ModHeader>
                                        <ModFooter>
                                            <ModStats>
                                                {mod.downloads !== undefined && (
                                                    <StatItem>
                                                        <FontAwesomeIcon icon={faDownload} />
                                                        {formatNumber(mod.downloads)}
                                                    </StatItem>
                                                )}
                                                {mod.followers !== undefined && filters.provider !== 'curseforge' && (
                                                    <StatItem>
                                                        <FontAwesomeIcon icon={faThumbsUp} />
                                                        {formatNumber(mod.followers)}
                                                    </StatItem>
                                                )}
                                                {mod.last_updated && (
                                                    <StatItem>
                                                        <FontAwesomeIcon icon={faClock} />
                                                        {formatDate(mod.last_updated)}
                                                    </StatItem>
                                                )}
                                            </ModStats>
                                        </ModFooter>
                                    </ModCard>
                                ))
                            ) : (
                                <div css={tw`col-span-full`}>
                                    <Alert type='warning'>No mods found matching your criteria.</Alert>
                                </div>
                            )}
                        </div>
                    )}
                </Pagination>
            )}

            {selectedMod !== null && (
                <InstallModal
                    modId={selectedMod.id}
                    modName={selectedMod.name}
                    provider={selectedMod.provider}
                    onInstalled={onInstallSuccess}
                    open={selectedMod !== null}
                    onClose={() => setSelectedMod(null)}
                />
            )}
        </ServerContentBlock>
    );
};

function formatDate(dateString: string): string {
    if (!dateString) {
        return 'Unknown date';
    }

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'Unknown date';
    }
}

function formatNumber(num: number): string {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }

    try {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    } catch (e) {
        console.error('Error formatting number:', e);
        return '0';
    }
}

function version_compare(a: string, b: string): number {
    const pa = a.split('.');
    const pb = b.split('.');

    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = Number(pa[i]) || 0;
        const nb = Number(pb[i]) || 0;

        if (na > nb) return 1;
        if (nb > na) return -1;
    }

    return 0;
}
