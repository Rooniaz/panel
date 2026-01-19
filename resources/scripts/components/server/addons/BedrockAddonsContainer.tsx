import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import Select from '@/components/elements/Select';
import Input from '@/components/elements/Input';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLayerGroup,
    faList,
    faDownload,
    faCalendarAlt,
    faSort,
    faCube,
    faGamepad,
} from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import BedrockAddonInstallModal from './BedrockAddonInstallModal';
import BedrockManageAddonsModal from './BedrockManageAddonsModal';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router';
import MessageBox from '@/components/MessageBox';
import { Button } from '@/components/elements/button/index';
const FilterContainer = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 my-4`};
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
const StyledButton = styled(Button.Text)`
    ${tw`w-full h-11`};
`;
const AddonGrid = styled.div`
    ${tw`grid gap-4 md:grid-cols-2 lg:grid-cols-3`};
`;
const AddonCard = styled.div`
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
const AddonHeader = styled.div`
    ${tw`flex items-start gap-4 p-4 border-b border-neutral-600`};
`;
const AddonIcon = styled.img`
    ${tw`w-16 h-16 rounded-lg object-cover bg-neutral-600 border-2 border-neutral-500`};
`;
const AddonInfo = styled.div`
    ${tw`flex-1 min-w-0`};
`;
const AddonDescription = styled.p`
    ${tw`mt-1 text-sm text-neutral-200 line-clamp-1`};
`;
const AddonFooter = styled.div`
    ${tw`p-4 flex items-center justify-between`};
`;
const AddonStats = styled.div`
    ${tw`text-xs text-neutral-300 flex items-center gap-4`};
`;
const StatItem = styled.span`
    ${tw`flex items-center gap-1`};
    svg {
        ${tw`text-neutral-400`};
    }
`;
const AddonTag = styled.span`
    ${tw`px-2 py-1 text-xs bg-neutral-800 text-neutral-200 rounded-md`};
`;
interface Addon {
    id: number;
    name: string;
    summary: string;
    author: string;
    thumbnailUrl: string;
    downloadCount: number;
    gameVersion: string;
    addonType: string;
    fileDate?: string;
    dateModified?: string;
    dateCreated?: string;
    classId?: number;
    type?: string;
}
interface FilterOption {
    value: string;
    label: string;
}
interface PaginationData {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
}
interface AddonFile {
    id: number;
    displayName: string;
    fileName: string;
    downloadUrl: string;
    gameVersion: string;
    fileDate?: string;
    fileSize: number;
}
const PAGE_SIZES = [
    { value: 12, label: '12 per page' },
    { value: 24, label: '24 per page' },
    { value: 48, label: '48 per page' },
];
const SORT_OPTIONS = [
    { value: 'relevancy', label: 'Relevancy' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'totalDownloads', label: 'Downloads' },
    { value: 'lastUpdated', label: 'Last Update' },
];
const getAddonUpdateDate = (addon: Addon): string => {
    if (addon.fileDate) return addon.fileDate;
    if (addon.dateModified) return addon.dateModified;
    if (addon.dateCreated) return addon.dateCreated;
    return new Date().toISOString();
};
const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};
const getAddonTypeLabel = (type: string): string => {
    switch (type) {
        case 'addon':
            return 'Addon';
        case 'map':
            return 'Map';
        case 'texture_pack':
            return 'Texture Pack';
        case 'script':
            return 'Script';
        case 'skin':
            return 'Skin Pack';
        case 'behavior_pack':
            return 'Behavior Pack';
        case 'resource_pack':
            return 'Resource Pack';
        case 'world':
            return 'World';
        default:
            return 'Addon';
    }
};
const getAddonTag = (addon: Addon): string => {
    if (addon.classId === 4984) {
        return 'Addon';
    } else if (addon.classId === 6913) {
        return 'Map';
    } else if (addon.classId === 6929) {
        return 'Texture Pack';
    } else if (addon.classId === 6940) {
        return 'Script';
    } else if (addon.classId === 6925) {
        return 'Skin Pack';
    }
    return 'Addon';
};
export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('bedrock_addons');
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const defaultSearch = params.get('query') || '';
    const defaultPageSize = Number(params.get('perPage') || 12);
    const defaultPage = Number(params.get('page') || 1);
    const [searchTerm, setSearchTerm] = useState(defaultSearch);
    const [perPage, setPerPage] = useState(
        !isNaN(defaultPageSize) && [12, 24, 48].includes(defaultPageSize) ? defaultPageSize : 24
    );
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const defaultType = params.get('type') || '';
    const defaultGameVersion = params.get('gameVersion') || '';
    const defaultSort = params.get('sort') || 'relevancy';
    const [addonType, setAddonType] = useState(defaultType);
    const [gameVersion, setGameVersion] = useState(defaultGameVersion);
    const [sortBy, setSortBy] = useState(defaultSort);
    const [typeOptions, setTypeOptions] = useState<FilterOption[]>([]);
    const [versionOptions, setVersionOptions] = useState<FilterOption[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        count: 0,
        perPage: perPage,
        currentPage: page,
        totalPages: 1,
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showAddonModal, setShowAddonModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
    useEffect(() => {
        clearFlashes();
        loadFilterOptions();
    }, []);
    useEffect(() => {
        clearFlashes();
        loadAddons();
    }, [perPage, page, searchTerm, addonType, gameVersion, sortBy]);
    const loadFilterOptions = () => {
        setLoadingFilters(true);
        setTypeOptions([]);
        setVersionOptions([]);
        http.get(`/api/client/servers/${id}/bedrock/addons/filters`)
            .then(({ data }) => {
                if (data.types) {
                    const types = Object.entries(data.types).map(([value, label]) => ({
                        value,
                        label: label as string,
                    }));
                    setTypeOptions([{ value: '', label: 'All Types' }, ...types]);
                }
                if (data.versions) {
                    const versions = data.versions.map((item: string) => ({
                        value: item,
                        label: item,
                    }));
                    setVersionOptions([{ value: '', label: 'All Versions' }, ...versions]);
                }
                setLoadingFilters(false);
            })
            .catch((error) => {
                setLoadingFilters(false);
            });
    };
    const loadAddons = () => {
        setLoading(true);
        http.get(`/api/client/servers/${id}/bedrock/addons`, {
            params: {
                query: searchTerm,
                perPage: perPage,
                page: page,
                type: addonType,
                version: gameVersion,
                sort: sortBy,
            },
        })
            .then(({ data }) => {
                setAddons(data.items);
                setPagination(data.pagination);
                setLoading(false);
            })
            .catch((error) => {
                setErrorMessage(error.message || 'Failed to load addons');
                setLoading(false);
            });
    };
    const onPageSelect = (newPage: number) => {
        setPage(newPage);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };
    const selectAddon = (addon: Addon) => {
        setSelectedAddon(addon);
        setShowAddonModal(true);
    };
    return (
        <ServerContentBlock showFlashKey={'bedrock_addons'} title={'Bedrock Addons'}>
            {successMessage && (
                <MessageBox type='success' title='Success' css={tw`mb-4`}>
                    {successMessage}
                </MessageBox>
            )}
            {errorMessage && (
                <MessageBox type='error' title='Error' css={tw`mb-4`}>
                    {errorMessage}
                </MessageBox>
            )}
            <FilterContainer>
                <FilterGroup>
                    <FilterIcon icon={faCube} />
                    <StyledSelect
                        value={addonType}
                        onChange={(e) => {
                            setAddonType(e.target.value);
                            setPage(1);
                        }}
                        disabled={loadingFilters || typeOptions.length === 0}
                    >
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </StyledSelect>
                </FilterGroup>
                <FilterGroup>
                    <FilterIcon icon={faList} />
                    <StyledSelect
                        value={perPage.toString()}
                        onChange={(e) => {
                            setPerPage(parseInt(e.target.value));
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
                        value={gameVersion}
                        onChange={(e) => {
                            setGameVersion(e.target.value);
                            setPage(1);
                        }}
                        disabled={loadingFilters || versionOptions.length === 0}
                    >
                        {versionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </StyledSelect>
                </FilterGroup>
                <FilterGroup>
                    <FilterIcon icon={faSort} />
                    <StyledSelect
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPage(1);
                        }}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </StyledSelect>
                </FilterGroup>
                <FilterGroup>
                    <StyledInput placeholder='Search addons...' value={searchTerm} onChange={handleSearch} />
                </FilterGroup>
                <FilterGroup>
                    <StyledButton type='button' onClick={() => setShowManageModal(true)}>
                        Manage Addons
                    </StyledButton>
                </FilterGroup>
            </FilterContainer>
            {loading ? (
                <Spinner size='large' centered />
            ) : (
                <Pagination data={{ items: addons, pagination }} onPageSelect={onPageSelect}>
                    {({ items }) => (
                        <AddonGrid>
                            {items.length > 0 ? (
                                items.map((addon) => (
                                    <AddonCard key={addon.id} onClick={() => selectAddon(addon)}>
                                        <AddonHeader>
                                            {addon.thumbnailUrl ? (
                                                <AddonIcon
                                                    src={addon.thumbnailUrl}
                                                    alt={`${addon.name} icon`}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    css={tw`w-16 h-16 rounded-lg bg-neutral-600 border-2 border-neutral-500 flex items-center justify-center text-neutral-300`}
                                                >
                                                    <FontAwesomeIcon icon={faLayerGroup} size='lg' />
                                                </div>
                                            )}
                                            <AddonInfo>
                                                <div css={tw`flex-1 mr-4`}>
                                                    <div css={tw`flex items-center text-sm mb-1`}>
                                                        <span css={tw`font-semibold line-clamp-1`}>{addon.name}</span>
                                                    </div>
                                                    <p css={tw`text-sm text-neutral-300`}>By {addon.author}</p>
                                                </div>
                                                <AddonDescription>{addon.summary}</AddonDescription>
                                            </AddonInfo>
                                        </AddonHeader>
                                        <AddonFooter>
                                            <AddonStats>
                                                <StatItem>
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    {formatNumber(addon.downloadCount)}
                                                </StatItem>
                                                <StatItem>
                                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                                    Updated{' '}
                                                    {formatDistanceToNow(new Date(getAddonUpdateDate(addon)), {
                                                        addSuffix: true,
                                                    })}
                                                </StatItem>
                                            </AddonStats>
                                            <AddonTag>{getAddonTag(addon)}</AddonTag>
                                        </AddonFooter>
                                    </AddonCard>
                                ))
                            ) : (
                                <p css={tw`text-center text-sm text-neutral-300 col-span-3`}>
                                    No addons found matching your search criteria.
                                </p>
                            )}
                        </AddonGrid>
                    )}
                </Pagination>
            )}
            {selectedAddon && (
                <BedrockAddonInstallModal
                    addon={selectedAddon}
                    open={showAddonModal}
                    onClose={() => {
                        setShowAddonModal(false);
                        setSelectedAddon(null);
                    }}
                    onInstalled={(addonType) => {
                        const typeName = getAddonTypeLabel(addonType);
                        setSuccessMessage(
                            `Addon ${selectedAddon.name} has successfully installed as ${typeName}. Restart your server to apply ${typeName}`
                        );
                        setShowAddonModal(false);
                        setSelectedAddon(null);
                    }}
                />
            )}
            <BedrockManageAddonsModal
                open={showManageModal}
                onClose={() => setShowManageModal(false)}
                onSuccess={(message) => {
                    setSuccessMessage(message);
                }}
            />
        </ServerContentBlock>
    );
};
