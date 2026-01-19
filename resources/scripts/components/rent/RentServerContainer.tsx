import React, { useState, useRef, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
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

const Container = styled.div`
    ${tw`min-h-screen bg-neutral-900 py-8`}
`;

const WarningBanner = styled.div`
    ${tw`bg-yellow-500/20 border-l-4 border-yellow-500 p-4 mb-6`}
`;

const WarningText = styled.p`
    ${tw`text-yellow-200 text-sm`}
`;

export interface Package {
    id: string;
    packageId: number; // Real package ID from Spring Boot
    name: string;
    cpu: number;
    ram: number;
    storage: number;
    pricePerHour: number;
    isFull: boolean;
    isRecommended?: boolean;
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

type Step = 'hardware' | 'package' | 'game' | 'version' | 'settings';

export default () => {
    const [step, setStep] = useState<Step>('hardware');
    const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [serverName, setServerName] = useState('');

    const handleHardwareSelect = (hardware: Hardware) => {
        setSelectedHardware(hardware);
        setStep('package');
    };

    const handlePackageSelect = (pkg: Package) => {
        if (pkg.isFull) return;
        setSelectedPackage(pkg);
        setStep('game');
    };

    const handleGameSelect = (game: GameType) => {
        setSelectedGame(game);
        setStep('version');
    };

    const handleVersionSelect = (version: Version) => {
        setSelectedVersion(version);
        setStep('settings');
    };

    const { addError, addFlash, clearFlashes } = useFlash();

    const handleBack = () => {
        clearFlashes('server:create'); // Clear flash messages เมื่อย้อนกลับ
        if (step === 'package') {
            setStep('hardware');
            setSelectedHardware(null);
            setSelectedPackage(null);
        } else if (step === 'game') {
            setStep('package');
            setSelectedPackage(null);
        } else if (step === 'version') {
            setStep('game');
            setSelectedVersion(null);
        } else if (step === 'settings') {
            setStep('version');
        }
    };

    const handleBackToPackage = () => {
        clearFlashes('server:create'); // Clear flash messages เมื่อย้อนกลับ
        setStep('package');
        setSelectedPackage(null);
        setSelectedGame(null);
        setSelectedVersion(null);
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
            <div css={tw`max-w-6xl mx-auto px-4`}>
                <FlashMessageRender byKey='server:create' css={tw`mb-4`} />
                <WarningBanner>
                    <WarningText>
                        ⚠️เมื่อเช่าเซิร์ฟเวอร์แล้วระบบจะทำการหักเครดิตในบัญชีแบบรายชั่วโมงโดยอัตโนมัติตามแพ็กเกจที่เลือกไว้
                        ไม่ว่าจะปิดหรือเปิดเซิร์ฟเวอร์ เนื่องจากเป็นการถือสิทธิ์ในการครอบครองเซิร์ฟเวอร์นั้น
                    </WarningText>
                </WarningBanner>

                {step === 'hardware' && <HardwareSelection onSelect={handleHardwareSelect} />}
                {step === 'package' && selectedHardware && (
                    <PackageSelection
                        hardwareId={selectedHardware.id}
                        onSelect={handlePackageSelect}
                        onBack={handleBack}
                    />
                )}
                {step === 'game' && selectedPackage && (
                    <GameSelection
                        selectedPackage={selectedPackage}
                        onSelect={handleGameSelect}
                        onBack={handleBackToPackage}
                    />
                )}
                {step === 'version' && selectedPackage && selectedGame && (
                    <VersionSelection
                        selectedPackage={selectedPackage}
                        selectedGame={selectedGame}
                        onSelect={handleVersionSelect}
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
            </div>
        </Container>
    );
};
