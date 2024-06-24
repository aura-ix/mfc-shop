// TODO: add userscript header for violentmonkey

import { UserConfig, defineConfig, loadEnv } from 'vite';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd());

    if (!('VITE_PLATFORM' in env)) {
        throw Error('VITE_PLATFORM must be set');
    }

    const platforms = ['chrome', 'firefox', 'userscript']
    if (!platforms.includes(env.VITE_PLATFORM)) {
        throw Error(`VITE_PLATFORM must be one of ${platforms.join(', ')}`);
    }

    const isUserscript = env.VITE_PLATFORM === 'userscript';

    const config: UserConfig = {
        build: {
            outDir: `platform_dist/${env.VITE_PLATFORM}`,
            copyPublicDir: !isUserscript,
            minify: false,
            assetsInlineLimit: isUserscript
                ? (filePath: string, content: Buffer) => true
                : undefined,
            rollupOptions: {
                input: [
                    'src/main.ts',
                ],
                output: {
                    entryFileNames: '[name].js',
                }
            }
        }
    }

    return config;
});