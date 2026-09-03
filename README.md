# 水母養成所 Jelly Lab V2.2

Jelly Lab V2.2 是在既有養成與 BOSS 挑戰 MVP 上的小幅增量更新。延續共用戰鬥商品 Visual、批量購買／使用與水母顏色選擇，調整新玩家初始點數與戰鬥商品卡的中心對齊。專案仍使用 HTML5、CSS3、Vanilla JavaScript 與 `localStorage`，不需要後端、帳號或 npm 依賴即可遊玩。

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
├─ assets/jellyfish/          # 8 張透明水母 PNG
├─ tools/slice_jellyfish.py   # 重建水母透明素材的切圖工具
├─ css/
│  ├─ main.css                # 既有基礎樣式與元件
│  ├─ animations.css          # 既有養成動畫
│  ├─ responsive.css          # 既有 Responsive 斷點
│  ├─ battle.css              # V2 戰鬥、獎勵與 Boss 動畫樣式
│  └─ v2-1.css                # V2.1/V2.2 商品 Visual、數量控制、選色與置中樣式
└─ js/
   ├─ app.js                  # 應用入口、事件路由、畫面切換與 Battle orchestration
   ├─ config.js               # 商品、等級、進化、Boss、攻擊、戰鬥商品與獎勵設定
   ├─ state.js                # Save 結構、版本正規化、數值防呆與物品數量
   ├─ storage.js              # localStorage 讀寫、V1/V2→V3 migration 與清除
   ├─ battle.js               # 純記憶體回合制 Battle Engine 與批量行動
   ├─ components.js           # 共用 KTT/PPT/NAP 商品 Visual Component
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
- 戰鬥商品：KTT、PNN、QCC、RNN、PPT、NAP，皆集中在 `config.js`。
- 戰鬥背包數量會立即保存，Refresh 後仍存在。
- 第一隻 Boss「老化怪獸」：HP 320、衰老衝擊、乾癢粉塵、混濁視線。
- 免費基本攻擊「水母撞擊」10 Damage，不需要任何膠囊即可挑戰。
- 回合制流程、玩家回合鎖定、Boss 回合、勝利與戰敗 Modal。
- 癢：每次玩家完成攻擊行動後受到 5 Damage，NAP 可解除。
- 視野模糊：水母攻擊有 50% MISS 機率，PPT 可回血並解除。
- PPT 回復最多 35 HP 且不超過 Max HP；滿血且沒有模糊時按鈕 Disable。
- NAP 只有在癢狀態時可用，且不會回血。
- Battle Log 最近保留 8 筆，含攻擊、受傷、狀態、治療與勝負紀錄。
- CSS 傷害、回血、Boss Shake、水母受傷、狀態與視野 Fog 效果。
- 首次擊敗獲得一次虛擬 NT$600 折價券，存於「我的獎勵」。不生成真正 Coupon Code。
- 再次擊敗可累積通關次數，但不會重複加入折價券。
- V2 Battle Debug：`+1 KTT`、`+1 PNN`、`+1 QCC`、`+1 RNN`、`+1 PPT`、`+1 NAP`、`Boss HP -50`、`Player HP -20`、`Apply Itchy`、`Apply Blurred`、`Clear Status`、`Reset Boss Reward`。
- 新增事件追蹤：`battle_shop_open`、`battle_item_purchase`、`boss_challenge_open`、`boss_battle_start`、`boss_attack`、`player_attack`、`battle_item_used`、狀態與勝負事件等，暫時只寫入 console 與記憶體事件陣列。

### V2.1 增量內容

- KTT、PNN、QCC、RNN 統一使用 CSS Capsule Visual：雙半膠囊、中央接合線、高光與立體陰影。
- PPT 使用咖啡色罐裝飲料 Visual；NAP 使用銀色扁圓金屬罐 Visual。
- `renderBattleItemVisual(item)` 位於 `components.js`，商店、背包、Battle 共用同一套商品視覺。
- 戰鬥商店與食物商店的可重複消耗品支援數量選擇、直接輸入、`MAX`、即時總價與單次最多 99 個。
- 點數不足時購買按鈕會 Disable，並顯示差額；批量購買只扣一次總價、只增加一次庫存。
- Battle 中武器與 PPT 使用 Action Panel 選擇數量；批量攻擊只算一個玩家 Action，Boss 只行動一次。
- 視野模糊時同一批武器只判定一次命中／Miss；Miss 仍完整消耗所有選定膠囊。
- PPT 的可用數量會依缺少 HP 計算，滿血但 blurred 時最多 1 罐；NAP 戰鬥中固定一次 1 個。
- 新玩家建立流程增加 7 種免費初始顏色選擇，選色即時預覽，`baseColor` 與 `equippedSkin` 分開保存。
- 舊玩家沒有 `baseColor` 時自動使用奶油黃；Reset Save 後會重新進入命名與選色流程。

### V2.2 小幅更新

- `GAME_CONFIG.startingPoints` 調整為 50,000；只有新建立遊戲與 Reset Save 使用新數值，Migration 會保留既有 points。
- 戰鬥商店六款商品改用共用的 `battle-item-content`、固定 `battle-item-visual-wrapper` 與 Flex 置中結構，Visual、背景圓與 Damage／效果文字共用中心軸。
- 膠囊統一為 78×40px；只保留膠囊本體旋轉，不使用個別商品的水平位移補丁。
- 桌面使用等寬 Grid，手機 320／375／390／430px 皆限制為單欄且不產生橫向捲動。

### Battle Screen UI 修正

- Battle Screen 的 KTT、PNN、QCC、RNN、PPT、NAP 都使用同一個 Icon Frame 置中規則。
- 修正原本 38px Icon 欄位被 Visual 原始 layout box 撐開，導致膠囊／罐裝圖示偏移並壓到名稱的問題。
- Visual 會在 Frame 內水平、垂直置中，名稱／Damage 與使用按鈕維持獨立欄位；不修改戰鬥數值、庫存扣除或 Action Lock。

## Save Migration 做法

`GAME_CONFIG.version` 目前為 `3`。`storage.js` 讀取既有 `jellyLabSave` 後交由 `normalizeSave()` 正規化：

1. 保留舊玩家的 points、LV、EXP、親密度、裝備、背包、圖鑑與每日資料。
2. 缺少的 `jellyfish.baseColor` 自動補為 `yellow`，保留原本 `equippedSkin`。
3. 缺少的 `inventory.battleItems` 補成 KTT、PNN、QCC、RNN、PPT、NAP 六個數量欄位，初始皆為 0；既有數量完整保留。
4. 缺少的 `bossProgress.agingMonster` 補上 `defeated`、`clearCount`、`rewardClaimed`。
5. 缺少的 `rewards.coupons` 補成空陣列，既有 Coupon 完整保留並去除重複 ID。
6. 版本不是 3 或缺少 V2.1 欄位時，將正規化結果回寫 localStorage；不會因升級主動清除舊存檔。
7. 新建立的 Save 與 Reset Save 走 `createDefaultSave()`，使用 50,000 點並保存選定的 `baseColor`；既有 Save 的 points 不會被自動改寫。

Battle 中的 HP、Boss HP、狀態、回合、Battle Log 都只存在 `battle.js` 的記憶體狀態，離開或 Refresh 即結束該場戰鬥，不會污染養成系統資料。

## Battle Engine 架構

`battle.js` 提供：

- `createBattleState()`：每次挑戰建立 Player HP 100、Boss HP 320、狀態清除的暫存戰鬥。
- `getBattleActionQuantityLimits()`：依庫存、HP、狀態與 Config 算出本回合可使用數量。
- `beginPlayerAction()`：處理基本攻擊、批量膠囊、批量 PPT、NAP、消耗品扣除、MISS 與玩家行動後的癢傷害。
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

- 戰鬥商品以 `inventory.battleItems` 的短代碼 KTT／PNN／QCC／RNN／PPT／NAP 保存數量。
- 商店批量購買一次扣除 `unitPrice × quantity`，並一次增加庫存。
- 膠囊命中或 MISS 都會一次扣除選定數量；批量攻擊仍只觸發一次 Boss 回合。
- PPT 批量使用會依選定數量回血並限制在 Max HP；NAP 戰鬥中固定扣除 1 個。
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
| TEST 11：itchy＋NAP ×10 時 Battle Action 固定只能使用 NAP ×1 | 通過 |
| TEST 12：KTT／PNN／QCC／RNN／PPT／NAP Visual 符合設定且三處共用 | 通過 |
| TEST 13：320px Shop／Quantity Selector／Action Panel／Battle 無橫向 Scroll | 通過 |
| Refresh 後 Points、Battle Inventory、Boss Clear、Coupon 保留 | 通過 |
| V1／V2 Save Migration、EXP 溢位、LV10 上限與無負值防呆 | 通過 |
| JavaScript `node --check`、Python 工具語法與瀏覽器錯誤 Log | 通過 |
| V2.2 TEST 1：Reset Save 後新玩家 Points = 50,000 | 通過；實際重設後完成命名＋選色並顯示 50,000 |
| V2.2 TEST 2：購買 KTT ×10，50,000 → 40,000；Refresh 仍保留 40,000 與 KTT ×10 | 通過 |
| V2.2 TEST 3～6：KTT／PNN／QCC／RNN Visual、背景圓與 Damage 共用中心軸 | 通過；桌面量測中心誤差小於 0.01px |
| V2.2 TEST 7：四張膠囊卡桌面等寬、中心 Y／水平軸一致 | 通過；寬螢幕卡片寬度約 298.8px |
| V2.2 TEST 8：PPT／NAP Visual 與效果文字置中 | 通過；與膠囊使用同一固定 Visual Wrapper |
| V2.2 TEST 9：320／375／390／430px 無橫向 Scroll | 通過；四種寬度均 `pageFits = true`，六張卡均在視窗內 |
| Battle Screen：KTT／PNN／QCC／RNN／PPT／NAP Visual 與 Icon Frame 中心對齊 | 通過；桌面與 320px Visual 中心誤差約 0px |
| Battle Screen：Visual 不覆蓋名稱／Damage，使用按鈕仍可開啟 Action Panel | 通過；430px 實際點擊 KTT「選擇」並取消 |
| Battle Screen：320／375／390／430px 無橫向 Scroll | 通過；各寬度卡片與按鈕均在可視範圍內 |
