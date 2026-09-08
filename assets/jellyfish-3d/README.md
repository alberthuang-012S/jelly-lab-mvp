# Jellyfish 3D assets

放置透明背景的預渲染 3D 公仔風格水母素材。角色渲染會優先讀取此資料夾；素材載入失敗時，會自動回退到 `../jellyfish/` 的既有 PNG。

## 命名規則

普通水母依 base color 使用 WebP：

- `jelly-normal-yellow.webp`
- `jelly-normal-purple.webp`
- `jelly-normal-green.webp`
- `jelly-normal-blue.webp`
- `jelly-normal-pink.webp`
- `jelly-normal-cyan.webp`
- `jelly-normal-red.webp`

其他 skin 使用單一固定素材：

- `jelly-sparkle.webp`
- `jelly-playful.webp`
- `jelly-detective.webp`
- `jelly-shy.webp`
- `jelly-cute.webp`
- `jelly-angry.webp`
- `jelly-fire.webp`

建議所有角色素材使用相同畫布比例、透明背景與一致的角色落點，方便在首頁、商店、養成、圖鑑與戰鬥畫面共用 `object-fit: contain`。
