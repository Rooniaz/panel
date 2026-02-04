<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client
|
*/
Route::get('/', [Client\ClientController::class, 'index'])->name('api:client.index');
Route::get('/permissions', [Client\ClientController::class, 'permissions']);

// Rent server versions endpoint (queries from PostgreSQL directly)
Route::get('/versions/{gameKey}', [Client\VersionsController::class, 'getVersions']);

Route::prefix('/account')->middleware(AccountSubject::class)->group(function () {
    Route::prefix('/')->withoutMiddleware(RequireTwoFactorAuthentication::class)->group(function () {
        Route::get('/', [Client\AccountController::class, 'index'])->name('api:client.account');
        Route::get('/two-factor', [Client\TwoFactorController::class, 'index']);
        Route::post('/two-factor', [Client\TwoFactorController::class, 'store']);
        Route::post('/two-factor/disable', [Client\TwoFactorController::class, 'delete']);
    });

    Route::put('/email', [Client\AccountController::class, 'updateEmail'])->name('api:client.account.update-email');
    Route::put('/password', [Client\AccountController::class, 'updatePassword'])->name('api:client.account.update-password');
    Route::get('/menu-order', [Client\AccountController::class, 'getMenuOrder'])->name('api:client.account.menu-order');
    Route::put('/menu-order', [Client\AccountController::class, 'updateMenuOrder'])->name('api:client.account.update-menu-order');

    Route::get('/activity', Client\ActivityLogController::class)->name('api:client.account.activity');

    Route::get('/api-keys', [Client\ApiKeyController::class, 'index']);
    Route::post('/api-keys', [Client\ApiKeyController::class, 'store']);
    Route::delete('/api-keys/{identifier}', [Client\ApiKeyController::class, 'delete']);

    Route::prefix('/ssh-keys')->group(function () {
        Route::get('/', [Client\SSHKeyController::class, 'index']);
        Route::post('/', [Client\SSHKeyController::class, 'store']);
        Route::post('/remove', [Client\SSHKeyController::class, 'delete']);
    });
});

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/{server}
|
*/
Route::group([
    'prefix' => '/servers/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
    ],
], function () {
    Route::get('/', [Client\Servers\ServerController::class, 'index'])->name('api:client:server.view');
    Route::get('/websocket', Client\Servers\WebsocketController::class)->name('api:client:server.ws');
    Route::get('/resources', Client\Servers\ResourceUtilizationController::class)->name('api:client:server.resources');
    Route::get('/activity', Client\Servers\ActivityLogController::class)->name('api:client:server.activity');

    Route::post('/command', [Client\Servers\CommandController::class, 'index']);
    Route::post('/power', [Client\Servers\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Client\Servers\DatabaseController::class, 'index']);
        Route::post('/', [Client\Servers\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Client\Servers\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Client\Servers\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Client\Servers\FileController::class, 'directory']);
        Route::get('/contents', [Client\Servers\FileController::class, 'contents']);
        Route::get('/download', [Client\Servers\FileController::class, 'download']);
        Route::put('/rename', [Client\Servers\FileController::class, 'rename']);
        Route::post('/copy', [Client\Servers\FileController::class, 'copy']);
        Route::post('/write', [Client\Servers\FileController::class, 'write']);
        Route::post('/compress', [Client\Servers\FileController::class, 'compress']);
        Route::post('/decompress', [Client\Servers\FileController::class, 'decompress']);
        Route::post('/delete', [Client\Servers\FileController::class, 'delete']);
        Route::post('/create-folder', [Client\Servers\FileController::class, 'create']);
        Route::post('/chmod', [Client\Servers\FileController::class, 'chmod']);
        Route::post('/pull', [Client\Servers\FileController::class, 'pull'])->middleware(['throttle:10,5']);
        Route::get('/upload', Client\Servers\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Client\Servers\ScheduleController::class, 'index']);
        Route::post('/', [Client\Servers\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Client\Servers\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Client\Servers\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Client\Servers\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Client\Servers\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Client\Servers\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Client\Servers\NetworkAllocationController::class, 'index']);
        Route::post('/allocations', [Client\Servers\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Client\Servers\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Client\Servers\SubuserController::class, 'index']);
        Route::post('/', [Client\Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Client\Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Client\Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Client\Servers\SubuserController::class, 'delete']);
    });

    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Client\Servers\BackupController::class, 'index']);
        Route::post('/', [Client\Servers\BackupController::class, 'store']);
        Route::get('/{backup}', [Client\Servers\BackupController::class, 'view']);
        Route::get('/{backup}/download', [Client\Servers\BackupController::class, 'download']);
        Route::post('/{backup}/lock', [Client\Servers\BackupController::class, 'toggleLock']);
        Route::post('/{backup}/restore', [Client\Servers\BackupController::class, 'restore']);
        Route::delete('/{backup}', [Client\Servers\BackupController::class, 'delete']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Client\Servers\StartupController::class, 'index']);
        Route::put('/variable', [Client\Servers\StartupController::class, 'update']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Client\Servers\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Client\Servers\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Client\Servers\SettingsController::class, 'dockerImage']);
    });

    Route::delete('/', [Client\Servers\SettingsController::class, 'delete']);

    Route::group(['prefix' => '/bedrock/addons'], function () {
        Route::get('/', [Client\Servers\BedrockAddonController::class, 'index']);
        Route::get('/filters', [Client\Servers\BedrockAddonController::class, 'filters']);
        Route::get('/versions', [Client\Servers\BedrockAddonController::class, 'versions']);
        Route::post('/install', [Client\Servers\BedrockAddonController::class, 'install']);
        Route::get('/installed', [Client\Servers\BedrockAddonController::class, 'installed']);
        Route::delete('/{addonType}/{addonName}', [Client\Servers\BedrockAddonController::class, 'delete']);
        Route::post('/priority', [Client\Servers\BedrockAddonController::class, 'priority']);
        Route::get('/icon', [Client\Servers\BedrockAddonController::class, 'getIcon']);
        Route::post('/worlds/default', [Client\Servers\BedrockAddonController::class, 'setDefaultWorld']);
        Route::delete('/worlds/delete', [Client\Servers\BedrockAddonController::class, 'deleteWorld']);
    });

    Route::group(['prefix' => '/bedrock/config'], function () {
        Route::get('/properties', [Client\Servers\Bedrock\Config\ConfigController::class, 'getProperties']);
        Route::post('/properties', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveProperties']);
        Route::get('/worlds', [Client\Servers\Bedrock\Config\ConfigController::class, 'getWorlds']);
        Route::get('/experiments', [Client\Servers\Bedrock\Config\ConfigController::class, 'getExperiments']);
        Route::post('/experiments', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveExperiments']);
        Route::get('/world-settings', [Client\Servers\Bedrock\Config\ConfigController::class, 'getWorldSettings']);
        Route::post('/world-settings', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveWorldSettings']);
    });

    // Alias routes for backward compatibility (frontend calls /config/properties)
    Route::group(['prefix' => '/config'], function () {
        Route::get('/properties', [Client\Servers\Bedrock\Config\ConfigController::class, 'getProperties']);
        Route::post('/properties', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveProperties']);
        Route::get('/worlds', [Client\Servers\Bedrock\Config\ConfigController::class, 'getWorlds']);
        Route::get('/experiments', [Client\Servers\Bedrock\Config\ConfigController::class, 'getExperiments']);
        Route::post('/experiments', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveExperiments']);
        Route::get('/world-settings', [Client\Servers\Bedrock\Config\ConfigController::class, 'getWorldSettings']);
        Route::post('/world-settings', [Client\Servers\Bedrock\Config\ConfigController::class, 'saveWorldSettings']);
    });

    Route::group(['prefix' => '/bedrock/version'], function () {
        Route::get('/versions', [Client\Servers\MCBEController::class, 'versions']);
        Route::get('/version/{version}', [Client\Servers\MCBEController::class, 'version']);
        Route::post('/install', [Client\Servers\MCBEController::class, 'install']);
        Route::get('/check/{identifier}', [Client\Servers\MCBEController::class, 'checkInstallation']);
        Route::post('/cancel/{identifier}', [Client\Servers\MCBEController::class, 'cancelInstallation']);
    });

    // Alias routes for backward compatibility (frontend calls /mcbe/versions)
    Route::group(['prefix' => '/mcbe'], function () {
        Route::get('/versions', [Client\Servers\MCBEController::class, 'versions']);
        Route::get('/version/{version}', [Client\Servers\MCBEController::class, 'version']);
        Route::post('/install', [Client\Servers\MCBEController::class, 'install']);
        Route::get('/install/{identifier}', [Client\Servers\MCBEController::class, 'checkInstallation']);
        Route::delete('/install/{identifier}', [Client\Servers\MCBEController::class, 'cancelInstallation']);
    });

    Route::group(['prefix' => '/icon'], function () {
        Route::get('/upload-url', Client\Servers\IconController::class);
        Route::post('/process', [Client\Servers\IconProcessingController::class, 'process']);
    });

    Route::group(['prefix' => '/mods'], function () {
        Route::get('/', [Client\Servers\MinecraftModInstallerController::class, 'index']);
        Route::get('/{modId}/versions', [Client\Servers\MinecraftModInstallerController::class, 'versions']);
        Route::post('/install', [Client\Servers\MinecraftModInstallerController::class, 'install']);
        Route::get('/installed/versions', [Client\Servers\MinecraftModInstallerController::class, 'getInstalledModsVersions']);
        Route::get('/mcversions', [Client\Servers\MinecraftModInstallerController::class, 'getMinecraftVersions']);
        Route::get('/minecraft-versions', [Client\Servers\MinecraftModInstallerController::class, 'getMinecraftVersions']);
        Route::get('/loaders', [Client\Servers\MinecraftModInstallerController::class, 'getModLoaders']);
    });

    Route::group(['prefix' => '/plugins'], function () {
        Route::get('/', [Client\Servers\MinecraftPluginInstallerController::class, 'index']);
        Route::get('/{pluginId}/versions', [Client\Servers\MinecraftPluginInstallerController::class, 'versions']);
        Route::post('/install', [Client\Servers\MinecraftPluginInstallerController::class, 'install']);
        Route::get('/installed/versions', [Client\Servers\MinecraftPluginInstallerController::class, 'getInstalledPluginsVersions']);
        Route::get('/mcversions', [Client\Servers\MinecraftPluginInstallerController::class, 'getMinecraftVersions']);
        Route::get('/minecraft-versions', [Client\Servers\MinecraftPluginInstallerController::class, 'getMinecraftVersions']);
        Route::get('/loaders', [Client\Servers\MinecraftPluginInstallerController::class, 'getPluginLoaders']);
    });

           Route::group(['prefix' => '/minecraft-modpacks'], function () {
        Route::get('/', [Client\Servers\ModpackController::class, 'index']);
        Route::get('/versions', [Client\Servers\ModpackController::class, 'versions']);
        Route::post('/install', [Client\Servers\ModpackController::class, 'install']);
    });

    Route::group(['prefix' => '/minecraft-worlds'], function () {
        Route::get('/', [Client\Servers\MinecraftWorldController::class, 'index']);
        Route::post('/make-default', [Client\Servers\MinecraftWorldController::class, 'makeDefault']);
        Route::get('/maps', [Client\Servers\MinecraftWorldController::class, 'maps']);
        Route::post('/maps/install', [Client\Servers\MinecraftWorldController::class, 'installMap']);
    });

    Route::group(['prefix' => '/players'], function () {
        Route::get('/fast-query', [Client\Servers\MCPManager\MCPQueryController::class, 'index']);
        Route::post('/reload', [Client\Servers\MCPManager\MCPQueryController::class, 'reload']);
        Route::post('/check-autosave', [Client\Servers\MCPManager\MCPQueryController::class, 'checkAutosave']);
        Route::get('/server-type', [Client\Servers\MCPManager\MCPQueryController::class, 'getServerType']);
        Route::get('/advancements-wiki', [Client\Servers\MCPManager\MCPQueryController::class, 'getAdvancementsFromWiki']);
        Route::get('/worlds', [Client\Servers\MCPManager\MCPQueryController::class, 'getDetectedWorlds']);
        Route::post('/action', [Client\Servers\MCPManager\MCPQueryController::class, 'performAction']);
        Route::post('/kick', [Client\Servers\MCPManager\MCPQueryController::class, 'kickPlayer']);
        Route::prefix('/{uuid}')->group(function () {
            Route::get('/items', [Client\Servers\MCPManager\MCPQueryController::class, 'getPlayerItems']);
            Route::post('/stats', [Client\Servers\MCPManager\MCPQueryController::class, 'updatePlayerStats']);
            Route::post('/whitelist', [Client\Servers\MCPManager\MCPQueryController::class, 'whitelistPlayer']);
            Route::delete('/whitelist', [Client\Servers\MCPManager\MCPQueryController::class, 'unwhitelistPlayer']);
            Route::post('/ban', [Client\Servers\MCPManager\MCPQueryController::class, 'banPlayer']);
            Route::delete('/ban', [Client\Servers\MCPManager\MCPQueryController::class, 'unbanPlayer']);
            Route::post('/op', [Client\Servers\MCPManager\MCPQueryController::class, 'opPlayer']);
            Route::delete('/op', [Client\Servers\MCPManager\MCPQueryController::class, 'deopPlayer']);
            Route::post('/clear-inventory', [Client\Servers\MCPManager\MCPQueryController::class, 'clearInventory']);
            Route::delete('/wipe-data', [Client\Servers\MCPManager\MCPQueryController::class, 'wipePlayerData']);
            Route::post('/gamemode', [Client\Servers\MCPManager\MCPQueryController::class, 'changeGamemode']);
            Route::post('/ban-ip', [Client\Servers\MCPManager\MCPQueryController::class, 'banIp']);
            Route::delete('/ban-ip', [Client\Servers\MCPManager\MCPQueryController::class, 'unbanIp']);
            Route::post('/give-item', [Client\Servers\MCPManager\MCPQueryController::class, 'giveItem']);
            Route::post('/add-effect', [Client\Servers\MCPManager\MCPQueryController::class, 'addEffect']);
            Route::post('/clear-effect', [Client\Servers\MCPManager\MCPQueryController::class, 'clearEffect']);
            Route::post('/modify-stat', [Client\Servers\MCPManager\MCPQueryController::class, 'modifyPlayerStat']);
            Route::get('/advancements', [Client\Servers\MCPManager\MCPQueryController::class, 'getPlayerAdvancements']);
        });
    });

    Route::get('/minecraft-version/current', [Client\Servers\MinecraftVersionController::class, 'getCurrentVersion']);
    Route::get('/minecraft-version/{type}/{version}', [Client\Servers\MinecraftVersionController::class, 'getBuilds']);
    Route::get('/minecraft-version/{type}', [Client\Servers\MinecraftVersionController::class, 'getVersions']);
    Route::get('/minecraft-version', [Client\Servers\MinecraftVersionController::class, 'getMinecraftForks']);
    Route::post('/minecraft-version', [Client\Servers\MinecraftVersionController::class, 'updateMinecraftVersion']);

    Route::group(['prefix' => '/minecraft/version'], function () {
        Route::get('/forks', [Client\Servers\MinecraftVersionController::class, 'getMinecraftForks']);
        Route::get('/versions/{type}', [Client\Servers\MinecraftVersionController::class, 'getVersions']);
        Route::get('/builds/{type}/{version}', [Client\Servers\MinecraftVersionController::class, 'getBuilds']);
        Route::post('/update', [Client\Servers\MinecraftVersionController::class, 'updateMinecraftVersion']);
        Route::get('/current', [Client\Servers\MinecraftVersionController::class, 'getCurrentVersion']);
    });

    Route::group(['prefix' => '/properties'], function () {
        Route::get('/', [Client\Servers\FileController::class, 'contents']);
        Route::post('/', [Client\Servers\FileController::class, 'write']);
    });
});
