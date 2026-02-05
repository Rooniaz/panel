import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React from 'react';
import { ServerContext } from '@/state/server';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTerminal,
    faFolderOpen,
    faUserFriends,
    faCloudDownloadAlt,
    faNetworkWired,
    faBolt,
    faCog,
    faClipboardList,
    faCubes,
    faPlug,
    faUsers,
    faCube,
    faList,
    faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import routes from '@/routers/routes';

interface Props extends PageContentBlockProps {
    title: string;
}

const navIcons: Record<string, any> = {
    Console: faTerminal,
    Files: faFolderOpen,
    Users: faUserFriends,
    Backups: faCloudDownloadAlt,
    Network: faNetworkWired,
    Startup: faBolt,
    Settings: faCog,
    Activity: faClipboardList,
    Mods: faCubes,
    Plugins: faPlug,
    'Minecraft Player Manager': faUsers,
    'Player Manager': faUsers,
    'Minecraft Version': faCube,
    Version: faCube,
    'Server Properties': faList,
    Modpacks: faCubes,
    Worlds: faGlobe,
    Configs: faList,
    Versions: faCube,
    'Bedrock Addons': faCubes,
    'Bedrock Config': faCog,
    'Bedrock Version': faCube,
    'File Manager': faFolderOpen,
    'Minecraft Mods': faCubes,
    'Minecraft Plugins': faPlug,
    'Minecraft Bedrock Version Manager': faCube,
    'Bedrock Config Editor': faCog,
    'Startup Settings': faBolt,
    Schedules: faBolt,
    Databases: faList,
};

const navThaiNames: Record<string, string> = {
    Console: 'คอนโซล',
    Files: 'ไฟล์',
    Users: 'ผู้ใช้',
    Backups: 'แบ็คอัพ',
    Network: 'เครือข่าย',
    Startup: 'เริ่มต้น',
    Settings: 'ตั้งค่า',
    Activity: 'ประวัติ',
    Mods: 'Mods',
    Plugins: 'Plugins',
    'Minecraft Player Manager': 'จัดการผู้เล่น Minecraft',
    'Player Manager': 'จัดการผู้เล่น',
    'Minecraft Version': 'เวอร์ชัน Minecraft',
    Version: 'เวอร์ชัน',
    'Server Properties': 'คุณสมบัติเซิร์ฟเวอร์',
    Modpacks: 'Modpacks',
    Worlds: 'Worlds',
    Configs: 'Configs',
    Versions: 'Versions',
    'Bedrock Addons': 'Addons Bedrock',
    'Bedrock Config': 'Bedrock Config',
    'Bedrock Version': 'เวอร์ชัน Bedrock',
    'File Manager': 'ไฟล์',
    'Minecraft Mods': 'Mods',
    'Minecraft Plugins': 'Plugins',
    'Minecraft Bedrock Version Manager': 'เวอร์ชัน Minecraft Bedrock',
    'Bedrock Config Editor': 'Bedrock Config',
    'Startup Settings': 'เริ่มต้น',
    Schedules: 'ตารางเวลา',
    Databases: 'ฐานข้อมูล',
};

const ServerContentBlock: React.FC<Props> = ({ title, children, ...props }) => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const location = useLocation();

    // Find current route by matching pathname or title
    const routeName = React.useMemo(() => {
        const serverRoutes = routes.server || [];
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1] || '';

        // Try to find route by matching path
        let route = serverRoutes.find((r) => {
            if (!r.name) return false;
            
            const routePath = r.path.replace(/^\/+/, '').replace(/\/$/, '');
            const routeSegments = routePath.split('/').filter(Boolean);
            
            // Match exact path for root
            if (routePath === '' && lastSegment === '') {
                return true;
            }
            
            // Match by last segment
            if (routeSegments.length > 0 && routeSegments[routeSegments.length - 1] === lastSegment) {
                return true;
            }
            
            // Match by checking if pathname includes route path
            if (routePath !== '' && location.pathname.includes(routePath)) {
                return true;
            }
            
            return false;
        });

        // If not found, try to match by title
        if (!route) {
            route = serverRoutes.find((r) => r.name === title);
        }

        return route?.name || title;
    }, [location.pathname, title]);

    const icon = navIcons[routeName];
    const thaiName = navThaiNames[routeName] || routeName;

    return (
        <PageContentBlock title={`${name} | ${title}`} {...props}>
            {routeName && (
                <div css={tw`mb-6 flex items-center gap-3`}>
                    {icon && (
                        <div css={tw`flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600`}>
                            <FontAwesomeIcon icon={icon} css={tw`text-white text-lg`} />
                        </div>
                    )}
                    <h1 css={tw`text-2xl font-bold text-neutral-100`}>{thaiName}</h1>
                </div>
            )}
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
