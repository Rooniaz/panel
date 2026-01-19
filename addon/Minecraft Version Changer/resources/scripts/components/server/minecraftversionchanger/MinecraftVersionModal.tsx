import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { ForkInfo } from '@/api/server/minecraftversionchanger/getMinecraftForks';
import getMinecraftVersions, { VersionInfo, BuildInfo } from '@/api/server/minecraftversionchanger/getMinecraftVersions';
import getMinecraftBuilds from '@/api/server/minecraftversionchanger/getMinecraftBuilds';
import updateMinecraftVersion from '@/api/server/minecraftversionchanger/updateMinecraftVersion';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/elements/button/index';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import Switch from '@/components/elements/Switch';

interface Props {
    visible: boolean;
    forkType: string;
    forkInfo: ForkInfo;
    onDismissed: () => void;
    onVersionChanged: () => void;
}

export default ({ visible, forkType, forkInfo, onDismissed, onVersionChanged }: Props) => {
    const [versions, setVersions] = useState<Record<string, VersionInfo>>({});
    const [builds, setBuilds] = useState<BuildInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBuilds, setLoadingBuilds] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [selectedBuild, setSelectedBuild] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [deleteServerFiles, setDeleteServerFiles] = useState(false);
    const [acceptEula, setAcceptEula] = useState(false);
    
    const { addError, addFlash, clearFlashes } = useFlash();
    const server = ServerContext.useStoreState(state => state.server.data!);
    
    const filteredAndSortedVersions = Object.entries(versions)
        .filter(([version, versionInfo]) => {
            // Show all versions, including snapshots, pre-releases, etc.
            // Only filter out versions that don't match the basic version pattern
            if (!/^\d+\.\d+(\.\d+)?(?:[-_]?(?:pre|rc|beta|alpha|snapshot|experimental|dev)[-_]?\d*)?$/i.test(version)) return false;
            
            return true;
        })
        .sort((a, b) => {
            // Extract the main version numbers for comparison
            const aMatch = a[0].match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
            const bMatch = b[0].match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
            
            if (!aMatch || !bMatch) return 0;
            
            const aMajor = parseInt(aMatch[1], 10);
            const bMajor = parseInt(bMatch[1], 10);
            
            if (aMajor !== bMajor) {
                return bMajor - aMajor; // Sort by major version (descending)
            }
            
            const aMinor = aMatch[2] ? parseInt(aMatch[2], 10) : 0;
            const bMinor = bMatch[2] ? parseInt(bMatch[2], 10) : 0;
            
            if (aMinor !== bMinor) {
                return bMinor - aMinor; // Sort by minor version (descending)
            }
            
            const aPatch = aMatch[3] ? parseInt(aMatch[3], 10) : 0;
            const bPatch = bMatch[3] ? parseInt(bMatch[3], 10) : 0;
            
            return bPatch - aPatch; // Sort by patch version (descending)
        });
    
    useEffect(() => {
        if (visible) {
            setShowModal(true);
            
            if (Object.keys(versions).length === 0) {
                loadVersions();
            }
        }
    }, [visible]);
    
    const handleClose = () => {
        setShowModal(false);
        setTimeout(() => {
            onDismissed();
        }, 150);
    };
    
    const loadVersions = () => {
        clearFlashes('minecraft:version:modal');
        setLoading(true);
        
        getMinecraftVersions(server.uuid, forkType)
            .then(data => {
                setVersions(data.versions);
                
                const filteredAndSortedKeys = Object.entries(data.versions)
                    .filter(([version, versionInfo]) => {
                        // Show all versions, including snapshots, pre-releases, etc.
                        // Only filter out versions that don't match the basic version pattern
                        if (!/^\d+\.\d+(\.\d+)?(?:[-_]?(?:pre|rc|beta|alpha|snapshot|experimental|dev)[-_]?\d*)?$/i.test(version)) return false;
                        
                        return true;
                    })
                    .sort((a, b) => {
                        // Extract the main version numbers for comparison
                        const aMatch = a[0].match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
                        const bMatch = b[0].match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
                        
                        if (!aMatch || !bMatch) return 0;
                        
                        const aMajor = parseInt(aMatch[1], 10);
                        const bMajor = parseInt(bMatch[1], 10);
                        
                        if (aMajor !== bMajor) {
                            return bMajor - aMajor; // Sort by major version (descending)
                        }
                        
                        const aMinor = aMatch[2] ? parseInt(aMatch[2], 10) : 0;
                        const bMinor = bMatch[2] ? parseInt(bMatch[2], 10) : 0;
                        
                        if (aMinor !== bMinor) {
                            return bMinor - aMinor; // Sort by minor version (descending)
                        }
                        
                        const aPatch = aMatch[3] ? parseInt(aMatch[3], 10) : 0;
                        const bPatch = bMatch[3] ? parseInt(bMatch[3], 10) : 0;
                        
                        return bPatch - aPatch; // Sort by patch version (descending)
                    });
                
                if (filteredAndSortedKeys.length > 0) {
                    const latestVersion = filteredAndSortedKeys[0][0];
                    setSelectedVersion(latestVersion);
                    loadBuilds(latestVersion);
                }
            })
            .catch(error => {
                console.error('Error loading versions:', error);
                addError({ key: 'minecraft:version:modal', message: httpErrorToHuman(error) });
            })
            .finally(() => {
                setLoading(false);
            });
    };
    
    const loadBuilds = (version: string) => {
        setLoadingBuilds(true);
        setBuilds([]);
        setSelectedBuild('');
        
        clearFlashes('minecraft:version:modal:builds');
        
        getMinecraftBuilds(server.uuid, forkType, version)
            .then(data => {
                if (Array.isArray(data.builds) && data.builds.length > 0) {
                    let sortedBuilds;
                    
                    // Special handling for different server types
                    const isSpecialType = ['fabric', 'forge', 'neoforge', 'sponge', 'legacyfabric'].includes(forkType.toLowerCase());
                    
                    if (isSpecialType) {
                        // For these types, we sort by name which contains the version number
                        sortedBuilds = [...data.builds].sort((a, b) => {
                            // Extract version numbers for comparison
                            const aVersion = a.name.toString();
                            const bVersion = b.name.toString();
                            
                            // Try to compare as semantic versions
                            const aParts = aVersion.split('.').map(p => parseInt(p, 10));
                            const bParts = bVersion.split('.').map(p => parseInt(p, 10));
                            
                            // Compare major, minor, patch versions
                            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                                const aVal = i < aParts.length ? aParts[i] : 0;
                                const bVal = i < bParts.length ? bParts[i] : 0;
                                
                                if (aVal !== bVal) {
                                    return bVal - aVal; // Descending order (newer first)
                                }
                            }
                            
                            return 0;
                        });
                    } else {
                        // For other types like Paper, use buildNumber
                        sortedBuilds = [...data.builds].sort((a, b) => {
                            if (typeof a.buildNumber === 'string' && typeof b.buildNumber === 'string' &&
                                /^\d+\.\d+(\.\d+)?$/.test(a.buildNumber) && /^\d+\.\d+(\.\d+)?$/.test(b.buildNumber)) {
                                return -1; 
                            }
                            return parseInt(b.buildNumber.toString(), 10) - parseInt(a.buildNumber.toString(), 10);
                        });
                    }
                    
                    setBuilds(sortedBuilds);
                    
                    if (sortedBuilds.length > 0) {
                        // For special types, use name as the build identifier
                        if (isSpecialType) {
                            setSelectedBuild(sortedBuilds[0].name.toString());
                        } else {
                            setSelectedBuild(sortedBuilds[0].buildNumber.toString());
                        }
                    }
                } else {
                    setBuilds([]);
                    setSelectedBuild('');
                }
            })
            .catch(error => {
                console.error('Error loading builds:', error);
                addError({ key: 'minecraft:version:modal:builds', message: httpErrorToHuman(error) });
            })
            .finally(() => {
                setLoadingBuilds(false);
            });
    };
    
    const handleVersionChange = (version: string) => {
        setSelectedVersion(version);
        setSelectedBuild('');
        
        if (version) {
            loadBuilds(version);
        } else {
            setBuilds([]);
        }
    };
    
    const submit = () => {
        clearFlashes('minecraft:version:modal');
        
        if (!selectedVersion || !selectedBuild) {
            return;
        }
        
        const selectedBuildObject = builds.find(build => {
            if (['fabric', 'forge', 'neoforge', 'sponge', 'legacyfabric'].includes(forkType.toLowerCase())) {
                return build.name.toString() === selectedBuild;
            } else {
                return build.buildNumber.toString() === selectedBuild;
            }
        });
        if (!selectedBuildObject) {
            addError({ key: 'minecraft:version:modal', message: 'Selected build not found' });
            return;
        }
        
        setLoading(true);
        
        updateMinecraftVersion(server.uuid, {
            type: forkType,
            version: selectedVersion,
            build: selectedBuild,
            buildName: selectedBuildObject.name,
            deleteFiles: deleteServerFiles,
            acceptEula: acceptEula,
        })
            .then(() => {
                onVersionChanged();
                handleClose();
            })
            .catch(error => {
                console.error(error);
                addError({ key: 'minecraft:version:modal', message: httpErrorToHuman(error) });
            })
            .finally(() => setLoading(false));
    };
    
    return (
        <Dialog 
            title={`Change Minecraft Version for ${forkInfo.name}`}
            open={showModal}
            onClose={handleClose}
        >
            <FlashMessageRender byKey="minecraft:version:modal" css={tw`mb-4`} />
            
            <div className="flex flex-col">
                {loading && Object.keys(versions).length === 0 ? (
                    <div className="flex flex-row justify-center items-center h-20">
                        <Spinner size="large" />
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <label htmlFor="version" className="block text-sm font-medium text-gray-400 mb-1">
                                Minecraft Version
                            </label>
                            <Select
                                id="version"
                                value={selectedVersion}
                                onChange={e => handleVersionChange(e.target.value)}
                            >
                                {filteredAndSortedVersions.map(([versionId, versionInfo]) => (
                                    <option key={versionId} value={versionId}>
                                        {versionId}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="build" className="block text-sm font-medium text-gray-400 mb-1">
                                Build
                            </label>
                            {loadingBuilds ? (
                                <div className="flex justify-center py-2">
                                    <Spinner size="small" />
                                </div>
                            ) : (
                                <Select
                                    id="build"
                                    value={selectedBuild}
                                    onChange={e => setSelectedBuild(e.target.value)}
                                    disabled={loadingBuilds || builds.length === 0}
                                >
                                    {builds.map(build => {
                                        const isSpecialType = ['fabric', 'forge', 'neoforge', 'sponge', 'legacyfabric'].includes(forkType.toLowerCase());
                                        const buildValue = isSpecialType ? build.name.toString() : build.buildNumber.toString();
                                        
                                        return (
                                            <option key={buildValue} value={buildValue}>
                                                {build.name}
                                            </option>
                                        );
                                    })}
                                </Select>
                            )}
                        </div>
                        
                        <div>
                            <div className="bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded">
                                <Switch
                                    name="delete_server_files"
                                    label="Delete Server Files"
                                    description="This will Wipe all files on your server before changing version."
                                    defaultChecked={deleteServerFiles}
                                    onChange={e => setDeleteServerFiles(e.target.checked)}
                                    readOnly={loading}
                                />
                            </div>
                            
                            <div className="bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded mt-4">
                                <Switch
                                    name="accept_eula"
                                    label="Accept EULA"
                                    description="By enabling this option you confirm that you have read and accept the Minecraft EULA. (https://minecraft.net/eula)"
                                    defaultChecked={acceptEula}
                                    onChange={e => setAcceptEula(e.target.checked)}
                                    readOnly={loading}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <Dialog.Footer>
                <Button.Text onClick={handleClose} className="w-full sm:w-auto">
                    Cancel
                </Button.Text>
                <Button 
                    onClick={submit}
                    disabled={loading || !selectedVersion || !selectedBuild}
                    className="w-full sm:w-auto"
                >
                    Change Version
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};
