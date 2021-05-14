Vue.component("charger", {
	props: ["layer", "data"],
	template: `
	<button
		v-bind:class="{ upg: true, can: true }"
		v-bind:style="{'background-color': data.color, color: 'white', width: '100px', height: '100px'}"
		v-on="handlers">
		<span><h2>Hover to Charge Battery</h2><br></span>
	</button>
	`,
	data() {
		const index = this.data.index;
		const touchstart = () => {
			player.color.batteries[index].active = true;
		};
		const touchend = () => {
			player.color.batteries[index].active = false;
		};
		const handlers = {
			mouseenter: touchstart,
			touchstart: touchstart,
			touchend: touchend,
			mouseleave: touchend
		};
		return { handlers };
	}
});

Vue.component("battery", {
	props: ["layer", "data"],
	template: `<div class="battery">
		<svg v-bind:style="{height: ((player.color.batteries[data] && player.color.batteries[data].progress) || 0) * maxHeight + margin * 2 + 'px'}">
			<defs>
				<filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
		      		<feDropShadow dx="0" dy="0" stdDeviation="3"></feDropShadow>
		    	</filter>
		  	</defs>
		  	<path style="filter:url(#glow)" d="M10,0 L100,0"/>
		</svg>
	</div>`
});

Vue.component("tree-tab-challenge", {
	props: ["layer", "data"],
	template: "<challenge :layer=\"'tree-tab'\" :data=\"data\"/>"
});

Vue.component("buyMax", {
	props: ["layer", "data"],
	template: `<div v-if="tmp[layer].buyables && tmp[layer].buyables[data]!== undefined && tmp[layer].buyables[data].unlocked">
		<button v-bind:class="{ buyMax: true, can: layers[layer].buyables[data].canAfford(), locked: layers[layer].buyables[data].canAfford() }" v-bind:style="{ background: tmp[layer].buyables[data].color }" v-on:click="layers[layer].buyables[data].buyMax()">Buy Max</button>
	</div>`
});

addLayer("color", {
	name: "color",
	resource: "color energy",
	color: "white",
	startData() {
		return {
			points: new Decimal(0),
			// vue is giving me trouble, so I had to do this...
			// hope I don't need over 100 batteries (end game should have 14)
			batteries: new Array(100).fill(1).reduce((acc,curr,i) => {
				acc[i] = {
					active: false,
					progress: 0,
					lastActive: 0
				};
				return acc;
			}, {})
		};
	},
	getResetGain() {
		let { base, multi } = getRedColorEffect();
		let gain = new Decimal(0.1).add(base);
		let batteryGain = new Decimal(0);
		for (const index in player.color.batteries) {
			batteryGain = batteryGain.add(player.color.batteries[index].progress);
		}
		gain = gain.add(batteryGain.times(getBlueColorEffect()));
		gain = gain.times(multi);
		if (hasUpgrade(this.layer, 1)) {
			gain = gain.times(5);
		}
		if (hasUpgrade(this.layer, 5)) {
			gain = gain.times(upgradeEffect(this.layer, 5));
		}
		gain = gain.times(buyableEffect("color", 3));
		if (hasYellowEffect(5)) {
			gain = gain.times(getBlueColorEffect()).max(1);
		}
		gain = gain.pow(buyableEffect("color", 55));
		return gain;
	},
	update(diff) {
		for (const index in player.color.batteries) {
			const battery = player.color.batteries[index];
			let gain = new Decimal(diff);
			if (battery.active || (index % 2 === 1 && hasCyanEffect(4)) || (index % 2 === 0 && hasCyanEffect(5))) {
				gain = gain.div(10);
				gain = gain.times(buyableEffect("color", 13));
				battery.lastActive = 0;
			} else if (hasCyanEffect(2) && battery.lastActive >= 0 && battery.lastActive < getTotalSecondaryLight().div(4)) {
				gain = gain.div(10);
				gain = gain.times(buyableEffect("color", 13));
				battery.lastActive = battery.lastActive + diff;
			} else {
				gain = gain.times(-1).div(20);
				gain = gain.div(buyableEffect("color", 13));
				battery.lastActive = -1;
			}
			battery.progress = new Decimal(battery.progress).add(gain).clamp(0, 1).toNumber();
		}
	},
	automate() {
		if (hasCyanEffect(1)) {
			for (id in tmp[this.layer].upgrades) {
				if (isPlainObject(tmp[this.layer].upgrades[id]) && (layers[this.layer].upgrades[id].canAfford === undefined || layers[this.layer].upgrades[id].canAfford() === true)) {
					buyUpg(this.layer, id);
				}
			}
			if (hasCyanEffect(3)) {
				for (id in layers[this.layer].buyables) {
					/*
					if (layers[this.layer].buyables[id].buyMax) {
						layers[this.layer].buyables[id].buyMax();
					}
					*/
					if (isPlainObject(tmp[this.layer].buyables[id]) && (layers[this.layer].buyables[id].canAfford === undefined || layers[this.layer].buyables[id].canAfford() === true)) {
						buyBuyable(this.layer, id);
					}
				}
			}
		}
	},
	passiveGeneration: new Decimal(1),
	tabFormat: () => [
		["tree-tab-challenge", 1],
		"blank",
		["display-text", `You have <h2 style="color: ${getCurrentColor()}; text-shadow: ${getCurrentColor()} 0 0 10px">${format(player.color.points)}</h2> color energy`],
		"blank",
		["display-text", `You are collecting <span style="color: ${getCurrentColor()}; text-shadow: ${getCurrentColor()} 0 0 10px">${format(tmp.color.getResetGain)}</span> color energy per second`],
		"blank",
		["row", [["upgrade", 1], ["upgrade", 5], ["upgrade", 21]]],
		["row", [["upgrade", 2], ["upgrade", 8], ["upgrade", 34]]],
		"blank",
		["row", [["buyable", 3], ["buyable", 13], ["buyable", 55]]],
		["row", [["buyMax", 3], ["buyMax", 13], ["buyMax", 55]]],
		"blank",
		["row", new Array(getNumBatteries().times(2).max(1).sub(1).toNumber()).fill(1).map((_, i) => i % 2 === 0 ? ["column", [
			["charger", { index: i, color: getCurrentColor(.5) }],
			"blank",
			["display-text", `+${format(new Decimal((player.color.batteries[i] && player.color.batteries[i].progress) || 0).times(getBlueColorEffect()))}`],
			["battery", i],
			["blank", "34px"]
		]] : "blank")]
	],
	buyables: {
		3: {
			title: "Alhazen",
			display() {
				return `<br/>Rebuyable. Double color energy gain.<br/><br/>Currently: x${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} color energy`;
			},
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			cost(x) {
				const amount = x || getBuyableAmount(this.layer, this.id);
				return new Decimal(100).times(new Decimal(10).pow(amount));
			},
			effect() {
				return new Decimal(2).pow(this.getLevel());
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			buyMax() {
				const amount = getBuyableAmount(this.layer, this.id);
				const costExponent = new Decimal(10);
				const baseCost = new Decimal(100);
				const amountAffordable = player[this.layer].points.times(costExponent.sub(1)).div(new Decimal(baseCost).times(Decimal.pow(costExponent, amount))).add(1).log(costExponent).floor();
				const cost = baseCost.times(costExponent.pow(amount).times(costExponent.pow(amountAffordable).sub(1))).div(costExponent.sub(1));
				player[this.layer].points = player[this.layer].points.sub(cost);
				setBuyableAmount(this.layer, this.id, amount.add(amountAffordable));
			},
			unlocked() {
				return player.green.gte(this.id);
			},
			getLevel() {
				let amount = getBuyableAmount(this.layer, this.id);
				amount = amount.add(Decimal.clamp(player.green.sub(3), 0, 1));
				amount = amount.add(Decimal.clamp(player.green.sub(5), 0, 2));
				amount = amount.add(Decimal.clamp(player.green.sub(8), 0, 4));
				if (hasUpgrade("color", 34)) {
					amount = amount.add(layers.color.buyables["13"].getLevel());
				}
				return amount;
			}
		},
		13: {
			title: "Newton",
			display() {
				return `<br/>Rebuyable. Batteries charge 10% faster and deplete 10% slower.<br/><br/>Currently: x${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} color energy`;
			},
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			cost(x) {
				const amount = x || getBuyableAmount(this.layer, this.id);
				return new Decimal(1000).times(new Decimal(25).pow(amount));
			},
			effect() {
				return this.getLevel().times(0.1).add(1);
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			buyMax() {
				const amount = getBuyableAmount(this.layer, this.id);
				const costExponent = new Decimal(25);
				const baseCost = new Decimal(1000);
				const amountAffordable = player[this.layer].points.times(costExponent.sub(1)).div(new Decimal(baseCost).times(Decimal.pow(costExponent, amount))).add(1).log(costExponent).floor();
				const cost = baseCost.times(costExponent.pow(amount).times(costExponent.pow(amountAffordable).sub(1))).div(costExponent.sub(1));
				player[this.layer].points = player[this.layer].points.sub(cost);
				setBuyableAmount(this.layer, this.id, amount.add(amountAffordable));
			},
			unlocked() {
				return player.green.gte(this.id);
			},
			getLevel() {
				let amount = getBuyableAmount(this.layer, this.id);
				amount = amount.add(Decimal.clamp(player.green.sub(13), 0, 7));
				amount = amount.add(Decimal.clamp(player.green.sub(21), 0, 12));
				amount = amount.add(Decimal.clamp(player.green.sub(34), 0, 20));
				if (hasUpgrade("color", 34)) {
					amount = amount.add(layers.color.buyables["55"].getLevel());
				}
				if (hasYellowEffect(4)) {
					amount = amount.add(getTotalSecondaryLight);
				}
				return amount;
			}
		},
		55: {
			title: "Einstein",
			display() {
				return `<br/>Rebuyable. Add 0.01 to the color gain exponent.<br/><br/>Currently: ^${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} color energy`;
			},
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			cost(x) {
				const amount = x || getBuyableAmount(this.layer, this.id);
				return new Decimal(1e21).tetrate(amount.div(100).add(1));
			},
			effect() {
				return this.getLevel().times(0.01).add(1);
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			buyMax() {
				/* TODO how to buy max a tetration formula
				const amount = getBuyableAmount(this.layer, this.id);
				const costExponent = new Decimal(100);
				const baseCost = new Decimal(1e21);
				const amountAffordable = player[this.layer].points.times(costExponent.sub(1)).div(new Decimal(baseCost).times(Decimal.pow(costExponent, amount))).add(1).log(costExponent).floor();
				const cost = baseCost.times(costExponent.pow(amount).times(costExponent.pow(amountAffordable).sub(1))).div(costExponent.sub(1));
				player[this.layer].points = player[this.layer].points.sub(cost);
				setBuyableAmount(this.layer, this.id, amount.add(amountAffordable));
				*/
				// Since it tetrates this will hopefully be fine
				while (this.canAfford()) {
					this.buy();
				}
			},
			unlocked() {
				return player.green.gte(this.id);
			},
			getLevel() {
				let amount = getBuyableAmount(this.layer, this.id);
				amount = amount.add(Decimal.max(player.green.sub(55), 0));
				return amount;
			}
		},
	},
	upgrades: {
		1: {
			title: "Corpuscular theory",
			description: "<br/>Multiply color energy gain by 5",
			cost: new Decimal(1),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			}
		},
		2: {
			title: "Double Slit Experiment",
			description: "<br/>Half the goal for each unlocked battery + 1",
			cost: new Decimal(1e3),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			},
			effect() {
				return Decimal.pow(2, getNumBatteries().add(1));
			},
			effectDisplay() {
				return `/${formatWhole(this.effect())}`;
			}
		},
		5: {
			title: "Wave Theory",
			description: "<br/>Color energy gain is multiplied by 5 raised to the amount of unspent light + 1",
			cost: new Decimal(1e6),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			},
			effect() {
				return Decimal.pow(5, player.points.sub(player.red).sub(player.green).sub(player.blue).add(1));
			},
			effectDisplay() {
				return `x${formatWhole(this.effect())}`;
			}
		},
		8: {
			title: "Emission theory",
			description: "<br/>Increase battery cap based on time spent in this challenge",
			cost: new Decimal(1e4),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			},
			effect() {
				return new Decimal(player.color.resetTime).max(1);
			},
			effectDisplay() {
				return `x${format(this.effect())}`;
			}
		},
		21: {
			title: "Quantum theory",
			description: "<br/>Apply red light effect's additional times based on unspent light",
			cost: new Decimal(1e12),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			},
			effect() {
				return player.points.sub(player.red).sub(player.green).sub(player.blue).add(1).pow(.1).add(.5);
			},
			effectDisplay() {
				return `+${format(this.effect())} times`;
			}
		},
		34: {
			title: "Special Relativity",
			description: "<br/>Each buyable gives free levels to the previous buyable.",
			cost: new Decimal(1e18),
			style: () => ({
				color: "white"
			}),
			color: () => getCurrentColor(.5),
			unlocked() {
				return player.green.gte(this.id);
			}
		}
	}
});

// animate electricity svg
const numberOfPoints = 20;
const lineWidth = 4;
const amplitude = 30;
const margin = 10;
const maxHeight = 400 - margin * 2;
const width = 100;

let animateElectricity = () => {
	const containers = document.querySelectorAll(".battery > svg");
	for (let i = 0; i < containers.length; i++) {
		const container = containers[i];
		const height = parseInt(getComputedStyle(container).getPropertyValue("height").slice(0, -2));

		if (height === margin * 2) {
			continue;
		}

		if (Math.random() < .5) {
			continue;
		}

		const numPoints = Math.max(3, Math.floor(numberOfPoints * height / maxHeight));
		let coords = new Array(numPoints).fill(1).map((_,i) => {
			let first = i == 0;
			let last = i == numPoints - 1;
			let y = (height - margin * 2) / (numPoints - 1) * i + margin;
			let x = (first || last) ? width / 2 : (width - amplitude) / 2 + Math.random() * amplitude;

			return { x, y };
		});

		// Draw path
		let path = container.querySelector("path");
		path.setAttribute("d", "M" + coords.map(coord => coord.x + "," + coord.y).join(" L"));

		// Style path
		let deviation = Math.random() * (5 - 2) + 2;
		path.style.opacity = deviation / 5 + 0.2;
		path.style.strokeWidth = lineWidth;

		// Style glow
		let glow = container.querySelector("#glow feDropShadow");
		glow.setAttribute("stdDeviation", deviation);
	}

	requestAnimationFrame(animateElectricity);
};

requestAnimationFrame(animateElectricity);
