<?php

namespace Pterodactyl\Services\Minecraft\Mods;

enum MinecraftModProvider: string
{
    case CurseForge = 'curseforge';
    case Modrinth = 'modrinth';
}
