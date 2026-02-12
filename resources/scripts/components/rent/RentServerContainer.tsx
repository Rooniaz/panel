import React, { useState, useRef, useEffect } from 'react';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import HardwareSelection from './HardwareSelection';
import PackageSelection from './PackageSelection';
import GameSelection from './GameSelection';
import VersionSelection from './VersionSelection';
import ServerSettings from './ServerSettings';
import { Hardware } from '@/api/spring/hardware';
import { createServer } from '@/api/spring/servers';
import getUserProfile from '@/api/spring/userProfile';
import useFlash from '@/plugins/useFlash';
import { useHistory } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';

const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

const Container = styled.div`
    ${tw`lg:ml-64 pt-4 overflow-x-hidden relative`}
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 2rem !important;
    margin-bottom: 0 !important;
    position: relative;
    z-index: 1;
    background: transparent;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
    }
`;

const ContentWrapper = styled.div`
    ${tw`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}
    flex: 1; /* ดันเนื้อหาให้ยืดหยุ่น */
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
`;

const WarningBanner = styled.div`
    ${tw`relative rounded-2xl p-5 mb-4 overflow-hidden border backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
    border-color: rgba(234, 179, 8, 0.4);
    box-shadow: 0 10px 40px rgba(234, 179, 8, 0.2), 0 0 0 1px rgba(234, 179, 8, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    margin-bottom: 1rem !important;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(234, 179, 8, 0.1), transparent);
        animation: ${shimmer} 3s infinite;
    }

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
    }
`;

const WarningContent = styled.div`
    ${tw`flex items-start gap-4 relative z-10`}
`;

const WarningIcon = styled.div`
    ${tw`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl`}
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(217, 119, 6, 0.2));
    color: #fbbf24;
    box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
`;

const WarningText = styled.p`
    ${tw`text-yellow-100 text-sm leading-relaxed flex-1`}
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

export interface Package {
    id: string;
    packageId: number; // Real package ID from Spring Boot (from packages table)
    name: string;
    cpu: number;
    ram: number;
    storage: number;
    pricePerHour: number; // Price from packages.price (should match database)
    isFull: boolean; // true if capacity reached
    isRecommended?: boolean;
    capacity?: number; // Maximum number of servers for this package
    rentedCount?: number; // Current number of rented servers
    availableCount?: number; // Available slots remaining
    status?: 'available' | 'limited' | 'unavailable'; // Availability status from API
}

export interface GameType {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface Version {
    id: string;
    name: string;
    javaVersion: string;
    isLatest?: boolean;
    eggId?: number; // Egg ID from Spring Boot API
}

type Step = 'game' | 'version' | 'hardware' | 'package' | 'settings';

export default () => {
    const [step, setStep] = useState<Step>('game');
    const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [serverName, setServerName] = useState('');

    const handleGameSelect = (game: GameType) => {
        setSelectedGame(game);
        setStep('version');
    };

    const handleVersionSelect = (version: Version) => {
        setSelectedVersion(version);
        setStep('hardware');
    };

    const handleHardwareSelect = (hardware: Hardware) => {
        setSelectedHardware(hardware);
        setStep('package');
    };

    const handlePackageSelect = (pkg: Package) => {
        if (pkg.isFull) return;
        setSelectedPackage(pkg);
        setStep('settings');
    };

    const { addError, addFlash, clearFlashes } = useFlash();

    const handleBack = () => {
        clearFlashes('server:create'); // Clear flash messages เมื่อย้อนกลับ
        if (step === 'version') {
            setStep('game');
            setSelectedVersion(null);
        } else if (step === 'hardware') {
            setStep('version');
            setSelectedHardware(null);
        } else if (step === 'package') {
            setStep('hardware');
            setSelectedPackage(null);
        } else if (step === 'settings') {
            setStep('package');
        }
    };

    const handleBackToGame = () => {
        clearFlashes('server:create'); // Clear flash messages เมื่อย้อนกลับ
        setStep('game');
        setSelectedGame(null);
        setSelectedVersion(null);
        setSelectedHardware(null);
        setSelectedPackage(null);
    };
    const history = useHistory();
    const [isCreating, setIsCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState<string>('');
    const pollingRef = useRef<{ stop: () => void } | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup polling when component unmounts
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearFlashes('server:create'); // Clear flash messages เมื่อ component unmount
            if (pollingRef.current) {
                pollingRef.current.stop();
            }
        };
    }, []);

    const handleCreateServer = async () => {
        if (!selectedPackage || !selectedGame || !selectedVersion || !serverName.trim()) {
            addError({ key: 'server:create', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        try {
            setIsCreating(true);
            clearFlashes('server:create');
            setCreationProgress('กำลังตรวจสอบชื่อเซิร์ฟเวอร์...');

            // Check server name availability before creating
            const { checkServerNameAvailability } = await import('@/api/spring/servers');
            const nameCheck = await checkServerNameAvailability(serverName.trim());
            if (!nameCheck.available) {
                setIsCreating(false);
                setCreationProgress('');
                addError({
                    key: 'server:create',
                    message: nameCheck.message || `ชื่อ Server "${serverName}" ถูกใช้ไปแล้ว กรุณาเลือกชื่ออื่น`,
                });
                return;
            }

            setCreationProgress('กำลังตรวจสอบยอดเงิน...');

            // Check user balance before creating server
            const userProfile = await getUserProfile();
            if (userProfile.credit < selectedPackage.pricePerHour) {
                setIsCreating(false);
                setCreationProgress('');
                addError({
                    key: 'server:create',
                    message: `ยอดเงินไม่พอ: คุณมี ${userProfile.credit} เครดิต แต่แพ็กเกจนี้ราคา ${selectedPackage.pricePerHour} เครดิต/ชั่วโมง กรุณาเติมเงินก่อน`,
                });
                return;
            }

            setCreationProgress('กำลังสร้าง Server...');

            // Map game.id to gameKey and egg type
            // Bedrock uses Bedrock versions, others use Java versions
            const gameKeyMap: { [key: string]: string } = {
                vanilla: 'MINECRAFT-JAVA',
                bedrock: 'MINECRAFT-BEDROCK',
                cross: 'MINECRAFT-CROSS', // Cross uses Java versions but needs Geyser
                plugin: 'MINECRAFT-PLUGIN', // Plugin uses Java versions but needs Paper
                mod: 'MINECRAFT-MOD', // Mod uses Java versions but needs Fabric
            };
            const gameKey = gameKeyMap[selectedGame.id] || 'MINECRAFT-JAVA';

            // Map game type to egg type for server creation
            const eggTypeMap: { [key: string]: string } = {
                vanilla: 'vanilla',
                bedrock: 'bedrock',
                cross: 'paper', // Cross uses Paper (not Vanilla) because Geyser needs Paper/Spigot
                plugin: 'paper', // Plugin uses Paper
                mod: 'forge', // Mod uses Forge
            };
            const eggType = eggTypeMap[selectedGame.id] || 'vanilla';

            // Extract version number (e.g., "1.21.5" from "1.21.5 | Java-21")
            const extractVersionNumber = (versionString: string): string => {
                const match = versionString.match(/^(\d+\.\d+(\.\d+)?)/);
                return match ? match[1] : versionString;
            };
            // Extract clean version number (remove " | Java-XX" suffix)
            const versionNumber = extractVersionNumber(selectedVersion.name).split('|')[0].trim();

            // Hard-override eggId by game type (do not trust version eggId = 6 from Java list)
            const resolvedEggId = (() => {
                if (selectedGame.id === 'mod') return 3; // Forge
                if (selectedGame.id === 'plugin' || selectedGame.id === 'cross') return 4; // Paper
                return selectedVersion.eggId;
            })();

            // Build payload with environment variables for each egg type
            const payload: any = {
                serverName: serverName.trim(),
                packageId: selectedPackage.packageId,
                gameKey: gameKey,
                gameType: selectedGame.id, // vanilla, bedrock, cross, plugin, mod
                eggType: eggType, // vanilla, bedrock, paper, fabric, forge
                version: selectedVersion.name, // Keep original format
                vanillaVersion: versionNumber, // Clean version number
                eggId: resolvedEggId, // Override eggId
                enableBackup: true,
            };

            // Add Forge-specific environment variables for mod servers
            if (selectedGame.id === 'mod') {
                payload.mcVersion = versionNumber; // MC_VERSION for Forge
                payload.buildType = 'recommended'; // BUILD_TYPE: recommended or latest
                payload.forgeVersion = ''; // FORGE_VERSION: empty = auto-select
                payload.serverJarFile = 'server.jar'; // SERVER_JARFILE
            }

            // Add Geyser installation flag for cross-play servers
            if (selectedGame.id === 'cross') {
                payload.installGeyser = true;
            } else if (selectedGame.id === 'plugin') {
                payload.installGeyser = false;
            }

            // Call Spring Boot API
            const response = await createServer(payload);

            if (!response.success || !response.serverId) {
                // Check for duplicate server name error
                const errorMsg = response.message || 'Failed to create server';
                if (
                    errorMsg.includes('duplicate') ||
                    errorMsg.includes('already exists') ||
                    errorMsg.includes('ถูกใช้ไปแล้ว')
                ) {
                    throw new Error(errorMsg);
                }
                throw new Error(errorMsg);
            }

            setCreationProgress('Server ถูกสร้างแล้ว กำลังติดตั้ง...');

            // Skip polling if Spring Boot API doesn't have the endpoint
            // Just show success and redirect immediately
            if (!isMountedRef.current) {
                return;
            }

            setIsCreating(false);
            addFlash({
                key: 'server:create',
                type: 'success',
                title: 'สำเร็จ',
                message: 'Server ถูกสร้างแล้ว กรุณาตรวจสอบสถานะในหน้า "เซิร์ฟเวอร์ของฉัน"',
            });
            // Redirect to server list page immediately
            setTimeout(() => {
                if (isMountedRef.current) {
                    history.push('/servers');
                }
            }, 1500);
        } catch (error: any) {
            setIsCreating(false);
            setCreationProgress('');
            addError({
                key: 'server:create',
                message: error.message || 'ไม่สามารถสร้าง Server ได้ กรุณาลองใหม่อีกครั้ง',
            });
        }
    };

    return (
        <Container>
            <ContentWrapper>
                <FlashMessageRender byKey='server:create' css={tw`mb-4`} />
                <WarningBanner>
                    <WarningContent>
                        <WarningIcon>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </WarningIcon>
                        <WarningText>
                            เมื่อเช่าเซิร์ฟเวอร์แล้วระบบจะทำการหักเครดิตในบัญชีแบบรายชั่วโมงโดยอัตโนมัติตามแพ็กเกจที่เลือกไว้
                            ไม่ว่าจะปิดหรือเปิดเซิร์ฟเวอร์ เนื่องจากเป็นการถือสิทธิ์ในการครอบครองเซิร์ฟเวอร์นั้น
                        </WarningText>
                    </WarningContent>
                </WarningBanner>

                {step === 'game' && <GameSelection onSelect={handleGameSelect} onBack={handleBackToGame} />}
                {step === 'version' && selectedGame && (
                    <VersionSelection
                        selectedGame={selectedGame}
                        onSelect={handleVersionSelect}
                        onBack={handleBack}
                    />
                )}
                {step === 'hardware' && selectedGame && selectedVersion && (
                    <HardwareSelection onSelect={handleHardwareSelect} onBack={handleBack} />
                )}
                {step === 'package' && selectedHardware && selectedGame && selectedVersion && (
                    <PackageSelection
                        hardwareId={selectedHardware.id}
                        onSelect={handlePackageSelect}
                        onBack={handleBack}
                    />
                )}
                {step === 'settings' && selectedPackage && selectedGame && selectedVersion && (
                    <ServerSettings
                        selectedPackage={selectedPackage}
                        selectedGame={selectedGame}
                        selectedVersion={selectedVersion}
                        serverName={serverName}
                        onServerNameChange={setServerName}
                        onCreate={handleCreateServer}
                        onBack={handleBack}
                        isCreating={isCreating}
                        creationProgress={creationProgress}
                    />
                )}
            </ContentWrapper>
        </Container>
    );
};
