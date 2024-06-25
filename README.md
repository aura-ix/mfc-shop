# Building

If nix is available:

```
nix develop
pnpm install
./build
```

If nix is not available, the following dependencies must be installed manually:

- ImageMagick 7
- node v20
- pnpm v8
- zip v3

Once these dependencies have been installed, execute the following:
```
pnpm install
./build
```

After a build has succeeded, the following output files are created:

- `platform_dist/chrome-mfc-shopper.zip` (chrome extension)
- `platform_dist/firefox-mfc-shopper.zip` (firefox extension)
- `platform_dist/userscript/main.js` (userscript, WIP)