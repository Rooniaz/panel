import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import getMinecraftForks, { ForkInfo, MinecraftForkResponse } from '@/api/server/minecraftversionchanger/getMinecraftForks';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faServer, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import MinecraftVersionModal from './MinecraftVersionModal';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import getCurrentMinecraftVersion, { CurrentMinecraftVersionResponse } from '@/api/server/minecraftversionchanger/getCurrentMinecraftVersion';
import Alert from '@/components/elements/alert/Alert';
import { Button } from '@/components/elements/button';

const CategoryContainer = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4`};
`;

const ForkCard = styled.div`
    ${tw`bg-gray-700 rounded-lg shadow-md p-4 flex flex-col cursor-pointer transition-colors duration-150 border border-transparent hover:border-blue-500`};
    
    &:hover {
        ${tw`bg-gray-600`};
    }
`;

const ForkHeader = styled.div`
    ${tw`flex items-center mb-3`};
`;

const ForkName = styled.h3`
    ${tw`text-lg font-medium text-gray-50 ml-2`};
`;

const ForkStats = styled.div`
    ${tw`flex justify-between text-xs text-gray-300 mt-3 font-medium`};
`;

const ForkIcon = styled.img`
    ${tw`rounded-full object-cover w-10 h-10 mr-2`};
`;

const StatsItem = styled.div`
    ${tw`flex items-center`};
`;

const CurrentVersionCard = styled.div`
    ${tw`bg-gray-700 rounded-lg shadow-md p-4 mb-6 flex items-center justify-between border-l-4 border-blue-500`};
`;

const CurrentVersionInfo = styled.div`
    ${tw`flex items-center`};
`;

const CurrentVersionText = styled.div`
    ${tw`ml-3`};
`;

const PageTitle = styled.h2`
    ${tw`text-2xl font-bold text-gray-100 mb-4`};
`;

export default () => {
    const [loading, setLoading] = useState(true);
    const [forks, setForks] = useState<Record<string, ForkInfo>>({});
    const [selectedFork, setSelectedFork] = useState<{ type: string; info: ForkInfo } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<{ type: string; version: string; build: string } | null>(null);
    const [versionWarning, setVersionWarning] = useState<string | null>(null);
    
    const { addError, clearFlashes } = useFlash();
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    
    useEffect(() => {
        clearFlashes('minecraft:version');
        
        Promise.all([
            getMinecraftForks(uuid),
            getCurrentMinecraftVersion(uuid)
        ]).then(([forksData, versionData]) => {
            setForks(forksData.forks);
            if (versionData.current && !versionData.warning) {
                setCurrentVersion(versionData.current);
            } else {
                setCurrentVersion(null);
            }
            if (versionData.warning && versionData.message) {
                setVersionWarning(versionData.message);
            }
        }).catch(error => {
            console.error(error);
            addError({ key: 'minecraft:version', message: httpErrorToHuman(error) });
        }).finally(() => {
            setLoading(false);
        });
    }, []);
    
    const handleSelectFork = (type: string, info: ForkInfo) => {
        setSelectedFork({ type, info });
        setShowModal(true);
    };
    
    const closeModal = () => {
        setShowModal(false);
        setSelectedFork(null);
    };
    
    const onVersionChanged = () => {
        clearFlashes('minecraft:version');
        getCurrentMinecraftVersion(uuid).then(data => {
            if (data.current && !data.warning) {
                setCurrentVersion(data.current);
            } else {
                setCurrentVersion(null);
            }
            
            setVersionWarning(null);
        }).catch(error => {
            console.error(error);
            addError({ key: 'minecraft:version', message: httpErrorToHuman(error) });
        });
    };
    
    
    const getForkIconUrl = (type: string, info?: ForkInfo) => {
        
        if (info && info.icon) {
            return info.icon;
        }
        
        
        if (type && forks[type] && forks[type].icon) {
            return forks[type].icon;
        }
        
        
        return '';
    };
    
    return (
        <PageContentBlock title="Minecraft Version Manager">
            <FlashMessageRender byKey="minecraft:version" css={tw`mb-4`} />
            
            {loading ? (
                <div css={tw`flex justify-center py-8`}>
                    <Spinner size="large" />
                </div>
            ) : (
                <>
                    {versionWarning && (
                        <Alert type="warning" className="mb-4">
                            <span className="text-sm">{versionWarning}</span>
                        </Alert>
                    )}
                    
                    {currentVersion && (
                        <CurrentVersionCard>
                            <CurrentVersionInfo>
                                <ForkIcon 
                                    src={getForkIconUrl(currentVersion.type, forks[currentVersion.type])} 
                                    alt={currentVersion.type}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '';
                                    }}
                                />
                                <CurrentVersionText>
                                    <h3 css={tw`text-lg font-medium text-gray-50 mb-1`}>Current Version</h3>
                                    <p css={tw`text-sm text-gray-400`}>
                                        <span css={tw`text-gray-50 font-semibold`}>{currentVersion.type}</span> {currentVersion.version} (build: <span css={tw`text-blue-400`}>{currentVersion.build}</span>)
                                    </p>
                                </CurrentVersionText>
                            </CurrentVersionInfo>
                        </CurrentVersionCard>
                    )}
                    
                    <div css={tw`mb-8`}>
                        <CategoryContainer>
                            {Object.entries(forks).map(([type, info]) => (
                                <ForkCard 
                                    key={type} 
                                    onClick={() => handleSelectFork(type, info)}
                                >
                                    <ForkHeader>
                                        <ForkIcon 
                                            src={getForkIconUrl(type, info)} 
                                            alt={info.name}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '';
                                            }}
                                        />
                                        <ForkName>{info.name}</ForkName>
                                    </ForkHeader>
                                    <ForkStats>
                                        <StatsItem>
                                            <FontAwesomeIcon icon={faServer} css={tw`text-gray-400 mr-1`} />
                                            <span>{info.versions?.minecraft || 0} Versions</span>
                                        </StatsItem>
                                        <StatsItem>
                                            <FontAwesomeIcon icon={faCodeBranch} css={tw`text-gray-400 mr-1`} />
                                            <span>{info.builds || 0} Builds</span>
                                        </StatsItem>
                                    </ForkStats>
                                </ForkCard>
                            ))}
                        </CategoryContainer>
                    </div>
                    
                    {selectedFork && (
                        <MinecraftVersionModal
                            visible={showModal}
                            forkType={selectedFork.type}
                            forkInfo={selectedFork.info}
                            onDismissed={closeModal}
                            onVersionChanged={onVersionChanged}
                        />
                    )}
                </>
            )}
        </PageContentBlock>
    );
};
