<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

enum MinecraftPluginProvider: string
{
    case CurseForge = 'curseforge';
    case Hangar = 'hangar';
    case Modrinth = 'modrinth';
    case SpigotMC = 'spigotmc';
}
