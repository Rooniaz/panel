<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\MCBEService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\CompressFilesRequest;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MCBEController extends ClientApiController
{
    private MCBEService $mcbeService;

    public function __construct(MCBEService $mcbeService)
    {
        parent::__construct();
        $this->mcbeService = $mcbeService;
    }

    public function versions(Server $server)
    {
        return $this->mcbeService->versions();
    }

    public function version(Server $server, string $version)
    {
        return $this->mcbeService->version($version);
    }

    public function install(Server $server)
    {
        $version = $this->request->input('version');
        if (empty($version)) {
            throw new DisplayException('Version is required.');
        }

        $deleteFiles = $this->request->input('deleteFiles', false);

        $result = $this->mcbeService->install($server, $version, $deleteFiles);

        return new JsonResponse([
            'success' => true,
            'data' => [
                'identifier' => $result['identifier'],
                'filename' => $result['filename']
            ]
        ]);
    }

    public function checkInstallation(Server $server, string $identifier)
    {
        $filename = $this->request->input('filename');
        if (empty($filename)) {
            throw new DisplayException('Filename is required.');
        }

        $result = $this->mcbeService->checkInstallation($server, $identifier, $filename);

        return new JsonResponse([
            'success' => true,
            'data' => $result
        ]);
    }

    public function cancelInstallation(Server $server, string $identifier)
    {
        $result = $this->mcbeService->cancelInstallation($server, $identifier);

        return new JsonResponse([
            'success' => true,
            'data' => $result
        ]);
    }
}
