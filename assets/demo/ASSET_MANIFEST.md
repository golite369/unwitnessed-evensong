# 三分钟 Demo 跑图资产

本目录资产由 Codex 内置 ImageGen 根据用户原始三视图、场景图和黑金哥特 UI 风格生成。原始文件均未覆盖。

| 文件 | 尺寸 | 透明 | Demo 用途 |
|---|---:|---:|---|
| `map_service_route.png` | 1916×821 | 否 | 连续横向跑图：医务室后勤区、厨房、雨夜石廊、礼拜堂侧门 |
| `bg_chapel_ritual.png` | 1672×941 | 否 | 第六、七声钟及 B-17 证词场景 |
| `sprite_irena_run.png` | 1024×1536 | 是 | 玩家控制角色伊蕾娜，侧向奔跑姿势 |
| `sprite_irena_run_alt.png` | 1024×1536 | 是 | 早期双帧方案，现已停用并保留作参考 |
| `sprite_sophie_walk.png` | 1024×1536 | 是 | 索菲自动跟随，侧向快走姿势 |
| `sprite_sophie_walk_alt.png` | 1024×1536 | 是 | 早期双帧方案，现已停用并保留作参考 |
| `sprite_evan_walk.png` | 1024×1536 | 是 | 埃文自动跟随，侧向警戒姿势 |
| `sprite_evan_walk_alt.png` | 1024×1536 | 是 | 早期双帧方案，现已停用并保留作参考 |
| `sheet_irena_run6.png` | 1152×768 | 是 | 伊蕾娜六阶段跑步循环，当前正式使用 |
| `sheet_sophie_run6.png` | 1152×768 | 是 | 索菲六阶段跑步循环，当前正式使用 |
| `sheet_evan_run6.png` | 1152×768 | 是 | 埃文六阶段跑步循环，当前正式使用 |

## 生成依据

- 伊蕾娜严格参照用户的灰绿色军装三视图；保留黑色盘发、肩章、臂章、腰带、枪套和长靴。
- 索菲严格参照用户的护士三视图；保留白头巾、针织披肩、护理长裙、医疗包和系带靴。
- 埃文严格参照用户的灰色长军装三视图；保留灰金发、肩带、手套、钥匙和长靴。
- 连续地图综合医务室、钟楼雨夜与礼拜堂参考，统一为冷灰、细线稿、半写实二维手绘画风。
- 礼拜堂按剧本布置五张铁制病床、祭坛与留声机；不在图内烘焙人物、对白或界面文字。

所有角色 PNG 已检查左上角 Alpha 值为 0，可直接叠加到 Canvas 或视觉小说场景中。

六阶段循环依次为触地、下压、经过、换脚触地、下压、经过。生成后的原始图由 `scripts/normalize_sprite_sheet.py` 自动按透明轮廓裁切，并统一缩放比例、人物中心与脚底基线，避免播放时抖动。

## 本轮透明修正版

对话立绘原文件保留不动，程序改用以下清底版本：

- `assets/generated/characters/portrait_irena_neutral_clean.png`
- `assets/generated/characters/portrait_sophie_worried_clean.png`
- `assets/generated/characters/portrait_evan_keys_clean.png`
- `assets/generated/characters/portrait_hermann_cold_smile_clean.png`

修正版只去除了黑色底、暗色光晕与底部渐变，没有改变人物造型、表情和服装。
