# 水母養成所 Jelly Lab V2.13.0

Jelly Lab V2.13.0 在既有自由配件配置上加入觸控手勢與精細微調。配件可單指移動、雙指連續縮放與旋轉，也能用 5°／0.05 倍按鈕精細調整；既有配件位置與所有玩家資料都會透過 Save Migration 保留。專案仍使用 HTML5、CSS3、Vanilla JavaScript 與 `localStorage`，不需要後端、帳號或 npm 依賴即可遊玩。

## 啟動方式

建議使用靜態檔案伺服器，避免瀏覽器限制 ES Module：

```powershell
python -m http.server 4174
```

接著開啟 <http://127.0.0.1:4174/>。

Debug 模式：

<http://127.0.0.1:4174/?debug=1>

也可以使用 VS Code Live Server 或其他靜態伺服器。

## GitHub Pages 部署

專案已附上 `.github/workflows/pages.yml`。將 `main` 推送到 GitHub 後，GitHub Actions 會自動將根目錄靜態檔案部署到 GitHub Pages；首次部署可在 repository 的 **Settings → Pages** 確認 Source 使用 **GitHub Actions**。部署完成後，公開測試網址通常為：

```text
https://<GitHub帳號>.github.io/<repository名稱>/
```

Debug 測試網址：

```text
https://<GitHub帳號>.github.io/<repository名稱>/?debug=1
```

## 檔案結構

```text
水母養成所/
├─ index.html                 # 既有外框、五個主要畫面與導覽
├─ README.md
├─ 水母圖.jpg                 # 提供的原始 4×2 水母素材圖
├─ assets/
│  ├─ jellyfish/              # 8 張透明水母 PNG
│  └─ items/
│     └─ ppa-plus-one.png     # 使用者提供的 PPA+1 乳霜按壓瓶素材
├─ tools/slice_jellyfish.py   # 重建水母透明素材的切圖工具
├─ css/
│  ├─ main.css                # 既有基礎樣式與元件
│  ├─ animations.css          # 既有養成動畫
│  ├─ responsive.css          # 既有 Responsive 斷點
│  ├─ battle.css              # V2 戰鬥、獎勵與 Boss 動畫樣式
│  └─ v2-1.css                # V2.1/V2.2/V2.13 商品 Visual、數量控制、選色與置中樣式
└─ js/
   ├─ app.js                  # 應用入口、事件路由、畫面切換與 Battle orchestration
   ├─ config.js               # 商品、等級、進化、Boss、攻擊、戰鬥商品與獎勵設定
   ├─ state.js                # Save 結構、版本正規化、數值防呆與物品數量
   ├─ storage.js              # localStorage 讀寫、V1/V2/V3→V4 migration 與清除
   ├─ battle.js               # 純記憶體回合制 Battle Engine 與批量行動
   ├─ components.js           # 共用戰鬥商品 Visual Component
   ├─ shop.js                 # 養成商店、戰鬥商店、批量購買與點數檢查
   ├─ inventory.js            # 食物、造型、配件、場景、戰鬥用品與獎勵資料
   ├─ jellyfish.js            # Skin、場景、配件與角色素材組裝
   ├─ collection.js           # 8 款水母圖鑑進度
   ├─ ui.js                   # Render、戰鬥畫面、Toast、Modal 與 Debug 面板
   └─ analytics.js            # trackEvent 預留介面
```

## V1 功能保留

- 初次命名、初始普通水母、LV、EXP、親密度與養成點數。
- 摸摸、聊天、每日互動限制與 Daily Reset。
- 食物商店、購買、背包、餵食、EXP 溢位與 LV10 MAX。
- 8 款水母 Skin、配件、場景與 5 階段進化。
- 水母圖鑑、localStorage、Responsive 與原本的 Debug 操作。

## V2／V2.1／V2.2 已完成功能

- 新玩家與 Reset Save 後的初始點數為 **50,000 點**；既有 Save 的 points 不會因更新或 Refresh 被補值。
- V2 Save `version` 為 `2`；V2.1 會升級至 `version: 3`，既有存檔不會被強制刪除。
- 新增「⚔️ 挑戰」導覽與 BOSS 挑戰準備畫面。
- 新增「⚔️ 戰鬥商店」Tab，保留原本食物、Skin、配件、場景。
- 戰鬥商品顯示名稱：KTT+3、PNN+3、QCC+4、REE+5、PPT+1、PPA+1，皆集中在 `config.js`。
- 戰鬥背包數量會立即保存，Refresh 後仍存在。
- 第一隻 Boss「老化怪獸」：HP 320、衰老衝擊、乾癢粉塵、混濁視線。
- 免費基本攻擊「水母撞擊」10 Damage，不需要任何膠囊即可挑戰。
- 回合制流程、玩家回合鎖定、Boss 回合、勝利與戰敗 Modal。
- 癢：每次玩家完成攻擊行動後受到 5 Damage，PPA+1 可解除。
- 視野模糊：水母攻擊有 50% MISS 機率，PPT+1 可回血並解除。
- PPT+1 回復最多 35 HP 且不超過 Max HP；滿血且沒有模糊時按鈕 Disable。
- PPA+1 只有在癢狀態時可用，且不會回血。
- Battle Log 最近保留 8 筆，含攻擊、受傷、狀態、治療與勝負紀錄。
- CSS 傷害、回血、Boss Shake、水母受傷、狀態與視野 Fog 效果。
- 首次擊敗獲得一次虛擬 NT$600 折價券，存於「我的獎勵」。不生成真正 Coupon Code。
- 再次擊敗可累積通關次數，但不會重複加入折價券。
- V2 Battle Debug：`+1 KTT+3`、`+1 PNN+3`、`+1 QCC+4`、`+1 REE+5`、`+1 PPT+1`、`+1 PPA+1`、`Boss HP -50`、`Player HP -20`、`Apply Itchy`、`Apply Blurred`、`Clear Status`、`Reset Boss Reward`。
- 新增事件追蹤：`battle_shop_open`、`battle_item_purchase`、`boss_challenge_open`、`boss_battle_start`、`boss_attack`、`player_attack`、`battle_item_used`、狀態與勝負事件等，暫時只寫入 console 與記憶體事件陣列。

### V2.1 增量內容

- KTT、PNN、QCC、RNN 統一使用 CSS Capsule Visual：雙半膠囊、中央接合線、高光與立體陰影。
- PPT+1 使用咖啡色罐裝飲料 Visual；PPA+1 使用白色按壓瓶 Visual。
- `renderBattleItemVisual(item)` 位於 `components.js`，商店、背包、Battle 共用同一套商品視覺。
- 戰鬥商店與食物商店的可重複消耗品支援數量選擇、直接輸入、`MAX`、即時總價與單次最多 99 個。
- 點數不足時購買按鈕會 Disable，並顯示差額；批量購買只扣一次總價、只增加一次庫存。
- Battle 中武器與 PPT+1 使用 Action Panel 選擇數量；批量攻擊只算一個玩家 Action，Boss 只行動一次。
- 視野模糊時同一批武器只判定一次命中／Miss；Miss 仍完整消耗所有選定膠囊。
- PPT+1 的可用數量會依缺少 HP 計算，滿血但 blurred 時最多 1 罐；PPA+1 戰鬥中固定一次 1 個。
- 新玩家建立流程增加 7 種免費初始顏色選擇，選色即時預覽，`baseColor` 與 `equippedSkin` 分開保存。
- 舊玩家沒有 `baseColor` 時自動使用奶油黃；Reset Save 後會重新進入命名與選色流程。

### V2.2 小幅更新

- `GAME_CONFIG.startingPoints` 調整為 50,000；只有新建立遊戲與 Reset Save 使用新數值，Migration 會保留既有 points。
- 戰鬥商店六款商品改用共用的 `battle-item-content`、固定 `battle-item-visual-wrapper` 與 Flex 置中結構，Visual、背景圓與 Damage／效果文字共用中心軸。
- 膠囊統一為 78×40px；只保留膠囊本體旋轉，不使用個別商品的水平位移補丁。
- 桌面使用等寬 Grid，手機 320／375／390／430px 皆限制為單欄且不產生橫向捲動。

### V2.3 造型視覺調整

- 水母圖鑑桌面版改為三欄大卡片，讓角色圖與名稱更容易辨識。
- 圖鑑卡片改為乾淨的統一漸層背景，移除角色背後的小圓圈與底部光暈；鎖定狀態仍維持原本的模糊與鎖頭提示。
- 造型商店預覽角色比例微調，與圖鑑的角色視覺尺度更一致。
- 清理 `jelly-angry.png` 左側跨素材綠色殘片，並將清理規則保留在 `tools/slice_jellyfish.py`，方便之後重建素材。
- 本版只涉及 UI／素材，不變更 Save 結構；`GAME_CONFIG.version` 維持 3，不需要額外 Migration。

### V2.4 戰鬥用品名稱更新

- KTT → **KTT+3**、PNN → **PNN+3**、QCC → **QCC+4**、RNN → **REE+5**。
- PPT → **PPT+1**、NAP → **PPA+1**。
- 為了相容既有玩家存檔，內部 `id` 與 `storageKey` 不變：RNN、PPT 等舊保存鍵仍照常讀寫，只更新所有商店、背包、準備畫面、Battle、提示與 Debug 的顯示名稱。
- 商店分類順序調整為「⚔️ 戰鬥」第一個，且從養成頁進入商店時預設直接開啟戰鬥用品商店；其他食物、造型、配件、場景分類保留。
- 本版不需清除 localStorage，也不需新增 Migration；`GAME_CONFIG.version` 維持 3。

### Battle Screen UI 修正

- Battle Screen 的 KTT+3、PNN+3、QCC+4、REE+5、PPT+1、PPA+1 都使用同一個 Icon Frame 置中規則。
- 修正原本 38px Icon 欄位被 Visual 原始 layout box 撐開，導致膠囊／罐裝圖示偏移並壓到名稱的問題。
- Visual 會在 Frame 內水平、垂直置中，名稱／Damage 與使用按鈕維持獨立欄位；不修改戰鬥數值、庫存扣除或 Action Lock。

### V2.5 多配件裝備

- Save 版本提升至 `version: 4`，不會因版本更新強制清除既有 localStorage。
- 水母配件改為 `jellyfish.equippedAccessories` 陣列，為 V2.7 自由裝備功能奠定資料結構。
- 舊存檔的 `jellyfish.equippedAccessory` 會自動轉入新陣列，原有配件與其他養成資料盡可能保留。
- 背包可直接切換「裝備／卸下」；V2.7 進一步移除同一槽位的替換限制。
- 家中主角、戰鬥畫面與角色輔助文字會同步顯示目前多件配件；造型商店與圖鑑預覽仍維持獨立預覽，不會誤帶入玩家裝備。
- 配件保留既有 `slot` 資料作為舊資料相容資訊；目前實際位置與裝備數量由 V2.7 自由配置資料管理。

### V2.6 PPA+1 外觀更新

- NAP+1 對外顯示名稱改為 **PPA+1**，商店、背包、準備畫面、Battle、提示與 Debug 皆同步更新。
- 使用簡潔白色按壓瓶 CSS Visual，加入清楚的瓶身、瓶頸、按壓頭與只保留 PPA+1 的標籤，並與商店、背包、Battle 共用。
- 保留內部 `id: ointment_nap` 與 `storageKey: NAP`，舊玩家庫存不會消失，也不需要清除 localStorage 或新增 Save Migration。

### V2.7 PPA+1 乳霜與自由配件配置

- PPA+1 的商品內容改為乳霜；外用分類、商店效果、戰鬥提示與背包說明同步使用「乳霜」文字。
- PPA+1 按壓瓶 Visual 改為較瘦的遊戲道具圖示，泵頭與噴嘴更清楚，瓶身標籤只顯示 `PPA+1`。
- Save 版本提升至 `version: 5`；舊有 points、LV、EXP、親密度、戰鬥用品、Coupon、Skin、配件與場景都會保留。
- 配件取消單一 slot 的互斥限制；所有已購買配件都可以同時裝備，也可以個別卸下。
- 新增 `jellyfish.accessoryPositions`，每件配件保存 X／Y 百分比位置；預設位置集中於 `config.js` 的 `defaultPosition`。
- 養成首頁新增「調整位置」模式：可用滑鼠或觸控拖曳配件，放開後立即寫入 localStorage；也支援方向鍵微調與「回復預設」。
- 背包的配件分類新增自由配置說明與「前往調整」入口；離開編輯模式後角色、戰鬥畫面與 Refresh 都會沿用已保存位置。

### V2.8 PPA+1 使用提供素材

- PPA+1 改用使用者提供的 `assets/items/ppa-plus-one.png` 按壓瓶圖片，不再由 CSS 重畫瓶身。
- 商店、背包與 Battle 透過 `components.js` 的 `renderBattleItemVisual()` 共用同一張素材；商品名稱、乳霜效果與舊存檔 `NAP` 保存鍵維持不變。
- 這次只更新素材與顯示樣式，Save `version: 5` 不變，不需要新增 Save Migration。

### V2.9 PPA+1 遊戲道具 Icon

- 依方案 C 重做 PPA+1：使用簡化、瘦版、透明背景的遊戲道具 Icon，強化按壓頭、噴嘴與瓶身輪廓。
- 圖片只保留 `PPA+1`，移除方形底色、圓形背景與其他文字；小尺寸 Battle Icon 另使用適合 38px 欄位的比例。
- 產生素材經透明 Alpha 檢查後，覆蓋 `assets/items/ppa-plus-one.png`；商品內容、乳霜效果、舊保存鍵與 Save `version: 5` 都不變。

### V2.9.1 PPA+1 尺寸調整

- 放大 PPA+1 在商店、背包與 Battle 的實際顯示比例；Battle Icon 專用比例維持在 38px 欄位內，提升瓶身辨識度。
- 只調整 Visual 與快取版本，不修改 Save 結構、戰鬥規則或物品數量。

### V2.9.2 戰鬥用品視覺份量調整

- 保留已認可的 PPA+1 Icon 造型，僅將呈現比例調整得更飽滿，參考其他戰鬥用品的視覺佔比。
- 水平比例提高、垂直比例維持，商店／背包／Battle 都更容易辨識；外層欄位與 `overflow` 不變，不會造成手機橫向捲動。

### V2.9.3 PPA+1 指定縮放比例

- 依需求將 PPA+1 圖片水平縮放設為 `2.5`、垂直縮放設為 `1.5`。
- 外層 Visual 寬度同步由 42px 調整為 50px，保留按壓頭與瓶身完整顯示；Battle 欄位仍使用 `0.5` 顯示比例。

### V2.10 PPA+1 清晰字樣與自然比例素材

- 依 2.5／1.5 的視覺方向重做 PPA+1 PNG，讓瓶身自然偏寬並放大 `PPA+1` 標籤字樣。
- 改用固定 70×70px 的商品 Icon 框與原生圖片比例，不再依賴非等比 CSS 拉伸；背包與 Battle 仍透過既有縮放比例適配欄位。
- 保留透明背景、按壓瓶輪廓、乳霜效果與內部 `NAP` 保存鍵，未修改遊戲資料或戰鬥規則。

### V2.11 PPA+1 垂直比例更新

- 依需求維持水平 `2.5` 的視覺方向，將垂直比例更新為 `2`，重新製作較高的按壓瓶素材並放大清楚的 `PPA+1` 字樣。
- 新 PNG 已清除背景留白並驗證透明 Alpha；三處共用改用等比例 `contain`，保留完整泵頭、瓶身與文字，不使用 CSS 非等比拉伸。
- 只更新 PPA+1 素材、Visual 尺寸與快取版本；商品價格、乳霜效果、戰鬥消耗、localStorage 與 Save `version: 5` 均維持不變。

### V2.12 配件縮放定位穩定化

- 水母內新增固定的 `jelly-accessory-layer` 座標層，配件 X／Y 繼續使用既有百分比存檔，不需要 Save Migration。
- 配件尺寸由相對瀏覽器寬度的 `7vw` 改為相對角色容器的 `11cqw`，頁面縮放、手機與 Desktop 切換時會跟水母同步縮放。
- 配件編輯模式會暫停水母漂浮動畫，拖曳座標改以固定配件層計算，避免動畫位移造成拖曳誤差。

### V2.13 強化版配件手勢

- 編輯模式支援單指／滑鼠拖曳，以及雙指連續縮放、旋轉與同步位移；使用 Pointer Events、Pointer Capture 與 `requestAnimationFrame` 維持觸控穩定度。
- 旋轉可在 -180°～180° 間調整，接近 0°／±90°／±180° 時輕微吸附；大小限制為 0.6～1.6 倍。
- 控制面板提供每次 5° 旋轉、0.05 倍縮放、即時數值與「重設目前配件」，兼顧手機手勢與桌機精細操作。
- Save 提升至 `version: 6`；既有 X／Y 位置保留，缺少的 `rotation`／`scale` 會依各配件預設值補齊。

## Save Migration 做法

`GAME_CONFIG.version` 目前為 `6`。`storage.js` 讀取既有 `jellyLabSave` 後交由 `normalizeSave()` 正規化：

1. 保留舊玩家的 points、LV、EXP、親密度、裝備、背包、圖鑑與每日資料。
2. 缺少的 `jellyfish.baseColor` 自動補為 `yellow`，保留原本 `equippedSkin`。
3. 缺少的 `inventory.battleItems` 補成 KTT、PNN、QCC、RNN、PPT、NAP 六個數量欄位，初始皆為 0；既有數量完整保留。`NAP` 為 PPA+1 的相容保存鍵。
4. 缺少的 `bossProgress.agingMonster` 補上 `defeated`、`clearCount`、`rewardClaimed`。
5. 缺少的 `rewards.coupons` 補成空陣列，既有 Coupon 完整保留並去除重複 ID。
6. 缺少 `jellyfish.equippedAccessories` 時，若存在舊的單一 `equippedAccessory` 就轉成一件配件陣列；現在不再依 `slot` 過濾，因此同類型配件也能並存。
7. 缺少 `jellyfish.accessoryPositions` 時，依 `config.js` 每件配件的 `defaultPosition` 補齊；既有合法 X／Y 會保留並限制在 4～96%。
8. V5 配件位置缺少 `rotation`／`scale` 時，依各配件預設值補齊；旋轉限制為 ±180°，大小限制為 0.6～1.6 倍。
9. 版本不是 6 或缺少自由配件欄位時，將正規化結果回寫 localStorage；不會因升級主動清除舊存檔。
10. 新建立的 Save 與 Reset Save 走 `createDefaultSave()`，使用 50,000 點並保存選定的 `baseColor`；既有 Save 的 points 不會被自動改寫。

Battle 中的 HP、Boss HP、狀態、回合、Battle Log 都只存在 `battle.js` 的記憶體狀態，離開或 Refresh 即結束該場戰鬥，不會污染養成系統資料。

## Battle Engine 架構

`battle.js` 提供：

- `createBattleState()`：每次挑戰建立 Player HP 100、Boss HP 320、狀態清除的暫存戰鬥。
- `getBattleActionQuantityLimits()`：依庫存、HP、狀態與 Config 算出本回合可使用數量。
- `beginPlayerAction()`：處理基本攻擊、批量膠囊、批量 PPT+1、PPA+1、消耗品扣除、MISS 與玩家行動後的癢傷害。
- `resolveBossTurn()`：依 Config 機率選擇 Boss 攻擊並處理傷害與狀態。
- Debug HP／狀態操作、Boss 勝負紀錄、獎勵領取與獎勵重置。

玩家行動開始後會設為 `actionLocked`，畫面上的所有 Battle Buttons 暫時 Disable；Boss 回合完成後才恢復，避免快速連點重複消耗或重複造成傷害。

## Boss Attack 邏輯

設定集中於 `BATTLE_CONFIG.boss.agingMonster.attacks`：

- `衰老衝擊`：50%，隨機 12～18 Damage。
- `乾癢粉塵`：25%，立即 5 Damage 並設定 `itchy = true`。
- `混濁視線`：25%，立即 5 Damage 並設定 `blurred = true`。

兩種狀態可以同時存在，重複施加只維持 `true`，不會堆疊多層。

## Item Consumption 與 Coupon 防重複

- 戰鬥商品以既有 `inventory.battleItems` 短代碼 KTT／PNN／QCC／RNN／PPT／NAP 保存數量；畫面顯示名稱則為 KTT+3／PNN+3／QCC+4／REE+5／PPT+1／PPA+1。
- 商店批量購買一次扣除 `unitPrice × quantity`，並一次增加庫存。
- 膠囊命中或 MISS 都會一次扣除選定數量；批量攻擊仍只觸發一次 Boss 回合。
- PPT+1 批量使用會依選定數量回血並限制在 Max HP；PPA+1 戰鬥中固定扣除 1 個。
- 所有扣除都先寫回 Save，數量一律以非負整數處理，沒有庫存時按鈕 Disable。
- 數量一律以非負整數處理，沒有庫存時按鈕 Disable。
- `claimBossReward()` 會同時檢查 `rewardClaimed` 與 Coupon id `boss_aging_coupon_600`，兩者任一成立都拒絕重複加入。

## 尚未完成功能

以下刻意留在後續版本：正式會員登入、後端 API、正式 Coupon API、真實 Coupon Code、金流、排行榜、每日／每週 Boss、多 Boss、Boss 正式美術、音效、戰鬥中斷後續戰、多裝置同步、小遊戲與家具系統。

## 測試結果

已使用本機瀏覽器進行實際點擊、購買、進入戰鬥、使用道具、勝負與 Responsive 測試；V2.2 另實測 Reset、消費後 Refresh、六款戰鬥商品置中與四種手機寬度。並執行全部 JavaScript `node --check` 與 Python 工具語法檢查。

| 測試項目 | 結果 |
| --- | --- |
| TEST 1：Reset Save 後 Points = 50,000，回到命名＋選色 | 通過 |
| TEST 2：選薰衣草紫，建立後 Refresh 仍為紫色 | 通過 |
| TEST 3：KTT ×5，10,000 → 5,000、庫存 0 → 5 | 通過 |
| TEST 4：PPT ×10，5,000 → 4,000、庫存為 10 | 通過 |
| TEST 5：RNN ×10 點數不足，購買按鈕 Disable 並顯示差額 | 通過 |
| TEST 6：KTT ×3 一次造成 105 Damage，庫存一次扣 3，Boss 只行動一次 | 通過 |
| TEST 7：KTT ×3 MISS 時 Damage 0 且完整扣除選定數量 | 通過 |
| TEST 8：HP20 使用 PPT ×2，回血 +70；Boss 回合只觸發一次 | 通過 |
| TEST 9：HP20 使用 PPT ×3，立即封頂 100，不超過 Max HP | 通過 |
| TEST 10：HP100＋blurred 時 PPT 最大數量為 1 | 通過 |
| TEST 11：itchy＋PPA ×10 時 Battle Action 固定只能使用 PPA ×1 | 通過 |
| TEST 12：KTT／PNN／QCC／RNN／PPT／PPA Visual 符合設定且三處共用 | 通過 |
| TEST 13：320px Shop／Quantity Selector／Action Panel／Battle 無橫向 Scroll | 通過 |
| Refresh 後 Points、Battle Inventory、Boss Clear、Coupon 保留 | 通過 |
| V1／V2 Save Migration、EXP 溢位、LV10 上限與無負值防呆 | 通過 |
| JavaScript `node --check`、Python 工具語法與瀏覽器錯誤 Log | 通過 |
| V2.2 TEST 1：Reset Save 後新玩家 Points = 50,000 | 通過；實際重設後完成命名＋選色並顯示 50,000 |
| V2.2 TEST 2：購買 KTT ×10，50,000 → 40,000；Refresh 仍保留 40,000 與 KTT ×10 | 通過 |
| V2.2 TEST 3～6：KTT／PNN／QCC／RNN Visual、背景圓與 Damage 共用中心軸 | 通過；桌面量測中心誤差小於 0.01px |
| V2.2 TEST 7：四張膠囊卡桌面等寬、中心 Y／水平軸一致 | 通過；寬螢幕卡片寬度約 298.8px |
| V2.2 TEST 8：PPT／PPA Visual 與效果文字置中 | 通過；與膠囊使用同一固定 Visual Wrapper |
| V2.2 TEST 9：320／375／390／430px 無橫向 Scroll | 通過；四種寬度均 `pageFits = true`，六張卡均在視窗內 |
| Battle Screen：KTT／PNN／QCC／RNN／PPT／PPA Visual 與 Icon Frame 中心對齊 | 通過；桌面與 320px Visual 中心誤差約 0px |
| Battle Screen：Visual 不覆蓋名稱／Damage，使用按鈕仍可開啟 Action Panel | 通過；430px 實際點擊 KTT「選擇」並取消 |
| Battle Screen：320／375／390／430px 無橫向 Scroll | 通過；各寬度卡片與按鈕均在可視範圍內 |
| V2.3：桌面圖鑑三欄、角色置中與 Skin 配色光圈 | 通過；1265px 實測三欄，角色與卡片中心對齊 |
| V2.3：320／375／390／430px 圖鑑 Responsive | 通過；四種寬度均無橫向 Scroll，圖鑑改為雙欄 |
| V2.3：爆氣水母素材清理 | 通過；512×512 PNG 左四分之一未再檢出異常綠色像素 |
| V2.4：戰鬥用品新名稱在商店、背包、準備畫面、Battle 與 Debug 顯示 | 通過 |
| V2.4：既有戰鬥物品保存鍵與數量相容 | 通過；仍使用 KTT／PNN／QCC／RNN／PPT／NAP 保存鍵 |
| V2.6：NAP+1 對外顯示為 PPA+1，內部 NAP 保存鍵與既有數量相容 | 通過；PPA 設定為 bottle Visual，舊 NAP ×7 可正常讀取 |
| V2.6：商店購買 PPA+1，點數 50,000 → 49,700，庫存 0 → 1 | 通過 |
| V2.6：戰鬥使用 PPA+1，解除癢狀態且庫存 1 → 0 | 通過；Boss 後續回合可重新施加其他狀態，原解除紀錄保留在 Battle Log |
| V2.6：PPA+1 白色按壓瓶 Visual 在商店、背包、Battle 共用 | 通過；瓶身、按壓頭與 PPA+1 標籤均可見 |
| V2.6：320px 商店／Battle 顯示 PPA+1 且無橫向 Scroll | 通過；Visual 與卡片均在視窗範圍內 |
| V2.7：PPA+1 內容與外用分類改為乳霜、瓶身標籤只保留 PPA+1 | 通過；商店卡片、戰鬥用品與商品 Visual 均已更新 |
| V2.7：舊 Save Migration 至 version 5，保留既有配件並補 accessoryPositions | 通過；舊版同 slot 配件可一併讀取 |
| V2.7：多件配件可同時裝備，不會因同 slot 替換 | 通過；本機購買並立即裝備 3 件後均顯示已裝備 |
| V2.7：首頁調整位置、滑鼠／觸控拖曳、方向鍵微調與回復預設 | 通過；實際拖曳皇冠後位置保存，回復預設回到設定值 |
| V2.7：Refresh 後配件位置、點數與已裝備狀態保留 | 通過；重新整理後仍讀取拖曳後的 X／Y 百分比 |
| V2.7：320px 配件編輯器、PPA+1 商店與新提示無橫向 Scroll | 通過；本機測得 document／body scrollWidth 305px，小於 320px |
| V2.8：使用者提供的 PPA+1 乳霜圖片在商店、背包、Battle 共用 | 通過；素材已加入 `assets/items/ppa-plus-one.png`，三處由同一 Visual Component 載入 |
| V2.9：方案 C 新 PPA+1 Icon 為透明背景、只顯示 PPA+1 且可供三處共用 | 通過；PNG Alpha 範圍為 0～255，外部背景像素為透明 |
| V2.9.1：PPA+1 顯示比例放大且 Battle Icon 不超出欄位 | 通過；Visual 由 1.1／0.46 調整為 1.35／0.5，並保留透明背景 |
| V2.9.2：保留 PPA+1 造型並提高水平視覺份量 | 通過；圖片改為 `scale(1.7, 1.35)`，外層欄位尺寸維持不變 |
| V2.9.3：PPA+1 指定水平 2.5、垂直 1.5 | 通過；CSS 使用 `scale(2.5, 1.5)`，外層寬度 50px 以避免泵頭裁切 |
| V2.10：以 2.5／1.5 配比重做 PPA+1 素材並提高文字清晰度 | 通過；改用自然寬版 PNG、清除非等比 CSS 拉伸，商店／背包／Battle 皆使用固定 Icon 框 |
| V2.11：PPA+1 垂直比例更新為 2 且保持文字清楚 | 通過；新 PNG 為透明 Alpha，完整按壓瓶以等比例 `contain` 顯示於商店／背包／Battle |
| V2.12：頁面縮放與 Responsive 切換時配件位置穩定 | 通過；座標固定為角色層百分比、尺寸使用 `11cqw`，既有 accessoryPositions 可直接沿用 |
| V2.13：配件 5° 旋轉與 0.05 倍縮放按鈕 | 通過；實測上下限固定為 ±180° 與 0.6～1.6 倍，重設後回到商品預設值 |
| V2.13：單指拖曳與雙指縮放／旋轉 | 通過；Chrome 觸控實測由 -6°／1.00 倍連續變為 24°／1.40 倍，滑鼠拖曳也正常 |
| V2.13：Save V5 → V6 保留 X／Y 並補 rotation／scale | 通過；舊 X／Y 保留，角度與大小補預設值，重新載入後手勢結果仍存在 |
