#show raw: set block(fill: luma(230), inset: 8pt, radius: 4pt)
#show link: underline
#set text(font: "Inter")

= Welcome

Welcome! This is the installation guide for Minecraft World Manager for Pterodactyl.
It'll get you up and running in no time!

= Create a CFCore API Key

To access the CurseForge API, you first need to #link("https://console.curseforge.com/?#/signup", "create a CFCore account"). Then, copy your API key and add another line in your `.env` file like this:

```env
CURSEFORGE_API_KEY=$2a$10$iZYWa6jrmyz7hN69sfmInes1FAqrn2ycR.ZdrKKrtOpz/Tn9ETMcK
```

(This API key will not work!)

= Install Node.js, npm and Yarn

On your system, you'll need to install Node.js, npm and Yarn if you don't have it already.
Please follow this link to install Node.js (npm is packed with it): https://nodejs.org/en/download/

Then, install Yarn globally with npm:

```shell
npm install --global yarn
```

= Install Yarn dependencies and build the panel assets

Next, we'll download Yarn dependencies then build the panel assets to check that the configuration is ok:

Navigate to where Pterodactyl is installed e.g.

```shell
cd /var/www/pterodactyl
```

Then, execute the `yarn` command, it will install the dependencies.

Run the panel build:

```shell
yarn run build
```

If that worked, we've confirmed that you can build your panel's assets for development!
If that failed and thousands of errors just spawned into existence on your terminal, check the Troubleshooting section down below.

= Upload the `upload` folder

To proceed, please upload the contents of the `upload` folder to the directory where Pterodactyl is installed with your favorite (S)FTP client.

= Make the necessary modifications to existing panel files

Now we just need to do some modifications on Panel files. Fortunately, there are not much! Under each file name (relative to the directory your Panel is installed in), there will be a diff. You have to find the lines which are not prefixed by `+` (in white) and add those that are prefixed by a `+` (in green).

`+` means "add this line". You need to remove them after copying and pasting the code.
`[...]` means skip lines/seek further in the file

== `config/services.php`

```diff
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
+
+    'curseforge_api_key' => env('CURSEFORGE_API_KEY'),
];
```
== `app/Transformers/Api/Client/ServerTransformer.php`

```diff
            'internal_id' => $server->id,
+           'egg_id' => $server->egg_id,
            'uuid' => $server->uuid,
```

== `resources/scripts/api/server/getServer.ts`
```diff
export interface Server {
    id: string;
    internalId: number | string;
+   eggId: number;
    uuid: string;

[...]

    internalId: data.internal_id,
+   eggId: data.egg_id,
    uuid: data.uuid,
```

== `resources/scripts/routers/routes.ts`

```diff
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
+import MinecraftWorldContainer from '@/components/server/minecraft-worlds/MinecraftWorldContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';

[...]

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
+   eggIds?: number[];
}

[...]

        {
            path: '/files',
            permission: 'file.*',
            name: 'Files',
            component: FileManagerContainer,
        },
+        {
+            path: '/minecraft-worlds',
+            permission: 'file.*',
+            name: 'Worlds',
+            component: MinecraftWorldContainer,
+            eggIds: [1, 2, 3, 5],
+        },
```

Warning! The file above contains the egg IDs which will get the new "Worlds" tab. It is pre-filled with the default Pterodactyl eggs "Forge Minecraft", "Sponge (SpongeVanilla)", "Vanilla Minecraft" and "Paper". Please adjust as needed.

== `resources/scripts/routers/ServerRouter.tsx`

```diff
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
+   const serverEggId = ServerContext.useStoreState((state) => state.server.data?.eggId);

[...]

                                {routes.server
                                    .filter((route) => !!route.name)
+                                    .filter((route) =>
+                                        route.eggIds ? serverEggId && route.eggIds.includes(serverEggId) : true
+                                    )
```

== `routes/api-client.php`

```diff
    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Client\Servers\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Client\Servers\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Client\Servers\SettingsController::class, 'dockerImage']);
    });

+    Route::group(['prefix' => '/minecraft-worlds'], function () {
+        Route::get('/', [Client\Servers\MinecraftWorldController::class, 'index']);
+        Route::post('/make-default', [Client\Servers\MinecraftWorldController::class, 'makeDefault']);
+        Route::get('/maps', [Client\Servers\MinecraftWorldController::class, 'maps']);
+        Route::post('/maps/install', [Client\Servers\MinecraftWorldController::class, 'installMap']);
+    });
});
```

= Build the panel assets

Finally, you can build the production assets with this command (in the directory where Pterodactyl is installed):

```shell
yarn run build:production
```

= Troubleshooting

If you have any questions about this product or need help with its installation,
You can contact us using the following services:
- Discord: https://discord.gg/RJ2A8yYS2m
- Email: #link("mailto:contact@ric-rac.org")[contact\@ric-rac.org]
- X: #link("https://twitter.com/ricxracx")[\@ricxracx]
- SMS: #link("tel:+33611194971")[+33 6 11 19 49 71]
