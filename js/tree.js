Vue.component("milestones-container", {
	props: ["layer", "data"],
	computed: {
		key() {
			return this.$vnode.key;
		}
	},
	template: `
	<div class="upgTable instant">
		<div class="upgCol milestones-container">
			<div v-for="(item, index) in data">
				<div v-if="!Array.isArray(item)" v-bind:is="item" :layer= "layer" v-bind:style="tmp[layer].componentStyles[item]" :key="key + '-' + index"></div>
				<div v-else-if="item.length==3" v-bind:style="[tmp[layer].componentStyles[item[0]], (item[2] ? item[2] : {})]" v-bind:is="item[0]" :layer= "layer" :data= "item[1]" :key="key + '-' + index"></div>
				<div v-else-if="item.length==2" v-bind:is="item[0]" :layer= "layer" :data= "item[1]" v-bind:style="tmp[layer].componentStyles[item[0]]" :key="key + '-' + index"></div>
			</div>
		</div>
	</div>
	`
});

var layoutInfo = {
	startTab: "none",
	showTree: true,
	treeLayout: ""
};

function getCurrentColor(mix = 1) {
	const max = player.red.max(player.green).max(player.blue).div(mix);
	if (max.eq(0)) {
		return "black";
	}
	return `rgb(${player.red.div(max).times(255).floor().toFixed(0)}, ${player.green.div(max).times(255).floor().toFixed(0)}, ${player.blue.div(max).times(255).floor().toFixed(0)})`;
}

// TODO cache only needs 3 most recent values
let fibCache = {};
// Note: working with integers here, so don't go making e308 "levels"
function getFib(n) {
	if (n <= 1) {
		return n;
	}
	if (!(n in fibCache)) {
		fibCache[n] = getFib(n - 1) + getFib(n - 2);
	}
	return fibCache[n];
}

function maxColor(color) {
	const newValue = player.points.add(player[color]).sub(player.red.add(player.green).add(player.blue));
	if (color === "blue") {
		new Array(newValue.div(5).ceil().toNumber()).fill(1).forEach((_,i) => {
			player.color.batteries[i] = {
				active: false,
				progress: 0,
				lastActive: -1
			};
		});
	}
	player[color] = newValue;
}

function addColor(color) {
	if (player.points.sub(player.red).sub(player.green).sub(player.blue).lte(0)) {
		return;
	}
	const newValue = player[color].add(1);
	if (color === "blue") {
		new Array(newValue.div(5).ceil().toNumber()).fill(1).forEach((_,i) => {
			player.color.batteries[i] = {
				active: false,
				progress: 0,
				lastActive: -1
			};
		});
	}
	player[color] = newValue;
}

function subColor(color) {
	player[color] = player[color].sub(1).max(0);
}

function minColor(color) {
	player[color] = new Decimal(0);
}

function hasYellowEffect(amount) {
	return player.points.gte(10) && player.red.min(player.green).sqrt().floor().gte(amount);
}

function hasCyanEffect(amount) {
	return player.points.gte(15) && player.green.min(player.blue).sqrt().floor().gte(amount);
}

function hasMagentaEffect(amount) {
	return player.points.gte(20) && player.blue.min(player.red).sqrt().floor().gte(amount);
}

function getTotalSecondaryLight() {
	let amount = new Decimal(0);
	if (player.points.gte(10)) {
		amount = amount.add(player.red.min(player.green).sqrt().floor());
	}
	if (player.points.gte(15)) {
		amount = amount.add(player.red.min(player.green).sqrt().floor());
	}
	if (player.points.gte(20)) {
		amount = amount.add(player.blue.min(player.red).sqrt().floor());
	}
	return amount;
}

const piString = `
3.14159265358979323846264338327950288419716939937510
  58209749445923078164062862089986280348253421170679
  82148086513282306647093844609550582231725359408128
  48111745028410270193852110555964462294895493038196
  44288109756659334461284756482337867831652712019091
  45648566923460348610454326648213393607260249141273
  72458700660631558817488152092096282925409171536436
  78925903600113305305488204665213841469519415116094
  33057270365759591953092186117381932611793105118548
  07446237996274956735188575272489122793818301194912
  98336733624406566430860213949463952247371907021798
  60943702770539217176293176752384674818467669405132
  00056812714526356082778577134275778960917363717872
  14684409012249534301465495853710507922796892589235
  42019956112129021960864034418159813629774771309960
  51870721134999999837297804995105973173281609631859
  50244594553469083026425223082533446850352619311881
  71010003137838752886587533208381420617177669147303
  59825349042875546873115956286388235378759375195778
  18577805321712268066130019278766111959092164201989`.replace(/\s+/g, "");
const tauString = `
6.28318530717958647692528676655900576839433879875021
  16419498891846156328125724179972560696506842341359
  64296173026564613294187689219101164463450718816256
  96223490056820540387704221111928924589790986076392
  88576219513318668922569512964675735663305424038182
  91297133846920697220908653296426787214520498282547
  44917401321263117634976304184192565850818343072873
  57851807200226610610976409330427682939038830232188
  66114540731519183906184372234763865223586210237096
  14892475992549913470377150544978245587636602389825
  96673467248813132861720427898927904494743814043597
  21887405541078434352586353504769349636935338810264
  00113625429052712165557154268551557921834727435744
  29368818024499068602930991707421015845593785178470
  84039912224258043921728068836319627259549542619921
  03741442269999999674595609990211946346563219263719
  00489189106938166052850446165066893700705238623763
  42020006275677505773175066416762841234355338294607
  19650698085751093746231912572776470757518750391556
  37155610643424536132260038557532223918184328403978`.replace(/\s+/g, "");
const redEffectCache = {};
function getRedColorEffect(amount, applyUpgrades = true) {
	if (amount == null) {
		amount = player.red.toNumber();
	}
	if (amount === 0) {
		return { base: new Decimal(0), multi: new Decimal(1) };
	}

	const exponent = hasUpgrade("color", 21) && applyUpgrades ? upgradeEffect("color", 21).add(1) : 1;
	const digit = parseInt((hasYellowEffect(1) ? tauString : piString).charAt(amount === 1 ? 0 : amount));
	if (!(amount in redEffectCache)) {
		const prevEffect = Object.assign({}, getRedColorEffect(amount - 1, false));
		if (digit === 0) {
			prevEffect.multi = prevEffect.multi.times(10);
		} else if (digit === 1) {
			prevEffect.base = prevEffect.base.add(1);
		} else {
			prevEffect.multi = prevEffect.multi.times(digit);
		}
		redEffectCache[amount] = prevEffect;
	}

	let display;
	if (digit === 0) {
		display = `Multiply color energy gain by ${formatWhole(Decimal.pow(10, exponent))}.`;
	} else if (digit === 1) {
		display = `Increase color energy base gain by ${formatWhole(exponent)}.`;
	} else {
		display = `Multiply color energy gain by ${formatWhole(Decimal.pow(digit, exponent))}.`;
	}

	return {
		multi: Decimal.pow(redEffectCache[amount].multi, exponent),
		base: Decimal.times(redEffectCache[amount].base, exponent),
		display
	};
}

function getBlueColorEffect(amount, applyUpgrades = true) {
	if (amount == null) {
		amount = player.blue;
	}
	amount = new Decimal(amount);
	if (amount.eq(0)) {
		return new Decimal(0);
	}
	amount = amount.times(Decimal.pow(2, amount)).sub(1);
	if (hasUpgrade("color", 8) && applyUpgrades) {
		amount = amount.times(upgradeEffect("color", 8));
	}
	if (hasYellowEffect(2) && applyUpgrades) {
		amount = amount.times(layers.color.buyables[3].getLevel().max(1));
	}
	return amount;
}

function getNumBatteries() {
	let numBatteries = player.blue.div(5);
	if (hasYellowEffect(3)) {
		numBatteries = numBatteries.add(player.red.max(1).sqrt());
	}
	return numBatteries.ceil();
}

const effectDisplayCache = {
	red: {
		amount: null,
		points: null,
		display: null
	},
	green: {
		amount: null,
		points: null,
		display: null
	},
	blue: {
		amount: null,
		points: null,
		display: null
	},
	yellow: {
		amount: null,
		points: null,
		display: null
	},
	cyan: {
		amount: null,
		points: null,
		display: null
	},
	magenta: {
		amount: null,
		points: null,
		display: null
	}
};
function getColorEffectDisplay(color, amount = player[color]) {
	if (amount.neq(effectDisplayCache[color].amount) || player.points.neq(effectDisplayCache[color].points)) {
		let getEffectDisplay;
		if (color === "red") {
			getEffectDisplay = i => getRedColorEffect(i, false).display;
		} else if (color === "green") {
			getEffectDisplay = i => i in layers.color.upgrades ? `Unlocks <b>"${layers.color.upgrades[i].title}"</b> upgrade.` : i in layers.color.buyables ? `Unlocks <b>"${layers.color.buyables[i].title}"</b> buyable.` : Decimal.lt(i, 13) ? "Add a free level to <b>\"Alhazen\"</b>." : Decimal.lt(i, 55) ? "Add a free level to <b>\"Newton\"</b>." : "Add a free level to <b>\"Einstein\".</b>";
		} else if (color === "blue") {
			getEffectDisplay = i => (i - 1) % 5 === 0 ? `Raise battery cap to ${formatWhole(getBlueColorEffect(i, false))} and unlock a battery` : `Raise battery cap to ${formatWhole(getBlueColorEffect(i, false))}`;
		} else if (color === "yellow") {
			getEffectDisplay = i => ({
				1: "Red light's effects are based on τ instead of 𝜋",
				2: "Battery cap is multiplied by number of <b>\"Alhazen\"</b> levels",
				3: "Get sqrt(red light) more batteries",
				4: "Each point of secondary colored light gives a free <b>\"Newton\"</b> level",
				5: "Color gain effect is multiplied by battery cap"
			}[i]);
		} else if (color === "cyan") {
			getEffectDisplay = i => ({
				1: "Automatically purchase upgrades",
				2: "Batteries act as if they're being charged for an extra quarter second for each secondary colored light",
				3: "Automatically purchase buyables",
				4: "Even batteries charge themselves",
				5: "Odd batteries charge themselves"
			}[i]);
		} else if (color === "magenta") {
			getEffectDisplay = i => ({
				1: "Lower goal by 1 level for each magenta light",
				2: "Divide goal by amount of secondary light",
				3: "Allow bulk completion of up to 10 light at once",
				4: "Lower goal by 1 level for each upgrade purchased",
				5: "Lower goal by 1 level for each battery"
			}[i]);
		}
		let numEffects = player.points;
		if (!(color in player)) {
			numEffects = numEffects.min(player.points.div(2).sqrt().floor()).min(5);
		}
		effectDisplayCache[color] = {
			amount: amount,
			points: player.points,
			display: `<div class="effectDisplay ${color}">
				${new Array(numEffects.toNumber()).fill(0).reduce((acc,curr,i) => acc + `<div style="color: ${amount.gt(i) ? "white" : "grey"};">
					<span style="width: 40px; display: inline-block;">${i + 1}</span><span>${getEffectDisplay(i + 1)}</span>
				</div>`, "")}
			</div>`
		};
	}
	return effectDisplayCache[color].display;
}

function getPrimaryColor(color, requiredLevel, description) {
	if (player.points.lt(requiredLevel)) {
		return undefined;
	}
	const totalColor = player.red.add(player.green).add(player.blue);
	return ["row", [
		["bar", color],
		["column", [
			["blank", "312px"],
			["display-text", `<button onclick="maxColor('${color}')" style="${inChallenge("tree-tab", 1) ? "display: none; " : ""}${player.points.gt(totalColor) ? `background-color: ${colors[color]};` : ""}" class="smallUpg ${player.points.gt(totalColor) ? "can" : "locked"}">${player.points.add(player[color]).sub(totalColor)}</button>`],
			["display-text", `<button onclick="addColor('${color}')" style="${inChallenge("tree-tab", 1) ? "display: none; " : ""}${player.points.gt(totalColor) ? `background-color: ${colors[color]};` : ""}" class="smallUpg ${player.points.gt(totalColor) ? "can" : "locked"}">+</button>`],
			["display-text", `<button onclick="subColor('${color}')" style="${inChallenge("tree-tab", 1) ? "display: none; " : ""}${player[color].gt(0) ? `background-color: ${colors[color]};` : ""}" class="smallUpg ${player[color].gt(0) ? "can" : "locked"}">-</button>`],
			["display-text", `<button onclick="minColor('${color}')" style="${inChallenge("tree-tab", 1) ? "display: none; " : ""}${player[color].gt(0) ? `background-color: ${colors[color]};` : ""}" class="smallUpg ${player[color].gt(0) ? "can" : "locked"}">0</button>`]
		]],
		["column", [
			"blank",
			["display-text", `<div style="text-align: left"><h2 style="color: ${colors[color]};">${color.charAt(0).toUpperCase() + color.slice(1)}</h2><span style="color: grey; margin-left: 8px;">${description}</span></div>`],
			"blank",
			["display-text", getColorEffectDisplay(color)]
		]]
	]];
}

function getSecondaryColor(color, component1, component2, requiredLevel, description) {
	if (player.points.lt(requiredLevel)) {
		return undefined;
	}
	const totalColor = player.red.add(player.green).add(player.blue);
	const secondaryColor = Decimal.min(player[component1], player[component2]).sqrt().floor();
	const nextAt = secondaryColor.add(1).pow(2);
	return ["row", [
		["bar", color],
		inChallenge("tree-tab", 1) ? "blank" : ["blank", ["40px", "40px"]],
		["column", [
			"blank",
			["display-text", `<div style="text-align: left"><h2 style="color: ${colors[color]};">${color.charAt(0).toUpperCase() + color.slice(1)}</h2><span style="color: grey; margin-left: 8px;">${description}</span></div>`],
			nextAt.gt(50) ? null : ["display-text", `<div style="text-align: left; color: grey">Next at ${formatWhole(nextAt)} each of ${component1} and ${component2} light</div>`],
			"blank",
			["display-text", getColorEffectDisplay(color, secondaryColor)]
		]]
	]];
}

function getPrimaryColorBar(color) {
	return {
		direction: UP,
		width: 40,
		height: 500,
		progress: () => {
			if (player[color].eq(0)) {
				return 0;
			}
			return player[color].div(player.points);
		},
		style: {
			marginBottom: "16px"
		},
		fillStyle: { backgroundColor: colors[color] },
		borderStyle: { borderColor: "white" }
	};
}

function getSecondaryColorBar(color, component1, component2) {
	return {
		direction: UP,
		width: 40,
		height: 500,
		progress: () => {
			let amount = Decimal.min(player[component1], player[component2]).sqrt().floor();
			if (amount.eq(0)) {
				return 0;
			}
			return amount.div(player.points.div(2).sqrt().floor().min(5));
		},
		style: {
			marginBottom: "16px"
		},
		fillStyle: { backgroundColor: colors[color] },
		borderStyle: { borderColor: "white" }
	};
}

addLayer("tree-tab", {
	tabFormat: () => [
		["display-text", `You have <h2 class="lightDisplay">${player.points}</h2> light`],
		player.points.gt(0) ? ["display-text", `You have <h3 class="lightDisplay">${player.points.sub(player.red).sub(player.green).sub(player.blue)}</h2> unspent light<br/>`] : null,
		"blank",
		inChallenge("tree-tab", 1) ? null : ["challenge", 1],
		"blank",
		/*player.points.eq(0) ? ["blank", [0, "550px"]] : */["row", [
			getPrimaryColor("red", 1, "improves color energy gain directly"),
			getPrimaryColor("green", 3, "unlocks various useful upgrades"),
			getPrimaryColor("blue", 5, "unlocks batteries that actively increase base gain"),
			getSecondaryColor("yellow", "red", "green", 10, "passively increases color gain"),
			getSecondaryColor("cyan", "green", "blue", 15, "automates mechanics"),
			getSecondaryColor("magenta", "blue", "red", 20, "lowers goal requirements")
		].filter(x => x !== undefined)],
		"blank",
		["milestones-container", [
			["row", [["milestone", 0], ["milestone", 1], ["milestone", 2]]],
			["row", [["milestone", 3], ["milestone", 4], ["milestone", 5]]],
			["milestone", 6]
		]]
	],
	update() {
		if (player.points.sub(player.red).sub(player.green).sub(player.blue).lt(0)) {
			player.red = new Decimal(0);
			player.green = new Decimal(0);
			player.blue = new Decimal(0);
		}
	},
	challenges: {
		1: {
			name: "Get more color",
			unlocked: true,
			completionLimit: 10,
			fullDisplay() {
				if (hasMagentaEffect(3) && inChallenge(this.layer, this.id) && this.canComplete()) {
					const completions = this.canComplete();
					return `Start gathering color energy to produce a new light<br/><br/>Exit now to get <span style="text-shadow: 0 0 10px white;">${completions}</span> light${completions === 10 ? "" : `<br/>Next at: ${formatWhole(this.goal(player.points.add(completions)))} color energy`}`;
				}
				return `Start gathering color energy to produce a new light<br/><br/>Goal: ${formatWhole(this.goal())} color energy`;
			},
			goal(level) {
				if (level == null) {
					level = player.points;
				}
				level = level.add(1);
				if (hasMagentaEffect(1)) {
					level = level.sub(player.blue.min(player.red).sqrt().floor());
				}
				if (hasMagentaEffect(4)) {
					level = level.sub(player.color.upgrades.length);
				}
				if (hasMagentaEffect(5)) {
					level = level.sub(getNumBatteries());
				}
				let goal = softcap(level.max(1), new Decimal(50), new Decimal(2)).factorial();
				if (hasUpgrade("color", 2)) {
					goal = goal.div(upgradeEffect("color", 2));
				}
				if (hasMagentaEffect(2)) {
					goal = goal.div(getTotalSecondaryLight());
				}
				return goal;
			},
			canComplete() {
				let completions = 0;
				if (!hasMagentaEffect(3)) {
					return player.color.points.gte(this.goal());
				}
				while (player.color.points.gte(this.goal(player.points.add(completions))) && completions < 10) {
					completions++;
				}
				return completions;
			},
			onStart() {
				layerDataReset("color");
				new Array(player.blue.div(5).ceil().times(2).max(1).sub(1).toNumber()).fill(1).forEach((_,i) => {
					player.color.batteries[i] = {
						active: false,
						progress: 0,
						lastActive: -1
					};
				});
				showTab("color");
			},
			onExit() {
				layerDataReset("color");
				showTab("none");
			},
			onComplete() {
				layerDataReset("color");
				showTab("none");
				player.points = player.points.add(player[this.layer].challenges[this.id]);
				player[this.layer].challenges[this.id] = 0;
			}
		}
	},
	bars: {
		red: getPrimaryColorBar("red"),
		green: getPrimaryColorBar("green"),
		blue: getPrimaryColorBar("blue"),
		yellow: getSecondaryColorBar("yellow", "red", "green"),
		cyan: getSecondaryColorBar("cyan", "green", "blue"),
		magenta: getSecondaryColorBar("magenta", "blue", "red")
	},
	milestones: {
		0: {
			title: "Unlock red",
			requirementDescription: "1 Light",
			done: () => player.points.gte(1)
		},
		1: {
			title: "Unlock green",
			requirementDescription: "3 Light",
			done: () => player.points.gte(3),
			unlocked: () => hasMilestone("tree-tab", 0)
		},
		2: {
			title: "Unlock blue",
			requirementDescription: "5 Light",
			done: () => player.points.gte(5),
			unlocked: () => hasMilestone("tree-tab", 1)
		},
		3: {
			title: "Unlock yellow",
			requirementDescription: "10 light",
			done: () => player.points.gte(10),
			unlocked: () => hasMilestone("tree-tab", 2)
		},
		4: {
			title: "Unlock cyan",
			requirementDescription: "15 light",
			done: () => player.points.gte(15),
			unlocked: () => hasMilestone("tree-tab", 3)
		},
		5: {
			title: "Unlock magenta",
			requirementDescription: "20 light",
			done: () => player.points.gte(20),
			unlocked: () => hasMilestone("tree-tab", 4)
		},
		6: {
			title: "Win the game!",
			requirementDescription: "69 light",
			done: () => player.points.gte(69),
			unlocked: () => hasMilestone("tree-tab", 5)
		}
	}
});
