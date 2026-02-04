import React, { lazy } from 'react';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import BedrockAddonsContainer from '@/components/server/addons/BedrockAddonsContainer';
import ConfigEditorContainer from '@/components/server/bedrock/config/ConfigEditorContainer';
import MCBEVersionChangerContainer from '@/components/server/mcbeversionchanger/Container';
import ModContainer from '@/components/server/mods/ModContainer';
import PluginContainer from '@/components/server/plugins/PluginContainer';
import MCPManagerContainer from '@/components/server/mcpmanager/Container';
import MinecraftVersionContainer from '@/components/server/minecraftversionchanger/MinecraftVersionContainer';
import ServerPropertiesContainer from '@/components/server/properties/ServerPropertiesContainer';
import ModpacksContainer from '@/components/server/minecraft-modpacks/ModpacksContainer';
import MinecraftWorldContainer from '@/components/server/minecraft-worlds/MinecraftWorldContainer';

// Each of the router files is already code split out appropriately — so
// all of the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));

interface RouteDefinition {
    path: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: React.ComponentType;
    exact?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
}

interface Routes {
    // All of the routes available under "/account"
    account: RouteDefinition[];
    // All of the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

export default {
    account: [
        {
            path: '/',
            name: 'Account',
            component: AccountOverviewContainer,
            exact: true,
        },
        {
            path: '/api',
            name: 'API Credentials',
            component: AccountApiContainer,
        },
        {
            path: '/ssh',
            name: 'SSH Keys',
            component: AccountSSHContainer,
        },
        {
            path: '/activity',
            name: 'Activity',
            component: ActivityLogContainer,
        },
    ],
    server: [
        {
            path: '/',
            permission: null,
            name: 'Console',
            component: ServerConsole,
            exact: true,
        },
        {
            path: '/files',
            permission: 'file.*',
            name: 'Files',
            component: FileManagerContainer,
        },
        {
            path: '/files/:action(edit|new)',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
        },
        {
            path: '/schedules/:id',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
        },
        {
            path: '/users',
            permission: 'user.*',
            name: 'Users',
            component: UsersContainer,
        },
        {
            path: '/backups',
            permission: 'backup.*',
            name: 'Backups',
            component: BackupContainer,
        },
        {
            path: '/settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Settings',
            component: SettingsContainer,
        },
        {
            path: '/activity',
            permission: 'activity.*',
            name: 'Activity',
            component: ServerActivityLogContainer,
        },
        {
            path: '/bedrock/addons',
            permission: 'file.*',
            name: 'Bedrock Addons',
            component: BedrockAddonsContainer,
        },
        {
            path: '/bedrock/config',
            permission: 'file.*',
            name: 'Bedrock Config',
            component: ConfigEditorContainer,
        },
        {
            path: '/bedrock/version',
            permission: 'file.*',
            name: 'Bedrock Version',
            component: MCBEVersionChangerContainer,
        },
        {
            path: '/mods',
            permission: 'file.*',
            name: 'Mods',
            component: ModContainer,
        },
        {
            path: '/plugins',
            permission: 'file.*',
            name: 'Plugins',
            component: PluginContainer,
        },
        {
            path: '/minecraft/player-manager',
            permission: 'file.read',
            name: 'Player Manager',
            component: MCPManagerContainer,
        },
        {
            path: '/modpacks',
            permission: 'file.*',
            name: 'Modpacks',
            component: ModpacksContainer,
        },
        {
            path: '/minecraft-worlds',
            permission: 'file.*',
            name: 'Worlds',
            component: MinecraftWorldContainer,
        },
        {
            path: '/minecraft/version',
            permission: 'file.*',
            name: 'Version',
            component: MinecraftVersionContainer,
        },
        {
            path: '/properties',
            permission: 'file.*',
            name: 'Server Properties',
            component: ServerPropertiesContainer,
        },
    ],
} as Routes;
