# 《无人作证的晚祷》回忆分镜资产落点 v1

本表对应 `demo-flashback-storyboard-v1.md`，用于下一步将回忆演出内置进 Demo。

## 回忆碎片 0：钟声与 B-31

1. `assets/generated/flashbacks/bg_flashback_b31_belltower.png`
2. `assets/generated/flashbacks/cg_fire_order_b31_closeup.png`
3. 以 2—3 帧暖白闪光模拟炮击，不另做爆炸立绘。
4. 白闪后切到 `assets/generated/flashbacks/cg_irena_shackled_wrist.png`。

## 回忆碎片 1：三日前抵达

1. 底图使用 `assets/generated/flashbacks/bg_flashback_sanatorium_arrival.png`。
2. 被铐近景可复用 `cg_irena_shackled_wrist.png`。
3. 埃文、伊蕾娜和赫尔曼使用现有立绘叠加；招牌文字由程序单独显示，避免烘焙错字。

## 回忆碎片 2：命令背后还有人

1. 建立镜头使用 `assets/generated/flashbacks/bg_flashback_command_room.png`。
2. 地图近景切换为 `assets/generated/flashbacks/cg_retreat_map_red_blue.png`。
3. 最后签字镜头可复用 `cg_fire_order_b31_closeup.png`，但不显示完整署名。

## 回忆碎片 3：失踪副官

1. 底图使用 `bg_flashback_command_room.png`，整体降低亮度。
2. 身份揭露前，将 `portrait_viktor_young_v2_earnest.png` 处理成逆光黑色剪影并轻微虚焦，不展示清晰正脸。
3. 交付动作使用 `prop_grayline_envelope.png` 从伊蕾娜一侧滑到副官一侧。
4. 第五声钟响时硬切回现在，不补完副官台词。

## 回忆碎片 4：VIKTOR

1. V、I 阶段只显示 `portrait_viktor_young_v2_earnest.png` 的手部局部或剪影。
2. K 阶段短暂露出眼睛和笑意，立即切断。
3. 输入 R 后才显示完整 `portrait_viktor_young_v2_earnest.png`，与 `portrait_victor_b17_injured.png` 进行 0.35 秒叠化。
4. 姓名由程序文字层显示，不写入图片。

## 背包/证物

- `prop_fire_order_b31.png`：可作为“贝尔纳炮击军令”证物卡大图。
- `prop_grayline_envelope.png`：本版只在回忆中出现，不命名为“密钥”或“灰线计划”。

## 演出统一规则

- 回忆层降低饱和度约 15%，增加轻微胶片噪点和暗角即可；不要使用夸张老电影划痕。
- 转场优先使用钟声、雨声、钢笔划纸、电话电流与白闪，不额外增加解释性旁白。
- 身份揭露前不能让年轻维克多的完整正脸停留超过 0.2 秒。
- 所有时间、地名和人物名由程序文字层呈现，图像本身保持无字或只有经过确认的 `B-31`。
