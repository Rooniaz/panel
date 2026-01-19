<?php

namespace Pterodactyl\Jobs;

use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Server;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Services\Minecraft\Maps\CurseForgeMapService;
use Pterodactyl\Services\Minecraft\Maps\MapProvider;

class InstallMinecraftMapJob extends Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Server $server,
        public MapProvider $provider,
        public string $mapId,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(
        CurseForgeMapService $curseForgeMapService,
    ): void {
        match ($this->provider) {
            MapProvider::CurseForge => $curseForgeMapService->install($this->server, $this->mapId),
        };
    }
}
