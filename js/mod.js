let modInfo = {
	name: "Lit",
	id: "lit",
	author: "thepaperpilot",
	pointsName: "light",
	discordName: "The Paper Pilot Community Server",
	discordLink: "https://discord.gg/WzejVAx",
	initialStartPoints: new Decimal (0), // Used for hard resets and new players

	offlineLimit: 1,  // In hours
};

// Set your version in num and name
let VERSION = {
	num: "1.0",
	name: "Finished Game Jam",
};

let changelog = `<h1>Changelog:</h1><br>
	<br><h3>v0.1</h3><br>
		- Framework and first 5 colors<br>
	<br><h3>v1.0</h3><br>
		- Finished rest of game.<br>`;

let winText = "Congratulations! You've beaten the game! This was made in a 7 day game jam called IGJ 2021, and has no plans for further content. That said, feel free to see how much light you can get!";

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["onAddPoints", "touchstart", "touchend", "onExit", "onStart"];

function getStartPoints(){
	return new Decimal(modInfo.initialStartPoints);
}

// Determines if it should show points/sec
function canGenPoints(){
	return false;
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints()) {
		return new Decimal(0);
	}

	let gain = new Decimal(1);
	return gain;
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() {
	return {
		hqTree: true,
		red: new Decimal(0),
		green: new Decimal(0),
		blue: new Decimal(0)
	};
}

// Display extra things at the top of the page
var displayThings = [
];

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(69);
}



// Less important things beyond this point!

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600); // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}
