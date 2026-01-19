import React, { useEffect, useState, useRef } from 'react';
import InstallModal from '@/components/server/plugins/InstallModal';
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
import { faDownload, faClock, faThumbsUp, faBars, faPuzzlePiece, faGamepad, faSort, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

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

const PluginCard = styled.div`
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

const PluginHeader = styled.div`
    ${tw`flex items-start gap-4 p-4 border-b border-neutral-600`};
`;

const PluginIcon = styled.img`
    ${tw`w-16 h-16 rounded-lg object-cover bg-neutral-600 border-2 border-neutral-500`};
`;

const PlaceholderIcon = styled.div`
    ${tw`w-16 h-16 rounded-lg bg-neutral-600 border-2 border-neutral-500 flex items-center justify-center text-neutral-300`};
`;

const PluginInfo = styled.div`
    ${tw`flex-1 min-w-0`};
`;

const PluginDescription = styled.p`
    ${tw`mt-1 text-sm text-neutral-200 line-clamp-1`};
`;



const PluginFooter = styled.div`
    ${tw`p-4 flex items-center justify-between`};
`;

const PluginStats = styled.div`
    ${tw`text-xs text-neutral-300 flex items-center gap-4`};
`;

const StatItem = styled.span`
    ${tw`flex items-center gap-1`};
    svg {
        ${tw`text-neutral-400`};
    }
`;

interface Plugin {
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
    data: Plugin[];
    meta: {
        pagination: {
            total: number;
            count: number;
            per_page: number;
            current_page: number;
            total_pages: number;
        }
    };
}

interface Filters {
    perPage: number;
    provider: string;
    minecraft_version: string;
    plugin_loader: string;
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
    { value: 'spigotmc', label: 'SpigotMC' },
    { value: 'curseforge', label: 'CurseForge' },
    { value: 'hangar', label: 'Hangar' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Sort by Relevance' },
    { value: 'downloads', label: 'Sort by Downloads' },
    { value: 'updated', label: 'Sort by Last Updated' },
];

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);

    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);
    const { clearFlashes, addError } = useFlashKey('plugins');
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const [plugins, setPlugins] = useState<PaginatedResult<Plugin> | null>(null);
    const [selectedPlugin, setSelectedPlugin] = useState<{ id: string; name: string; provider: string } | null>(null);
    const [minecraftVersions, setMinecraftVersions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'All Versions' }
    ]);
    const [pluginLoaders, setPluginLoaders] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'All Loaders' }
    ]);
    const [filters, setFilters] = useState<Filters>({
        search_query: '',
        provider: 'modrinth',
        minecraft_version: '',
        plugin_loader: '',
        perPage: 12,
        sort: 'relevance'
    });


    useEffect(() => {
        if (!filters || !filters.provider) {
            setFilters(prev => ({
                search_query: prev?.search_query || '',
                provider: 'modrinth',
                minecraft_version: prev?.minecraft_version || '',
                plugin_loader: prev?.plugin_loader || '',
                perPage: prev?.perPage || 12,
                sort: prev?.sort || 'relevance'
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
            setFilters(prev => ({ ...prev, search_query: value }));
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
        loadPlugins();
    }, [page, filters]);

    useEffect(() => {

        setMinecraftVersions([{ value: '', label: 'All Versions' }]);
        setPluginLoaders([{ value: '', label: 'All Loaders' }]);


        setFilters(prev => ({ ...prev, minecraft_version: '', plugin_loader: '' }));


        loadGameVersions();
        loadPluginLoaders();
    }, [filters.provider]);

    const loadGameVersions = () => {
        http.get(`/api/client/servers/${uuid}/plugins/minecraft-versions`, {
            params: { provider: filters.provider }
        })
            .then(({ data }) => {
                const versions = data.map((version: string) => ({
                    value: version,
                    label: version
                }));

                setMinecraftVersions([
                    { value: '', label: 'All Versions' },
                    ...versions
                ]);
            })
            .catch(error => {
                console.error('Error loading Minecraft versions:', error);
                addError('Failed to load Minecraft versions: ' + httpErrorToHuman(error));
            });
    };

    const loadPluginLoaders = () => {

        if (filters.provider === 'spigotmc' || filters.provider === 'curseforge') {
            setPluginLoaders([]);
            return;
        }

        http.get(`/api/client/servers/${uuid}/plugins/loaders`, {
            params: { provider: filters.provider }
        })
            .then(({ data }) => {
                if (!data || data.length === 0) {
                    setPluginLoaders([]);
                    return;
                }

                const loaders = data.map((loader: string) => ({
                    value: loader,
                    label: loader
                }));

                setPluginLoaders([
                    { value: '', label: 'All Loaders' },
                    ...loaders
                ]);
            })
            .catch(error => {
                console.error('Error loading plugin loaders:', error);
                setPluginLoaders([]);
            });
    };

    const loadPlugins = () => {
        setLoading(true);
        clearFlashes();


        const safeProvider = filters?.provider || 'modrinth';
        const safePageSize = filters?.perPage || 12;
        const safeSearchQuery = filters?.search_query || '';
        const safeMinecraftVersion = filters?.minecraft_version || '';
        const safePluginLoader = filters?.plugin_loader || '';
        const safeSort = filters?.sort || 'relevance';

        http.get<ApiResponse>(`/api/client/servers/${uuid}/plugins`, {
            params: {
                page: page,
                page_size: safePageSize,
                provider: safeProvider,
                search_query: safeSearchQuery,
                minecraft_version: safeMinecraftVersion,
                plugin_loader: safePluginLoader,
                sort: safeSort,
            }
        })
            .then(({ data }) => {

                if (data && data.meta && data.meta.pagination) {
                    setPlugins({
                        items: data.data || [],
                        pagination: {
                            total: data.meta.pagination.total || 0,
                            count: data.meta.pagination.count || 0,
                            perPage: data.meta.pagination.per_page || 10,
                            currentPage: data.meta.pagination.current_page || 1,
                            totalPages: data.meta.pagination.total_pages || 1
                        }
                    });
                } else {

                    setPlugins({
                        items: [],
                        pagination: {
                            total: 0,
                            count: 0,
                            perPage: 10,
                            currentPage: 1,
                            totalPages: 1
                        }
                    });
                    console.warn('Received unexpected data structure from API');
                }
            })
            .catch(error => {
                console.error('Error loading plugins:', error);
                addError('Failed to load plugins: ' + httpErrorToHuman(error));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleInstall = (pluginId: string, pluginName: string) => {

        const safeProvider = filters.provider || 'modrinth';

        setSelectedPlugin({
            id: pluginId || '',
            name: pluginName || 'Plugin',
            provider: safeProvider
        });
    };

    const onInstallSuccess = () => {
        setMessage({ type: 'warning', text: 'Plugin installed successfully!' });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading && !plugins) return <Spinner size={'large'} centered />;

    return (
        <ServerContentBlock
            title={'Minecraft Plugins'}
            showFlashKey={'plugins'}
            css={tw`flex flex-col`}
        >
            <FlashMessageRender byKey={'plugins'} css={tw`mb-4`} />
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
                            onChange={e => {
                                const value = e?.target?.value || 'modrinth';
                                try {
                                    setFilters(prev => ({ ...prev, provider: value, minecraft_version: '', plugin_loader: '' }));
                                    setPage(1);
                                } catch (error) {
                                    console.error('Error changing provider:', error);
                                }
                            }}
                        >
                            {PROVIDERS.map(provider => (
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
                            onChange={e => {
                                const value = e.target.value || '12';
                                setFilters(prev => ({ ...prev, perPage: parseInt(value) }));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZES.map(size => (
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
                            onChange={e => {
                                setFilters(prev => ({ ...prev, minecraft_version: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {minecraftVersions && minecraftVersions.length > 0 ? minecraftVersions.map(version => (
                                <option key={version?.value || 'unknown'} value={version?.value || ''}>
                                    {version?.label || 'Unknown'}
                                </option>
                            )) : (
                                <option value="">All Versions</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.sort}
                            onChange={e => {
                                setFilters(prev => ({ ...prev, sort: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {SORT_OPTIONS && SORT_OPTIONS.length > 0 ? SORT_OPTIONS.map(option => (
                                <option key={option?.value || 'unknown'} value={option?.value || 'downloads'}>
                                    {option?.label || 'Downloads'}
                                </option>
                            )) : (
                                <option value="downloads">Downloads</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup css={tw`col-span-1 md:col-span-2 lg:col-span-1`}>
                        <StyledInput
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search plugins..."
                        />
                    </FilterGroup>
                </FilterContainer>
            ) : (
                <FilterContainer>
                    <FilterGroup>
                        <FilterIcon icon={faBars} />
                        <StyledSelect
                            value={filters.provider || 'modrinth'}
                            onChange={e => {
                                const value = e?.target?.value || 'modrinth';
                                try {
                                    setFilters(prev => ({ ...prev, provider: value, minecraft_version: '', plugin_loader: '' }));
                                    setPage(1);
                                } catch (error) {
                                    console.error('Error changing provider:', error);
                                }
                            }}
                        >
                            {PROVIDERS.map(provider => (
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
                            onChange={e => {
                                const value = e.target.value || '12';
                                setFilters(prev => ({ ...prev, perPage: parseInt(value) }));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZES.map(size => (
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
                            onChange={e => {
                                setFilters(prev => ({ ...prev, minecraft_version: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {minecraftVersions && minecraftVersions.length > 0 ? minecraftVersions.map(version => (
                                <option key={version?.value || 'unknown'} value={version?.value || ''}>
                                    {version?.label || 'Unknown'}
                                </option>
                            )) : (
                                <option value="">All Versions</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    {pluginLoaders && pluginLoaders.length > 0 && (
                        <FilterGroup>
                            <FilterIcon icon={faPuzzlePiece} />
                            <StyledSelect
                                value={filters.plugin_loader}
                                onChange={e => {
                                    setFilters(prev => ({ ...prev, plugin_loader: e.target.value }));
                                    setPage(1);
                                }}
                            >
                                {pluginLoaders.map(loader => (
                                    <option key={loader?.value || 'unknown'} value={loader?.value || ''}>
                                        {loader?.label || 'Unknown'}
                                    </option>
                                ))}
                            </StyledSelect>
                        </FilterGroup>
                    )}

                    <FilterGroup>
                        <FilterIcon icon={faSort} />
                        <StyledSelect
                            value={filters.sort}
                            onChange={e => {
                                setFilters(prev => ({ ...prev, sort: e.target.value }));
                                setPage(1);
                            }}
                        >
                            {SORT_OPTIONS && SORT_OPTIONS.length > 0 ? SORT_OPTIONS.map(option => (
                                <option key={option?.value || 'unknown'} value={option?.value || 'downloads'}>
                                    {option?.label || 'Downloads'}
                                </option>
                            )) : (
                                <option value="downloads">Downloads</option>
                            )}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <StyledInput
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search plugins..."
                        />
                    </FilterGroup>
                </FilterContainer>
            )}

            {loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <Pagination data={plugins || { items: [], pagination: { total: 0, count: 0, perPage: 10, currentPage: 1, totalPages: 1 } }} onPageSelect={setPage}>
                    {({ items }) => (
                        <div css={tw`grid gap-4 md:grid-cols-2 lg:grid-cols-3`}>
                            {items.length > 0 ? items.map((plugin: Plugin) => (
                                <PluginCard key={plugin.id} onClick={() => handleInstall(plugin.id, plugin.name)}>
                                    <PluginHeader>
                                        {plugin.icon_url ? (
                                            <PluginIcon src={plugin.icon_url} alt={plugin.name} />
                                        ) : (
                                            <PlaceholderIcon>
                                                <FontAwesomeIcon icon={faPuzzlePiece} size="2x" />
                                            </PlaceholderIcon>
                                        )}
                                        <PluginInfo>
                                            <h3 css={tw`text-sm font-semibold truncate mb-1`}>
                                                {plugin.name}
                                            </h3>
                                            {plugin.author && plugin.author.trim() !== '' && (
                                                <p css={tw`text-xs text-neutral-300 mb-1`}>
                                                    By {plugin.author}
                                                </p>
                                            )}
                                            <PluginDescription>
                                                {plugin.short_description}
                                            </PluginDescription>
                                        </PluginInfo>
                                    </PluginHeader>
                                    <PluginFooter>
                                        <PluginStats>
                                            {plugin.downloads !== undefined && (
                                                <StatItem>
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    {formatNumber(plugin.downloads)}
                                                </StatItem>
                                            )}
                                            {plugin.followers !== undefined && filters.provider !== 'curseforge' && (
                                                <StatItem>
                                                    <FontAwesomeIcon icon={faThumbsUp} />
                                                    {formatNumber(plugin.followers)}
                                                </StatItem>
                                            )}
                                            {plugin.last_updated && (
                                                <StatItem>
                                                    <FontAwesomeIcon icon={faClock} />
                                                    {formatDate(plugin.last_updated)}
                                                </StatItem>
                                            )}
                                        </PluginStats>
                                    </PluginFooter>
                                </PluginCard>
                            )) : (
                                <div css={tw`col-span-full`}>
                                    <Alert type="warning">
                                        No plugins found matching your criteria.
                                    </Alert>
                                </div>
                            )}
                        </div>
                    )}
                </Pagination>
            )}

            {selectedPlugin !== null && (
                <InstallModal
                    pluginId={selectedPlugin.id}
                    pluginName={selectedPlugin.name}
                    provider={selectedPlugin.provider}
                    onInstalled={onInstallSuccess}
                    open={selectedPlugin !== null}
                    onClose={() => setSelectedPlugin(null)}
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
