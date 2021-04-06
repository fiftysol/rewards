const corsUrl = "https://bolo-cors.herokuapp.com/";
const httpsUrl = "https://images.weserv.nl/?url=";
const discdbUrl = corsUrl + "https://discorddb.000webhostapp.com/get?e=json&folder=bottmp&f=";

if (!String.format) {
	String.format = function(format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != "undefined" ? args[number] : match;
		});
	};
}

let input, nickname, badges, orbs, titles;
let wiki = { "badges": null, "orbs": null };

let ignore = {
	"badges": {
		"162": true
	},
	"orbs": {
		"18": true,
		"19": true
	}
}

async function getInfoFromDiscDb(code)
{
	let playerData;

	try
	{
		let body = await fetch(discdbUrl + code);
		playerData = await body.json();
	}
	catch(err)
	{
		console.log(err);
		playerData = { "success": false };
	}

	return playerData;
}

function addLoading(obj)
{
	if (!obj.classList.contains("loading"))
	{
		obj.classList.add("loading");
		return true;
	}
	return false;
}

function remLoading(obj)
{
	if (obj.classList.contains("loading"))
		obj.classList.remove("loading");
}

async function getWiki()
{
	wiki["badges"] = await fetch(corsUrl + "https://transformice.fandom.com/wiki/Badges");
	wiki["badges"] = await wiki["badges"].text();

	wiki["orbs"] = await fetch(corsUrl + "https://transformice.fandom.com/wiki/Cartouches");
	wiki["orbs"] = await wiki["orbs"].text();

	let load = document.getElementById("load");
	remLoading(load);
	load.innerHTML = "Load <i class=\"fa fa-search\"></i>";
}

async function search(obj)
{
	if (!(wiki["badges"] && wiki["orbs"]) || !addLoading(obj)) return;

	let data = await getInfoFromDiscDb(input.value);

	if (!data.success)
	{
		remLoading(obj);
		nickname.innerHTML = "Invalid code <i class=\"fa fa-times-circle\"></i>";
		return;
	}

	nickname.innerText = data.nickname;

	populateTitles(data.titles);
	populateOrbs(data.orbs);
	populateBadges(data.badges);

	remLoading(obj);
}

const checkedImage = "<img src=\"{0}\" alt=\"{1}\" class=\"small-image\" />"
const unsafeBadgeImage = "<img src=\"{0}\" alt=\"{1}\" class=\"small-image hidden\" onload=\"setVisible(this);\" onerror=\"unsafeBadgeImageError(this, {1});\" />"

const badgeUrl = "https://static\.wikia\.nocookie\.net/transformice/images/.+?/.+?/{1}Badge_{0}\.png";
const orbUrl = "https://static\.wikia\.nocookie\.net/transformice/images/.+?/.+?/Macaron_{0}\.png";

const badgeUrlOfficial = httpsUrl + "http://transformice.com/images/x_transformice/x_badges/x_{0}.png";

const counter = "<span class=\"counter\">Total: <span id=\"counterNum\">{0}</span></span><br><br>";

function decreaseBadgeCounter()
{
	if (!badges.counterLoaded)
	{
		if (badges.subtractNumber === undefined)
			badges.subtractNumber = 0;
		badges.subtractNumber++;
	}
	else
	{
		if (badges.subtractNumber)
		{
			badges.children.badgesCounter.children[0].children.counterNum.innerText -= ++badges.subtractNumber;
			delete badges.subtractNumber;
		}
		else
			badges.children.badgesCounter.children[0].children.counterNum.innerText--;
	}
}

function unsafeBadgeImageError(obj, badgeId)
{
	if (ignore.badges[badgeId]) return;
	obj.remove();
	decreaseBadgeCounter();
	ignore.badges[badgeId] = true;
}

function setVisible(obj)
{
	if (obj.classList.contains("hidden"))
		obj.classList.remove("hidden");
	else if (!obj.classList.contains("visible"))
		obj.classList.add("visible");
}

function startBox(obj, hasChildren)
{
	setVisible(obj);
	if (hasChildren)
		for (let i = 0; i < obj.children.length; i++)
			obj.children[i].innerHTML = '';
	else
		obj.innerHTML = '';
}

function badgeExists(id, prefix)
{
	return RegExp(String.format(badgeUrl, id, prefix)).test(wiki["badges"]);
}

async function populateBadges(playerBadges, ignoreSafaCheck = false)
{
	startBox(badges, true);

	let missingCounter = 0;

	let badge, url, isSafeBadge, officialUrl;
	let isSurv, isRacing;

	for (badge = 0; badge < 350; badge++)
		if (!ignore["badges"][badge] && !playerBadges[badge]) // 162 == 163
		{
			isSurv = (badge >= 120 && badge <= 123);
			isRacing = (badge >= 124 && badge <= 127);

			isSafeBadge = ignoreSafaCheck ? false : badgeExists(
				(isSurv ? (badge - 119) : (isRacing ? (badge - 123) : badge)),
				(isSurv ? "Surv_" : (isRacing ? "Racing_" : ''))
			);

			officialUrl = String.format(badgeUrlOfficial, badge); // avoids quality loss

			missingCounter++;
			badges.children.badgesContent.innerHTML +=
				String.format(isSafeBadge ? checkedImage : unsafeBadgeImage, officialUrl, badge);
		}

	badges.children.badgesCounter.innerHTML = String.format(counter, missingCounter);
	badges.counterLoaded = true;
}

function getOrbUrl(id)
{
	return wiki["orbs"].match(String.format(orbUrl, id));
}

async function populateOrbs(playerOrbs)
{
	startBox(orbs);

	let missingCounter = 0;

	let orb, url;
	for (orb = 1; orb < 100; orb++)
		if (!ignore["orbs"][orb] && !playerOrbs[orb])
		{
			url = getOrbUrl(orb);
			if (!url) continue;

			missingCounter++;
			orbs.innerHTML += String.format(checkedImage, url[0], orb);
		}

	orbs.innerHTML = String.format(counter, missingCounter) + orbs.innerHTML;
}

function populateTitles(playersObtainableTitles)
{
	startBox(titles);

	playersObtainableTitles = playersObtainableTitles.sort();

	let row = 0, cel = 0;
	let titlesTable = [ [ ] ];
	let realLen = playersObtainableTitles.length - 1;

	for (let t = 0; t < playersObtainableTitles.length; t++)
	{
		titlesTable[row][cel++] = "«" + playersObtainableTitles[t] + "»";
		if (cel == 30 || t == realLen)
		{
			titlesTable[row] = "<td>" + titlesTable[row++].join("<br>") + "</td>";
			titlesTable[row] = [ ];
			cel = 0;
		}
	}

	if (titlesTable[row].length == 0)
		titlesTable.pop();

	titlesTable = "<table><tr>" + titlesTable.join("\n") + "</tr></table>";

	titles.innerHTML = String.format(counter, playersObtainableTitles.length) + titlesTable;
}

window.onload = function()
{
	input = document.getElementById("code");
	nickname = document.getElementById("nickname");
	badges = document.getElementById("badges");
	orbs = document.getElementById("orbs");
	titles = document.getElementById("titles");

	let queryBadges = document.location.search.match(/[?&]badges=([^&]+)/);
	if (queryBadges)
	{
		queryBadges = queryBadges[1];
		queryBadges = queryBadges.split(',');

		let playerBadges = { };
		for (let badge of queryBadges)
			playerBadges[badge] = true;

		populateBadges(playerBadges, true);
	}
	else
		getWiki();
}
