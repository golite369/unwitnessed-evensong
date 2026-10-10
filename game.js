"use strict";

const $ = selector => document.querySelector(selector);
const canvas = $("#exploreCanvas");
const ctx = canvas.getContext("2d");
const sceneBg = $("#sceneBg");
const dialogueBox = $("#dialogueBox");
const dialogueText = $("#dialogueText");
const speakerName = $("#speakerName");
const portraitLeft = $("#portraitLeft");
const portraitRight = $("#portraitRight");
const objective = $("#objective");
const mapPrompt = $("#mapPrompt");
const bellCounter = $("#bellCounter");
const bellFlash = $("#bellFlash");
const locationCard = $("#locationCard");
const flashbackOverlay = $("#flashbackOverlay");
const flashbackBg = $("#flashbackBg");
const flashbackFigure = $("#flashbackFigure");
const choiceOverlay = $("#choiceOverlay");
const choiceList = $("#choiceList");
const qtePanel = $("#qtePanel");
const qteChoices = $("#qteChoices");
const qteMeter = $("#qteMeter");
const evidenceOverlay = $("#evidenceOverlay");
const morseOverlay = $("#morseOverlay");
const menuOverlay = $("#menuOverlay");
const inventoryOverlay = $("#inventoryOverlay");
const inventoryGrid = $("#inventoryGrid");
const itemDetail = $("#itemDetail");
const introCover = $("#introCover");
const introNotice = $("#introNotice");
const SAVE_KEY = "unwitnessed-evensong-demo-save-v1";
const SOUND_KEY = "unwitnessed-evensong-sound";

const ASSETS = {
  map: "assets/demo/map_service_route.png",
  chapel: "assets/demo/bg_chapel_ritual.png",
  irenaSheet: "assets/demo/sheet_irena_run6.png",
  sophieSheet: "assets/demo/sheet_sophie_run6.png",
  evanSheet: "assets/demo/sheet_evan_run6.png",
  irena: "assets/generated/characters/portrait_irena_neutral_clean.png",
  sophie: "assets/generated/characters/portrait_sophie_worried_clean.png",
  evan: "assets/generated/characters/portrait_evan_keys_clean.png",
  hermann: "assets/generated/characters/portrait_hermann_cold_smile_clean.png",
  victor: "assets/generated/characters/portrait_victor_b17_injured.png",
  victorYoung: "assets/generated/flashbacks/portrait_viktor_young_v2_earnest.png",
  fbTower: "assets/generated/flashbacks/bg_flashback_b31_belltower.png",
  fbOrder: "assets/generated/flashbacks/cg_fire_order_b31_closeup.png",
  fbShackle: "assets/generated/flashbacks/cg_irena_shackled_wrist.png",
  fbArrival: "assets/generated/flashbacks/bg_flashback_sanatorium_arrival.png",
  fbCommand: "assets/generated/flashbacks/bg_flashback_command_room.png",
  fbRetreat: "assets/generated/flashbacks/cg_retreat_map_red_blue.png",
  fbEnvelope: "assets/generated/flashbacks/prop_grayline_envelope.png"
};

const portraits = {
  "伊蕾娜": { src: ASSETS.irena, side: "left" },
  "索菲": { src: ASSETS.sophie, side: "right" },
  "埃文": { src: ASSETS.evan, side: "right" },
  "赫尔曼": { src: ASSETS.hermann, side: "right" },
  "B-17": { src: ASSETS.victor, side: "right" },
  "维克多": { src: ASSETS.victorYoung, side: "right" }
};

const images = {};
for (const [key, src] of Object.entries({ map: ASSETS.map, irenaSheet: ASSETS.irenaSheet, sophieSheet: ASSETS.sophieSheet, evanSheet: ASSETS.evanSheet })) {
  images[key] = new Image();
  images[key].src = src;
}

const state = {
  mode: "start", resumeMode: "start", inventoryReturn: "menu", bellStage: 2,
  stats: { reason: 0, empathy: 0, control: 0 }, stability: 0, evanSupport: 0,
  heardSyllable: false, stimulusOff: false, orderSeized: false, routeShortcut: false,
  qteDuration: 5000, caseRecord: "尚未得到足以记录的答案。", route: "",
  knifeChecked: false, morseProgress: 0, sound: true,
  inventory: new Set(["medical-records"]), player: { x: 250, y: 665, dir: 1 },
  followers: { sophie: { x: 145, y: 669 }, evan: { x: 55, y: 673 } },
  walkPhase: 0, isMoving: false, mobileKickUntil: 0, cameraX: 0,
  checkpoints: new Set(), dialogue: [], dialogueIndex: 0, dialogueDone: null,
  typing: false, fullLine: "", typeTimer: 0, qteTimer: 0, flashbackTimer: 0,
  flashbackAdvance: null, startedAt: 0
};

try {
  const savedSound = localStorage.getItem(SOUND_KEY);
  if (savedSound !== null) state.sound = savedSound === "on";
} catch (_) { }

const keys = new Set();
let lastTime = performance.now();
let audioContext;
let rainNode;

const inventoryCatalog = [
  { id: "medical-records", name: "B-17 医疗记录", status: "已取得", image: "assets/generated/props/evidence_medical_records.png", description: "从医务室带出的 B-17 病历。用药段落遭到涂改，仍保留着“第七声之后”的记录。" },
  { id: "watch-0700", name: "停摆的怀表", status: "时间链已确认", image: "assets/generated/props/evidence_watch_0700.png", description: "指针停在七点的旧怀表。七点十三分起每分钟一声，第七声之后正好逼近炮击时间。" },
  { id: "fire-order", name: "B-31 军令复写件", status: "已扣押", image: "assets/generated/flashbacks/prop_fire_order_b31.png", description: "目标栏标有 B-31，署名处被雨水晕开。文件可以证明一份命令存在，却不能自行证明命令由谁下达。" },
  { id: "prayer-register", name: "残缺的晚祷登记页", status: "已取得", image: "assets/generated/props/evidence_prayer_register_torn.png", description: "晚祷登记册的第七行被撕去，说明今晚礼拜堂里的人员记录并不完整。" },
  { id: "victor-insignia", name: "断裂的旧徽章", status: "身份已确认", image: "assets/generated/props/evidence_victor_broken_insignia.png", description: "一枚来自塞利亚旧军的断裂徽章。它把病历编号 B-17 和本应阵亡的维克多联系在一起。" }
];

const openingLines = [
  { speaker: "索菲", text: "少校，对不起。我知道你们不能继续留在这儿，可我必须告诉您——礼拜堂那边已经开始了，比原定时间早。赫尔曼也把 B-17 带过去了。" },
  { speaker: "伊蕾娜", text: "别急，慢慢说。现在几点？钟响到第几声了？" },
  { speaker: "索菲", text: "七点十三，刚响过第二声。晚祷明明七点二十才开始，可今晚根本不是晚祷。赫尔曼把病床围在祭台前，还把那台留声机搬到了钟楼下面……他是要重演那天晚上的事。" },
  { speaker: "伊蕾娜", text: "七点十三开始，一分钟一声，第七声就是七点十九。再过一分钟，正好是贝尔纳炮击开始的时间。他不是在等 B-17 自己开口，是想把人逼回那天晚上，再把逼出来的话当成证词。" },
  { speaker: "埃文", text: "护理员，我提醒你一句。你现在带她绕过警戒，不是在帮忙，是在协助受看押人员脱离监管。按条例，这件事够你上军事法庭了。" },
  { speaker: "索菲", text: "我知道。可今晚这份记录一旦写完，明天审判庭就会把它当成证词。到时候您信不信程序已经不重要了，所有人只会相信纸上写的东西。走侧廊吧，厨房后门通礼拜堂左边，正门有人守着。" }
];

const knifeLines = [
  { speaker: "伊蕾娜", text: "手别这么快，中尉。我要真想杀人，也不会在厨房里随手拿把刀。这里到处是脚印，墙上还会空一格，谁都知道刀是从哪儿拿的。" },
  { speaker: "埃文", text: "那您会怎么做？找一道没有署名的命令，再找个人替您把事情办了？" },
  { speaker: "伊蕾娜", text: "我会先让他相信，那道命令没有错。等他动了手，所有记录都会说，他只是在尽自己的职责。这样我不用碰武器，他也不会觉得自己杀了人。" }
];

const passageLines = [
  { speaker: "索菲", text: "少校，等等，您手在发抖。又头疼了吗？还是刚才那支药有问题？" },
  { speaker: "伊蕾娜", text: "别碰我。不是药，至少不全是。钟声下面还有别的声音，很低。钟停了，那声音还在，震得我后脑发麻。" },
  { speaker: "埃文", text: "还有别的声音？我只听见钟声和雨。您确定不是药效上来了？" },
  { speaker: "索菲", text: "留声机……赫尔曼让人在钟楼下面放了一台旧留声机，说是要记录钟声的回响。可机器接上以后，他就再也不许护理员靠近了。" },
  { speaker: "伊蕾娜", text: "那东西不是拿来记录的，是拿来播放的。他在用那种声音刺激伤员，逼他们想起炮击，再从说出来的话里挑出自己想要的答案。换个医学上的名字，就好像这件事没那么脏了。" }
];

const chapelLines = [
  { speaker: "赫尔曼", text: "少校，晚上好。你比我预想的早了两分钟。看来疼痛并没有影响你的判断。" },
  { speaker: "埃文", text: "医生，今晚的证词记录没有提前通知看守方。如果这是正式程序，请出示命令。如果不是，我有权要求你马上停止。" },
  { speaker: "赫尔曼", text: "中尉，你的职责是看守囚犯，可现在囚犯就站在礼拜堂里。你是在履行职责，还是在帮她违规，我想还是留到明早的报告里再解释吧。" },
  { speaker: "伊蕾娜", text: "你早就知道我会来。钟声响得整个修道院都听得见，侧廊却连一个守卫都没有。你不就是想看看，我听到这些以后会有什么反应吗？" },
  { speaker: "赫尔曼", text: "我只关心那些看得见、能重复、也能记下来的反应。它是自己出现的，还是被什么东西刺激出来的，对结果没有影响。" }
];

const seventhBellLines = [
  { speaker: "赫尔曼", text: "记录。七点十九分，第七次钟声后，B-17 出现反应。右手手指弯曲，呼吸加快，开始尝试说话。" },
  { speaker: "B-17", text: "……不要……" },
  { speaker: "B-17", text: "不要……让她……" },
  { speaker: "赫尔曼", text: "别急，慢慢说。你不想让谁知道？是站在你面前的伊蕾娜少校吗？" }
];

const interruptLines = [
  { speaker: "伊蕾娜", text: "够了，赫尔曼。他只说了半句话，你就把想要的名字塞给他。别管这叫协助，你是在替他作证。" },
  { speaker: "赫尔曼", text: "他的语言能力已经严重受损。如果没人引导，他只能一直重复这些没有意义的声音，我们什么也问不出来。" },
  { speaker: "伊蕾娜", text: "那也该让他自己说。你把问题和答案都给了他，最后再删掉问题，只记下自己想听的那几个字。" }
];

const identityLines = [
  { speaker: "B-17", text: "少校……地图……是我……" },
  { speaker: "伊蕾娜", text: "别叫我少校。看着我，告诉我你是谁。说不出来，就敲给我听，一个字母也行。" },
  { speaker: "索菲", text: "别问了，他已经撑不住了。您非要他现在想起来，只会让他再经历一遍。" },
  { speaker: "伊蕾娜", text: "我得知道。不是为了审判，也不是为了给赫尔曼留下记录。我只想知道，我现在抓着的这只手，到底是谁的。" }
];

const flashbacks = {
  opening: [
    { src: ASSETS.fbTower, time: "炮击前一分钟", caption: "雨把钟楼和远处的炮火压成同一种颜色。", line: "无线电：第三边境炮兵营，收到坐标 B-31，等待最终确认。", duration: 3000 },
    { src: ASSETS.fbOrder, time: "", caption: "潮湿地图上，B-31 被圈在军令旁边。", line: "无线电：目标确认。钟声以后执行。", duration: 3000 },
    { src: ASSETS.fbOrder, time: "", caption: "黑手套压住署名，水滴把墨迹慢慢晕开。", line: "无线电：授权人呢？", duration: 2400 },
    { src: ASSETS.fbShackle, time: "现在", caption: "白光退去，同一只手已经戴上镣铐。", line: "索菲：少校？", duration: 2600 }
  ],
  arrival: [
    { src: ASSETS.fbShackle, time: "三日前", caption: "押送路上，镣铐在每一级石阶上轻响。", line: "", duration: 2600 },
    { src: ASSETS.fbArrival, time: "三日前", caption: "旧修道院被改成了帝国军医部接管的疗养院。", line: "埃文：伊蕾娜·维兰，原塞利亚少校，贝尔纳炮击案被审判人。", duration: 4200 },
    { src: ASSETS.fbOrder, time: "", caption: "赫尔曼把军令复写件放在她面前。", line: "赫尔曼：这道火力命令上，有你的署名。", duration: 3300 },
    { src: ASSETS.fbOrder, time: "", caption: "伊蕾娜没有碰那张纸。", line: "伊蕾娜：署名不是答案。　赫尔曼：所以我们还需要证人。", duration: 3600 }
  ],
  retreat: [
    { src: ASSETS.fbCommand, time: "塞利亚败退的最后一年", caption: "地下指挥室只剩应急灯，撤退报告一份接一份。", line: "北线后退。桥梁失守。医院还没有撤完。", duration: 3600 },
    { src: ASSETS.fbRetreat, time: "", caption: "两个村庄、一座桥和医院都留在撤退线后面。", line: "年轻副官：这条线后面还有人。命令要签吗？", duration: 3700 },
    { src: ASSETS.fbRetreat, time: "", caption: "铅笔停了一秒，随后继续向前。", line: "伊蕾娜：不要问命令干不干净，只问它能不能让更多人活到明天。", duration: 4300 }
  ],
  northline: [
    { src: ASSETS.fbCommand, time: "", caption: "所有电话指示灯同时熄灭，备用灯闪了两次。", line: "值勤员：北线通讯全部中断。", duration: 3000 },
    { src: ASSETS.fbCommand, figure: ASSETS.victorYoung, variant: "silhouette", time: "", caption: "年轻副官推开门，脸留在逆光里。", line: "副官：第三边境炮兵营还在原地，他们在等确认。", duration: 3400 },
    { src: ASSETS.fbCommand, figure: ASSETS.fbEnvelope, variant: "prop", time: "", caption: "伊蕾娜把只有一条灰色封线的信封推过去。", line: "伊蕾娜：确认他们还在不在原地。确认以后回来找我。", duration: 3600 }
  ]
};

function resetState() {
  Object.assign(state, {
    mode: "flashback", resumeMode: "flashback", inventoryReturn: "menu", bellStage: 2,
    stats: { reason: 0, empathy: 0, control: 0 }, stability: 0, evanSupport: 0,
    heardSyllable: false, stimulusOff: false, orderSeized: false, routeShortcut: false,
    qteDuration: 5000, caseRecord: "尚未得到足以记录的答案。", route: "",
    knifeChecked: false, morseProgress: 0, inventory: new Set(["medical-records"]),
    player: { x: 250, y: 665, dir: 1 },
    followers: { sophie: { x: 145, y: 669 }, evan: { x: 55, y: 673 } },
    walkPhase: 0, isMoving: false, mobileKickUntil: 0, cameraX: 0,
    checkpoints: new Set(), startedAt: Date.now()
  });
}

function startDemo() {
  stopRain();
  resetState();
  introCover.classList.add("hidden");
  introCover.classList.remove("leaving");
  document.body.classList.remove("exploring");
  $("#menuToggle").disabled = false;
  for (const overlay of [menuOverlay, inventoryOverlay, evidenceOverlay, morseOverlay, choiceOverlay, qtePanel, $("#endScreen")]) overlay.classList.add("hidden");
  $("#startScreen").classList.add("hidden");
  objective.textContent = "礼拜堂提前开始了";
  bellCounter.textContent = "钟声 Ⅱ / Ⅶ";
  sceneBg.src = ASSETS.map;
  sceneBg.style.filter = "brightness(.58) saturate(.72) contrast(1.08)";
  sceneBg.style.opacity = "1";
  initAudio();
  renderInventory();
  playFlashback(flashbacks.opening, startMedicalRoom);
}

function startMedicalRoom() {
  showLocation("医务室 · 七点十三分");
  showDialogue([openingLines[0]], () => playFlashback(flashbacks.arrival, () => showDialogue(openingLines.slice(1, 3), showMedicalChoice)));
}

function showMedicalChoice() {
  showChoice("医务室", "你要先确认什么？", [
    { text: "先告诉我 B-17 现在怎么样。", tone: "empathy", onChoose: () => { addStats({ empathy: 2 }); state.stability++; return [{ speaker: "索菲", text: "他一直在发冷，药效却比其他人重。被带走以前，他反复说“第七声之后”，像是在提醒谁，也像是在求谁停下来。" }]; } },
    { text: "钟从什么时候开始响的？", tone: "reason", onChoose: () => { addStats({ reason: 2 }); state.inventory.add("watch-0700"); return [{ speaker: "索菲", text: "七点十三分第一声，之后每分钟一次。走廊的钟慢了半拍，可这只怀表一直停在七点，我不敢再校它。" }]; } },
    { text: "礼拜堂有多少人，谁负责警戒？", tone: "control", onChoose: () => { addStats({ control: 2 }); state.evanSupport++; return [{ speaker: "埃文", text: "正门两人，钟楼一人，侧廊没有固定岗。您最好记住，我是在报告警戒，不是在替您规划路线。" }]; } }
  ], response => showDialogue([...response, ...openingLines.slice(3)], () => triggerBell(3, "第三次钟声", "侧廊的门被雨风吹开", enterExploration)));
}

function showKitchenChoice() {
  showChoice("厨房", "只能停下来查一件事。", [
    { text: "检查刀架旁的值勤命令。", hint: "这里的命令也有人签过。", tone: "reason", onChoose: () => { addStats({ reason: 1, control: 1 }); state.inventory.add("fire-order"); return knifeLines; } },
    { text: "询问索菲给伊蕾娜和伤员使用的药。", hint: "先确认赫尔曼用了什么。", tone: "empathy", onChoose: () => { addStats({ empathy: 2 }); return [{ speaker: "伊蕾娜", text: "索菲，赫尔曼给 B-17 用了什么？别告诉我瓶子上的名字，告诉我人在药效里会变成什么样。" }, { speaker: "索菲", text: "阿洛芬。它会让人安静，也会把创伤记忆放大。受试者看起来是在回答，实际上可能只是在逃离眼前的声音。" }]; } },
    { text: "要求埃文交出侧门钥匙。", hint: "先控制进入礼拜堂的路线。", tone: "control", onChoose: () => { addStats({ control: 2 }); state.routeShortcut = true; return [{ speaker: "伊蕾娜", text: "中尉，把侧门钥匙给我。你可以继续说这是监管，也可以等赫尔曼写完一份没人能推翻的证词。" }, { speaker: "埃文", text: "我会开门，但钥匙仍在我手里。别把服从程序误解成站在您这边。" }]; } }
  ], response => showDialogue(response, () => { if (state.routeShortcut) state.player.x = Math.max(state.player.x, 1950); enterExploration(); }));
}

function showPassageChoice() {
  showChoice("雨夜石廊", "低频仍在墙体里震动。", [
    { text: "停下来闭眼分辨钟声。", tone: "reason", onChoose: () => { addStats({ reason: 2 }); return [{ speaker: "伊蕾娜", text: "钟声已经停了，低频还在继续。它不是余响，是另一段被藏在钟声下面的声音。" }]; } },
    { text: "让索菲检查自己的身体反应。", tone: "empathy", onChoose: () => { addStats({ empathy: 2 }); state.stability++; return [{ speaker: "索菲", text: "我的脉搏也在跟着它变快，不是您一个人的药物反应。我去关留声机时，会先把 B-17 的耳塞还给他。" }]; } },
    { text: "命令两人继续前进。", tone: "control", onChoose: () => { addStats({ control: 2 }); return [{ speaker: "伊蕾娜", text: "别在这里停。赫尔曼需要的就是我们被声音拖住。到礼拜堂以后，先控制门和记录席。" }]; } }
  ], response => showDialogue(response, enterExploration));
}

function showChapelChoice() {
  showChoice("礼拜堂", "赫尔曼正在把观察写成证词。", [
    { text: "让书记官出示正式记录命令。", tone: "control", onChoose: () => { addStats({ reason: 1, control: 1 }); state.evanSupport++; state.inventory.add("prayer-register"); return [{ speaker: "伊蕾娜", text: "让书记官把记录命令和在场名单一起摆出来。程序既然能定人的罪，就别只在对你方便的时候出现。" }, { speaker: "埃文", text: "医生，请出示命令。记录继续，但从现在起，每一句提问也必须逐字写下。" }]; } },
    { text: "你给这些伤员用了什么？", tone: "reason", onChoose: () => { addStats({ reason: 1, empathy: 1 }); return [{ speaker: "伊蕾娜", text: "先把药名和剂量记进去。你不能一边用阿洛芬放大创伤，一边把药效里挤出来的话叫作自发证词。" }, { speaker: "赫尔曼", text: "镇静剂和阿洛芬，都是允许使用的观察辅助手段。药物影响反应强度，不改变记忆内容。" }]; } },
    { text: "把留声机关掉，现在。", tone: "control", onChoose: () => { addStats({ control: 2 }); state.qteDuration = 3800; return [{ speaker: "伊蕾娜", text: "把留声机关掉，现在。你要问人，就先让他回到这个房间里。" }, { speaker: "赫尔曼", text: "拒绝。观察已经开始，任何中断都会破坏结果。少校，如果你想阻止，就得当着所有人的面动手。" }]; } }
  ], response => showDialogue(response, () => triggerBell(7, "第七次钟声", "所有病床同时绷紧", () => showDialogue(seventhBellLines, startQte))));
}

function addStats(delta) {
  for (const [key, value] of Object.entries(delta)) state.stats[key] += value;
  refreshMenuSummary();
}

function showChoice(eyebrow, title, options, onDone) {
  state.mode = "choice";
  document.body.classList.remove("exploring");
  dialogueBox.classList.add("hidden");
  objective.classList.add("hidden");
  mapPrompt.classList.add("hidden");
  $("#choiceEyebrow").textContent = eyebrow;
  $("#choiceTitle").textContent = title;
  choiceList.replaceChildren();
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choiceOption ${option.tone || ""}${option.locked ? " locked" : ""}`;
    button.disabled = Boolean(option.locked);
    button.innerHTML = `<strong>${option.text}</strong>${option.hint ? `<small>${option.hint}</small>` : ""}`;
    button.addEventListener("click", () => {
      if (option.locked) return;
      button.classList.add("choiceFlash");
      const result = option.onChoose ? option.onChoose() : null;
      setTimeout(() => { choiceOverlay.classList.add("hidden"); if (onDone) onDone(result, option); }, 260);
    });
    choiceList.append(button);
  }
  choiceOverlay.classList.remove("hidden");
}

function playFlashback(frames, onDone) {
  clearTimeout(state.flashbackTimer);
  document.body.classList.remove("exploring");
  state.mode = "flashback";
  canvas.style.display = "none";
  dialogueBox.classList.add("hidden");
  objective.classList.add("hidden");
  mapPrompt.classList.add("hidden");
  hidePortraits();
  let index = 0;
  let locked = false;
  const showFrame = () => {
    if (index >= frames.length) {
      flashbackOverlay.classList.add("hidden");
      flashbackOverlay.classList.remove("flashback-silhouette", "flashback-reveal", "flashback-prop");
      state.flashbackAdvance = null;
      if (onDone) onDone();
      return;
    }
    locked = true;
    const frame = frames[index++];
    flashbackOverlay.classList.remove("flashback-silhouette", "flashback-reveal", "flashback-prop");
    if (frame.variant) flashbackOverlay.classList.add(`flashback-${frame.variant}`);
    flashbackBg.src = frame.src;
    flashbackBg.style.animation = "none";
    void flashbackBg.offsetWidth;
    flashbackBg.style.animation = "memoryDrift 7s linear forwards";
    if (frame.figure) {
      flashbackFigure.src = frame.figure;
      flashbackFigure.classList.remove("hidden");
    } else flashbackFigure.classList.add("hidden");
    $("#flashbackTime").textContent = frame.time || "";
    $("#flashbackCaption").textContent = frame.caption || "";
    $("#flashbackLine").textContent = frame.line || "";
    flashbackOverlay.classList.remove("hidden");
    clearTimeout(state.flashbackTimer);
    state.flashbackTimer = setTimeout(() => { locked = false; showFrame(); }, frame.duration || 2600);
    setTimeout(() => { locked = false; }, 380);
  };
  state.flashbackAdvance = () => {
    if (locked) return;
    clearTimeout(state.flashbackTimer);
    showFrame();
  };
  showFrame();
}

function enterExploration() {
  document.body.classList.add("exploring");
  state.mode = "explore";
  canvas.style.display = "block";
  sceneBg.style.opacity = "0";
  objective.classList.remove("hidden");
  objective.textContent = "穿过后勤通道，前往礼拜堂侧门";
  showLocation("修道院后勤通道");
  startRain();
  saveProgress("explore");
}

function updateExploration(dt) {
  if (state.mode !== "explore") return;
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx--;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx++;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy--;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy++;
  const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const speed = running ? 440 : 250;
  if (dx) state.player.dir = Math.sign(dx);
  state.player.x = clamp(state.player.x + dx * speed * dt, 130, 4380);
  state.player.y = clamp(state.player.y + dy * speed * .52 * dt, 590, 735);
  state.isMoving = Boolean(dx || dy || performance.now() < state.mobileKickUntil);
  if (state.isMoving) state.walkPhase += dt * (running ? 12 : 9);
  const gap = state.player.dir * 105;
  const followEase = Math.min(1, dt * 4.2);
  state.followers.sophie.x += (state.player.x - gap - state.followers.sophie.x) * followEase;
  state.followers.sophie.y += (state.player.y + 4 - state.followers.sophie.y) * followEase;
  state.followers.evan.x += (state.followers.sophie.x - gap * .9 - state.followers.evan.x) * followEase * .78;
  state.followers.evan.y += (state.followers.sophie.y + 4 - state.followers.evan.y) * followEase * .78;
  state.cameraX += ((state.player.x - canvas.width * .37) - state.cameraX) * Math.min(1, dt * 5);
  state.cameraX = clamp(state.cameraX, 0, 4400 - canvas.width);
  if (state.player.x > 900 && !state.checkpoints.has("bell4")) {
    state.checkpoints.add("bell4");
    triggerBell(4, "第四次钟声", "刀架上的影子轻轻震动");
  }
  if (state.player.x > 2280 && !state.checkpoints.has("bell5")) {
    state.checkpoints.add("bell5");
    triggerBell(5, "第五次钟声", "石墙深处传来第二层振动", () => showDialogue(passageLines, () => playFlashback(flashbacks.northline, showPassageChoice)));
  }
  if (state.player.x > 3490 && !state.checkpoints.has("bell6")) {
    state.checkpoints.add("bell6");
    triggerBell(6, "第六次钟声", "礼拜堂侧门的烛火亮了");
  }
  const nearKnife = state.player.x > 1320 && state.player.x < 1870 && !state.knifeChecked;
  const nearDoor = state.player.x > 4010;
  mapPrompt.classList.toggle("hidden", !(nearKnife || nearDoor));
  mapPrompt.textContent = nearDoor ? "E · 进入礼拜堂" : "E · 检查厨房";
  objective.textContent = state.player.x < 3000 ? "穿过后勤通道，前往礼拜堂侧门" : "进入礼拜堂侧门";
}

function interact() {
  if (state.mode !== "explore") return;
  if (state.player.x > 1320 && state.player.x < 1870 && !state.knifeChecked) {
    state.knifeChecked = true;
    playFlashback(flashbacks.retreat, showKitchenChoice);
    return;
  }
  if (state.player.x > 4010) enterChapel();
}

function enterChapel() {
  state.mode = "dialogue";
  stopRain();
  canvas.style.display = "none";
  sceneBg.src = ASSETS.chapel;
  sceneBg.style.opacity = "1";
  sceneBg.style.filter = "brightness(.62) saturate(.72) contrast(1.08)";
  saveProgress("chapel");
  showLocation("礼拜堂 · 七点十九分");
  showDialogue(chapelLines, showChapelChoice);
}

function startQte() {
  state.mode = "qte";
  $("#menuToggle").disabled = true;
  qteChoices.replaceChildren();
  const options = [
    { text: "立刻打断赫尔曼", tone: "control", choose: () => { addStats({ control: 2 }); state.stability++; state.orderSeized = true; state.inventory.add("fire-order"); return interruptLines; } },
    { text: "再听一个音节", tone: "reason", choose: () => { addStats({ reason: 2 }); state.heardSyllable = true; return [{ speaker: "B-17", text: "伊……" }, { speaker: "赫尔曼", text: "记录。他在指认伊蕾娜。" }, { speaker: "伊蕾娜", text: "他只说了一个音节。你这么急着替他补完，是怕他说出另一个词吗？" }]; } },
    { text: "让索菲关闭留声机", tone: "empathy", choose: () => { addStats({ empathy: 2 }); state.stability += 2; state.stimulusOff = true; return [{ speaker: "索菲", text: "我来关。B-17，听着我的声音，钟已经停了，你现在在礼拜堂里。" }, { speaker: "赫尔曼", text: "观察被破坏了。护理员，你会为这次中断承担责任。" }, { speaker: "伊蕾娜", text: "至少从现在起，他说的话属于他自己。" }]; } }
  ];
  let resolved = false;
  const resolve = option => {
    if (resolved) return;
    resolved = true;
    clearInterval(state.qteTimer);
    qtePanel.classList.add("hidden");
    $("#menuToggle").disabled = false;
    showDialogue(option.choose(), openInvestigationMethods);
  };
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choiceOption ${option.tone}`;
    button.innerHTML = `<strong>${option.text}</strong>`;
    button.addEventListener("click", () => resolve(option));
    qteChoices.append(button);
  }
  qtePanel.classList.remove("hidden");
  qteMeter.style.transform = "scaleX(1)";
  const start = performance.now();
  clearInterval(state.qteTimer);
  state.qteTimer = setInterval(() => {
    const left = Math.max(0, 1 - (performance.now() - start) / state.qteDuration);
    qteMeter.style.transform = `scaleX(${left})`;
    if (left <= 0) resolve(options[1]);
  }, 30);
}

function openInvestigationMethods() {
  const { reason, empathy, control } = state.stats;
  const evidenceCount = ["medical-records", "watch-0700", "fire-order", "prayer-register"].filter(id => state.inventory.has(id)).length;
  const canA = reason >= 4, canB = empathy >= 4, canC = control >= 4;
  const canD = reason >= 3 && empathy >= 3 && evidenceCount >= 2 && state.stability >= 2;
  const options = [
    { text: "用病历追问“没有旗”。", hint: canA ? "追查蓝灯与目标图的矛盾" : "需要更完整的时间与声音推理", tone: "reason", locked: !canA, route: "A" },
    { text: "关掉刺激，只问他亲眼看见的事。", hint: canB ? "优先保护 B-17 的状态" : "需要先建立更多信任", tone: "empathy", locked: !canB, route: "B" },
    { text: "扣押军令，要求书记官逐字记录。", hint: canC ? "追查军令的程序效力" : "需要足够的现场控制力", tone: "control", locked: !canC, route: "C" },
    { text: "先还原目标图，再让 B-17 自己完成句子。", hint: canD ? "证物和状态均已满足" : "需要推理、共情、两件证物以及稳定的 B-17", tone: "reason", locked: !canD, route: "D" }
  ];
  if (!options.some(option => !option.locked)) {
    const fallback = reason >= empathy && reason >= control ? "A" : empathy >= control ? "B" : "C";
    options.find(option => option.route === fallback).locked = false;
  }
  showChoice("最终调查方法", "你只能优先追问一个问题。", options.map(option => ({ ...option, onChoose: () => option.route })), route => startRoute(route));
}

function startRoute(route) {
  state.route = route;
  if (route === "A") {
    const lines = [
      { speaker: "伊蕾娜", text: "B-17，病历写着修道院没有旗。我不问命令，也不问名字。第七声以后，你在钟楼看见了什么？" },
      { speaker: "B-17", text: "灯……蓝……蓝灯……" },
      { speaker: "伊蕾娜", text: "蓝灯是塞利亚军标记医疗运输队的信号。灯在哪儿？" },
      { speaker: "B-17", text: "钟楼……窗……图上……没有……" },
      { speaker: "伊蕾娜", text: "钟楼有蓝灯，目标图却没有。炮兵不是看错了，是有人把医疗标记从图上抹掉了。" },
      { speaker: "赫尔曼", text: "这仍然只是一个受创伤者的片段记忆。" },
      { speaker: "伊蕾娜", text: "那就把原图拿出来，让它和这段记忆互相证明。" }
    ];
    showDialogue(lines, () => finishRoute("蓝灯。", "炮击不是单纯误判。有人从目标图上抹掉蓝灯，把医疗点伪装成了军事目标。"));
  } else if (route === "B") {
    showDialogue(identityLines, () => openMorse("B"));
  } else if (route === "C") {
    const lines = [
      { speaker: "伊蕾娜", text: "这张军令从现在起由看守方扣押。书记官，继续记录，连赫尔曼的问题也一个字都别删。" },
      { speaker: "赫尔曼", text: "命令上有你的署名、你的军衔和你的授权格式。你还想否认什么？" },
      { speaker: "B-17", text: "不是……她……" },
      { speaker: "赫尔曼", text: "记录：受试者出现否认性混乱。" },
      { speaker: "埃文", text: "不。记录原话：“不是她”。医生的判断另起一行，不能替换证词。" },
      { speaker: "伊蕾娜", text: "署名能证明这张纸存在，不能证明它就是他当夜收到的真实命令。现在，至少记录上会留下这个区别。" }
    ];
    showDialogue(lines, () => finishRoute("不是她。", "现存军令只能证明文件上有伊蕾娜的署名，不能证明这就是 B-17 当夜收到的真实命令。"));
  } else {
    const lines = [
      { speaker: "伊蕾娜", text: "先别问名字。B-17，钟楼窗里有蓝灯，对吗？目标图上却没有。" },
      { speaker: "B-17", text: "蓝灯……被擦掉……地下……" },
      { speaker: "赫尔曼", text: "他在说伊蕾娜。记录——" },
      { speaker: "埃文", text: "让他说完。刚才只有一个音节，谁都无权替他补成名字。" },
      { speaker: "B-17", text: "伊……甸……" },
      { speaker: "伊蕾娜", text: "伊甸不是人名。玛尔塔修女说过，那是修道院地下室的旧称。" },
      { speaker: "B-17", text: "孩子……地下室……图上……弹药库……" },
      { speaker: "伊蕾娜", text: "蓝灯被抹掉，地下室又被标成弹药库。有人把避难所改造成了一个必须被摧毁的目标。" }
    ];
    showDialogue(lines, () => showDialogue(identityLines, () => openMorse("D")));
  }
}

const morseSteps = [
  { code: "· · · —", reveal: "V _ _ / _ _ _" },
  { code: "· ·", reveal: "V I _ / _ _ _" },
  { code: "— · —", reveal: "V I K / _ _ _" },
  { code: "—", reveal: "V I K / T _ _" },
  { code: "— — —", reveal: "V I K / T O _" },
  { code: "· — ·", reveal: "V I K / T O R" }
];

function openMorse(route) {
  state.route = route;
  state.mode = "morse";
  state.morseProgress = 0;
  morseOverlay.classList.remove("hidden");
  $("#morseCode").textContent = "· · ·";
  $("#morseReveal").textContent = "_ _ _ / _ _ _";
}

function morseTap() {
  if (state.mode !== "morse") return;
  const step = morseSteps[state.morseProgress];
  if (!step) return;
  playMorse(step.code);
  $("#morseCode").textContent = step.code;
  $("#morseReveal").textContent = step.reveal;
  state.morseProgress++;
  if (state.morseProgress === 3) {
    morseOverlay.classList.add("hidden");
    playFlashback([{ src: ASSETS.fbCommand, figure: ASSETS.victorYoung, variant: "silhouette", caption: "会议桌下，年轻副官用指节敲完第三个字母。", line: "副官：我只是想确认，少校还听得懂。", duration: 2400 }], () => { state.mode = "morse"; morseOverlay.classList.remove("hidden"); });
  }
  if (state.morseProgress >= morseSteps.length) {
    $("#morseTap").textContent = "确认身份";
    setTimeout(() => {
      morseOverlay.classList.add("hidden");
      $("#morseTap").textContent = "记录下一组";
      state.inventory.add("victor-insignia");
      playFlashback([{ src: ASSETS.fbCommand, figure: ASSETS.victorYoung, variant: "reveal", caption: "最后一下敲击落下，过去的脸与病床上的轮廓重叠。", line: "VIKTOR", duration: 2800 }], () => showDialogue([{ speaker: "伊蕾娜", text: "维克多……你还活着。可他们删掉了你的名字，让所有人都以为你已经死了。" }], () => {
        if (state.route === "D") finishRoute("伊甸。", "蓝灯被从目标图上抹掉，儿童避难的地下室被标成弹药库；B-17 是维克多，而“伊……”指向的是伊甸，不是伊蕾娜。");
        else finishRoute("维克多。", "B-17 就是被认为已经阵亡的维克多，他与那张目标图有直接关系。");
      }));
    }, 700);
  }
}

function finishRoute(keyword, answer) {
  state.caseRecord = answer;
  renderInventory();
  refreshMenuSummary();
  state.mode = "end";
  $("#endKeyword").textContent = keyword;
  $("#endAnswer").textContent = answer;
  $("#endScreen").classList.remove("hidden");
}

function openMenu() {
  if (["start", "menu", "inventory", "qte", "choice", "flashback", "morse"].includes(state.mode)) return;
  state.resumeMode = state.mode;
  state.mode = "menu";
  refreshMenuSummary();
  menuOverlay.classList.remove("hidden");
}

function closeMenu() {
  if (state.mode !== "menu") return;
  menuOverlay.classList.add("hidden");
  state.mode = state.resumeMode;
}

function refreshMenuSummary() {
  $("#menuObjective").textContent = objective.textContent || "前往礼拜堂";
  $("#menuBell").textContent = `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ"][state.bellStage]} / Ⅶ`;
  $("#menuInventoryCount").textContent = `${state.inventory.size} / ${inventoryCatalog.length}`;
  $("#menuSound").querySelector("span").textContent = `声音：${state.sound ? "开" : "关"}`;
  $("#statReason").textContent = state.stats.reason;
  $("#statEmpathy").textContent = state.stats.empathy;
  $("#statControl").textContent = state.stats.control;
  $("#caseRecordText").textContent = state.caseRecord;
}

function openInventory(returnTarget = "game") {
  if (["qte", "choice", "flashback", "morse"].includes(state.mode)) return;
  if (returnTarget === "game") state.resumeMode = state.mode;
  state.inventoryReturn = returnTarget;
  state.mode = "inventory";
  menuOverlay.classList.add("hidden");
  renderInventory();
  inventoryOverlay.classList.remove("hidden");
}

function closeInventory() {
  if (state.mode !== "inventory") return;
  inventoryOverlay.classList.add("hidden");
  if (state.inventoryReturn === "menu") {
    state.mode = "menu";
    refreshMenuSummary();
    menuOverlay.classList.remove("hidden");
  } else state.mode = state.resumeMode;
}

function renderInventory() {
  inventoryGrid.replaceChildren();
  for (const item of inventoryCatalog) {
    const unlocked = state.inventory.has(item.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `inventoryCard${unlocked ? "" : " locked"}`;
    card.dataset.item = item.id;
    card.innerHTML = `<img src="${item.image}" alt=""><span><strong>${unlocked ? item.name : "未识别物"}</strong><small>${unlocked ? item.status : "线索尚未取得"}</small></span>`;
    if (unlocked) card.addEventListener("click", () => selectInventoryItem(item.id));
    inventoryGrid.append(card);
  }
  const first = inventoryCatalog.find(item => state.inventory.has(item.id));
  if (first) selectInventoryItem(first.id);
}

function selectInventoryItem(id) {
  const item = inventoryCatalog.find(entry => entry.id === id);
  if (!item || !state.inventory.has(id)) return;
  for (const card of inventoryGrid.querySelectorAll(".inventoryCard")) card.classList.toggle("selected", card.dataset.item === id);
  itemDetail.innerHTML = `<p class="eyebrow">当前证物</p><h3>${item.name}</h3><p>${item.description}</p><small>${item.status}</small>`;
}

function returnToTitle() {
  clearInterval(state.qteTimer);
  clearInterval(state.typeTimer);
  clearTimeout(state.flashbackTimer);
  stopRain();
  state.mode = "start";
  document.body.classList.remove("exploring");
  for (const overlay of [menuOverlay, inventoryOverlay, dialogueBox, qtePanel, choiceOverlay, flashbackOverlay, evidenceOverlay, morseOverlay, $("#endScreen")]) overlay.classList.add("hidden");
  $("#startScreen").classList.remove("hidden");
  introCover.classList.remove("hidden", "leaving");
  introCover.style.animation = "none";
  void introCover.offsetWidth;
  introCover.style.animation = "";
  window.setTimeout(() => $("#coverStart").focus(), 100);
  hidePortraits();
  sceneBg.src = ASSETS.map;
  sceneBg.style.opacity = "1";
}

function showDialogue(lines, onDone) {
  document.body.classList.remove("exploring");
  state.mode = "dialogue";
  state.dialogue = lines;
  state.dialogueIndex = 0;
  state.dialogueDone = onDone;
  canvas.style.display = "none";
  sceneBg.style.opacity = "1";
  dialogueBox.classList.remove("hidden");
  objective.classList.add("hidden");
  mapPrompt.classList.add("hidden");
  renderDialogueLine();
}

function renderDialogueLine() {
  const line = state.dialogue[state.dialogueIndex];
  if (!line) return finishDialogue();
  speakerName.textContent = line.speaker;
  state.fullLine = line.text;
  state.typing = true;
  dialogueText.textContent = "";
  clearInterval(state.typeTimer);
  let index = 0;
  state.typeTimer = setInterval(() => {
    index++;
    dialogueText.textContent = line.text.slice(0, index);
    if (index >= line.text.length) {
      clearInterval(state.typeTimer);
      state.typing = false;
    }
  }, 25);
  setActivePortrait(line.speaker);
}

function advanceDialogue() {
  if (state.mode !== "dialogue") return;
  if (state.typing) {
    clearInterval(state.typeTimer);
    dialogueText.textContent = state.fullLine;
    state.typing = false;
    return;
  }
  state.dialogueIndex++;
  if (state.dialogueIndex >= state.dialogue.length) finishDialogue();
  else renderDialogueLine();
}

function finishDialogue() {
  clearInterval(state.typeTimer);
  dialogueBox.classList.add("hidden");
  hidePortraits();
  const done = state.dialogueDone;
  state.dialogueDone = null;
  if (done) done();
}

function setActivePortrait(speaker) {
  const data = portraits[speaker];
  if (!data) return hidePortraits();
  const active = data.side === "left" ? portraitLeft : portraitRight;
  const inactive = data.side === "left" ? portraitRight : portraitLeft;
  if (!active.src.endsWith(data.src)) active.src = data.src;
  active.classList.add("visible", "active");
  inactive.classList.remove("visible", "active");
}

function hidePortraits() {
  portraitLeft.classList.remove("visible", "active");
  portraitRight.classList.remove("visible", "active");
}

function triggerBell(number, title, subtitle, onDone) {
  state.bellStage = number;
  bellCounter.textContent = `钟声 ${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ"][number]} / Ⅶ`;
  bellFlash.querySelector("strong").textContent = title;
  bellFlash.querySelector("small").textContent = subtitle;
  bellFlash.classList.remove("hidden");
  void bellFlash.offsetWidth;
  playBell(number);
  setTimeout(() => { bellFlash.classList.add("hidden"); if (onDone) onDone(); }, 1780);
}

function showLocation(text) {
  locationCard.querySelector("span").textContent = text;
  locationCard.classList.remove("hidden");
  void locationCard.offsetWidth;
  setTimeout(() => locationCard.classList.add("hidden"), 1950);
}

function drawExploration() {
  const cw = canvas.width, ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  if (images.map.complete) ctx.drawImage(images.map, -state.cameraX, 0, 4400, ch);
  const gradient = ctx.createLinearGradient(0, ch * .55, 0, ch);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(1, "#0307075c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, ch * .5, cw, ch * .5);
  const frameIndex = state.isMoving ? Math.floor(state.walkPhase) % 6 : 0;
  drawSheetFrame(images.evanSheet, (frameIndex + 2) % 6, state.followers.evan.x, state.followers.evan.y, 178, state.player.dir);
  drawSheetFrame(images.sophieSheet, (frameIndex + 1) % 6, state.followers.sophie.x, state.followers.sophie.y, 166, state.player.dir);
  drawSheetFrame(images.irenaSheet, frameIndex, state.player.x, state.player.y, 176, state.player.dir);
  const rainShift = performance.now() * .22;
  ctx.strokeStyle = "#bed2d83b";
  ctx.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const x = (i * 197 + rainShift) % (cw + 100) - 50, y = (i * 83 + rainShift * 1.9) % ch;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 9, y + 25);
    ctx.stroke();
  }
}

function drawSheetFrame(image, frameIndex, worldX, floorY, size, direction) {
  if (!image.complete) return;
  const cellW = image.width / 3, cellH = image.height / 2;
  const sx = (frameIndex % 3) * cellW, sy = Math.floor(frameIndex / 3) * cellH;
  const x = worldX - state.cameraX;
  ctx.save();
  ctx.translate(x + size / 2, floorY - size / 2);
  ctx.scale(direction < 0 ? -1 : 1, 1);
  ctx.drawImage(image, sx, sy, cellW, cellH, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function frame(now) {
  const dt = Math.min(.04, (now - lastTime) / 1000);
  lastTime = now;
  updateExploration(dt);
  if (state.mode === "explore") drawExploration();
  requestAnimationFrame(frame);
}

function initAudio() {
  if (!state.sound) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playBell(index) {
  if (!state.sound) return;
  initAudio();
  const now = audioContext.currentTime;
  [76, 113, 154].forEach((frequency, layer) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = layer ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency - index * 1.1, now);
    gain.gain.setValueAtTime(layer ? .08 : .18, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + 3.3 + layer * .4);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + layer * .015);
    oscillator.stop(now + 4);
  });
}

function playMorse(code) {
  if (!state.sound) return;
  initAudio();
  let time = audioContext.currentTime;
  for (const symbol of [...code.replaceAll(" ", "")]) {
    const duration = symbol === "—" ? .24 : .09;
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.frequency.value = 620;
    gain.gain.setValueAtTime(.08, time);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
    time += duration + .09;
  }
}

function startRain() {
  if (!state.sound || !audioContext || rainNode) return;
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), gain = audioContext.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = 540;
  gain.gain.value = .027;
  noise.connect(filter).connect(gain).connect(audioContext.destination);
  noise.start();
  rainNode = noise;
}

function stopRain() {
  if (!rainNode) return;
  try { rainNode.stop(); } catch (_) { }
  rainNode = null;
}

function toggleSound() {
  state.sound = !state.sound;
  try { localStorage.setItem(SOUND_KEY, state.sound ? "on" : "off"); } catch (_) { }
  $("#soundToggle").textContent = `声音：${state.sound ? "开" : "关"}`;
  $("#menuSound").querySelector("span").textContent = `声音：${state.sound ? "开" : "关"}`;
  if (!state.sound) stopRain();
  else { initAudio(); if (state.mode === "explore") startRain(); }
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    return data && data.version === 1 ? data : null;
  } catch (_) { return null; }
}

function saveProgress(phase) {
  const data = {
    version: 1, phase, savedAt: Date.now(), objective: objective.textContent,
    bellStage: state.bellStage, stats: { ...state.stats }, stability: state.stability,
    evanSupport: state.evanSupport, heardSyllable: state.heardSyllable,
    stimulusOff: state.stimulusOff, orderSeized: state.orderSeized,
    routeShortcut: state.routeShortcut, qteDuration: state.qteDuration,
    caseRecord: state.caseRecord, knifeChecked: state.knifeChecked,
    player: { ...state.player }, followers: JSON.parse(JSON.stringify(state.followers)),
    checkpoints: [...state.checkpoints], inventory: [...state.inventory], sound: state.sound
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) { }
}

function showIntroNotice(message) {
  introNotice.querySelector("span").textContent = message;
  introNotice.classList.remove("hidden");
  clearTimeout(showIntroNotice.timer);
  showIntroNotice.timer = setTimeout(() => introNotice.classList.add("hidden"), 2600);
}

function leaveCover(onDone) {
  if (introCover.classList.contains("leaving")) return;
  introCover.classList.add("leaving");
  window.setTimeout(() => {
    introCover.classList.add("hidden");
    introCover.classList.remove("leaving");
    introNotice.classList.add("hidden");
    if (onDone) onDone();
  }, 800);
}

function startNewGameFromCover() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { }
  leaveCover(startDemo);
}

function continueGameFromCover() {
  const saved = readProgress();
  if (!saved) {
    showIntroNotice("暂无可继续的进度，请先选择“开始游戏”。");
    return;
  }
  leaveCover(() => restoreProgress(saved));
}

function restoreProgress(saved) {
  stopRain();
  resetState();
  Object.assign(state, {
    bellStage: saved.bellStage || 3,
    stats: { reason: 0, empathy: 0, control: 0, ...saved.stats },
    stability: saved.stability || 0, evanSupport: saved.evanSupport || 0,
    heardSyllable: Boolean(saved.heardSyllable), stimulusOff: Boolean(saved.stimulusOff),
    orderSeized: Boolean(saved.orderSeized), routeShortcut: Boolean(saved.routeShortcut),
    qteDuration: saved.qteDuration || 5000, caseRecord: saved.caseRecord || "尚未得到足以记录的答案。",
    knifeChecked: Boolean(saved.knifeChecked), player: { ...state.player, ...saved.player },
    followers: saved.followers || state.followers, checkpoints: new Set(saved.checkpoints || []),
    inventory: new Set(saved.inventory || ["medical-records"]), sound: saved.sound !== false
  });
  document.body.classList.remove("exploring");
  for (const overlay of [menuOverlay, inventoryOverlay, evidenceOverlay, morseOverlay, choiceOverlay, qtePanel, flashbackOverlay, dialogueBox, $("#endScreen")]) overlay.classList.add("hidden");
  $("#startScreen").classList.add("hidden");
  $("#menuToggle").disabled = false;
  sceneBg.src = ASSETS.map;
  sceneBg.style.filter = "brightness(.58) saturate(.72) contrast(1.08)";
  sceneBg.style.opacity = "1";
  bellCounter.textContent = `钟声 ${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ"][state.bellStage]} / Ⅶ`;
  renderInventory();
  refreshMenuSummary();
  initAudio();
  if (saved.phase === "chapel") enterChapel();
  else {
    enterExploration();
    if (saved.objective) objective.textContent = saved.objective;
  }
}

document.addEventListener("keydown", event => {
  if (introCover && !introCover.classList.contains("hidden")) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyI", "Escape"].includes(event.code)) event.preventDefault();
    return;
  }
  const controlled = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyI", "Escape"];
  if (controlled.includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.repeat) return;
  if (event.code === "Escape") {
    if (state.mode === "inventory") closeInventory();
    else if (state.mode === "menu") closeMenu();
    else openMenu();
    return;
  }
  if (event.code === "KeyI") {
    if (state.mode === "inventory") closeInventory();
    else if (state.mode !== "start") openInventory("game");
    return;
  }
  if (event.code === "KeyE") interact();
  if ((event.code === "Space" || event.code === "Enter") && state.mode === "dialogue") advanceDialogue();
  else if (event.code === "Space" && state.mode === "flashback" && state.flashbackAdvance) state.flashbackAdvance();
  else if (event.code === "Space" && state.mode === "morse") morseTap();
});
document.addEventListener("keyup", event => keys.delete(event.code));

dialogueBox.addEventListener("click", advanceDialogue);
$("#coverStart").addEventListener("click", startNewGameFromCover);
$("#coverContinue").addEventListener("click", continueGameFromCover);
$("#coverSave").addEventListener("click", () => {
  const saved = readProgress();
  if (!saved) return showIntroNotice("暂无存档。游戏会在关键调查节点自动保存。");
  const time = new Date(saved.savedAt).toLocaleString("zh-CN", { hour12: false });
  showIntroNotice(`自动存档 · 第 ${saved.bellStage || 3} 声 · ${time}`);
});
$("#coverSettings").addEventListener("click", () => {
  toggleSound();
  showIntroNotice(`声音已${state.sound ? "开启" : "关闭"}。`);
});
$("#coverExit").addEventListener("click", () => showIntroNotice("浏览器试玩版不会强制关闭窗口，你可以直接关闭当前页面。"));
$("#flashbackSkip").addEventListener("click", event => { event.stopPropagation(); if (state.flashbackAdvance) state.flashbackAdvance(); });
flashbackOverlay.addEventListener("click", () => { if (state.flashbackAdvance) state.flashbackAdvance(); });
$("#startButton").addEventListener("click", startDemo);
$("#restartButton").addEventListener("click", startDemo);
$("#soundToggle").addEventListener("click", toggleSound);
$("#menuToggle").addEventListener("click", openMenu);
$("#menuClose").addEventListener("click", closeMenu);
$("#resumeGame").addEventListener("click", closeMenu);
$("#openInventory").addEventListener("click", () => openInventory("menu"));
$("#inventoryClose").addEventListener("click", closeInventory);
$("#menuSound").addEventListener("click", toggleSound);
$("#restartFromMenu").addEventListener("click", startDemo);
$("#returnToTitle").addEventListener("click", returnToTitle);
$("#endInventoryButton").addEventListener("click", () => openInventory("game"));
$("#morseTap").addEventListener("click", morseTap);

for (const button of document.querySelectorAll("#mobileControls button")) {
  const code = button.dataset.key;
  const down = event => { event.preventDefault(); keys.add(code); if (code === "KeyE") interact(); };
  const up = event => { event.preventDefault(); keys.delete(code); };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("pointerleave", up);
  button.addEventListener("click", () => {
    if (state.mode !== "explore") return;
    if (code === "ArrowRight") { state.player.dir = 1; state.player.x = clamp(state.player.x + 170, 130, 4380); state.mobileKickUntil = performance.now() + 420; }
    if (code === "ArrowLeft") { state.player.dir = -1; state.player.x = clamp(state.player.x - 170, 130, 4380); state.mobileKickUntil = performance.now() + 420; }
  });
}

window.setTimeout(() => { if (!introCover.classList.contains("hidden")) $("#coverStart").focus(); }, 250);

requestAnimationFrame(frame);
