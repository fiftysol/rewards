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

const corsUrl = "https://cors-anywhere.herokuapp.com/";
const hastebinUrl = corsUrl + "https://hastebin.com/raw/";

async function getInfoFromHastebin(code)
{
	let playerData;

	try
	{
		let body = await fetch(hastebinUrl + code);
		body = await body.text()
		playerData = await JSON.parse(body);
	}
	catch(err)
	{
		playerData = { "success": false };
	}

	return playerData;
}

async function getWiki()
{
	wiki["badges"] = await fetch(corsUrl + "https://transformice.fandom.com/wiki/Badges");
	wiki["badges"] = await wiki["badges"].text();

	wiki["orbs"] = await fetch(corsUrl + "https://transformice.fandom.com/wiki/Cartouches");
	wiki["orbs"] = await wiki["orbs"].text();
}

async function search()
{
	if (!(wiki["badges"] && wiki["orbs"])) return;

	let data = await getInfoFromHastebin(input.value);

	if (!data.success)
	{
		nickname.innerText = "Invalid code";
		return;
	}

	nickname.innerText = data.nickname;

	populateBadges(data.badges);
	populateOrbs(data.orbs);
	populateTitles(data.titles);
}

const image = "<img src=\"{0}\" alt=\"{1}\" class=\"small-image\" />"

const badgeUrl = "https://vignette\.wikia\.nocookie\.net/transformice/images/.+?/.+?/{1}Badge_{0}\.png";
const orbUrl = "https://vignette\.wikia\.nocookie\.net/transformice/images/.+?/.+?/Macaron_{0}\.png";

const counter = "<span class=\"counter\">Total: {0}</span><br><br>";

function startBox(obj)
{
	if (!obj.classList.contains("visible"))
		obj.classList.add("visible");

	obj.innerHTML = '';
}

function getBadgeUrl(id, prefix)
{
	return wiki["badges"].match(String.format(badgeUrl, id, prefix));
}

async function populateBadges(playerBadges)
{
	startBox(badges);

	let missingCounter = 0;

	let badge, url;
	let isSurv, isRacing;

	for (badge = 0; badge < 350; badge++)
		if (badge != 162 && !playerBadges[badge]) // 162 == 163
		{
			isSurv = (badge >= 120 && badge <= 123);
			isRacing = (badge >= 124 && badge <= 127);

			url = getBadgeUrl(
				(isSurv ? (badge - 119) : (isRacing ? (badge - 123) : badge)),
				(isSurv ? "Surv_" : (isRacing ? "Racing_" : ''))
			);
			if (!url) continue;

			missingCounter++;
			badges.innerHTML += String.format(image, url[0], badge);
		}

	badges.innerHTML = String.format(counter, missingCounter) + badges.innerHTML;
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
		if (!playerOrbs[orb])
		{
			url = getOrbUrl(orb);
			if (!url) continue;

			missingCounter++;
			orbs.innerHTML += String.format(image, url[0], orb);
		}

	orbs.innerHTML = String.format(counter, missingCounter) + orbs.innerHTML;
}

function populateTitles(playersObtainableTitles)
{
	startBox(titles);

	titles.innerHTML = String.format(counter, playersObtainableTitles.length) + "<span class=\"title\">«" + playersObtainableTitles.sort().join("»<br>«") + "»</span>";
}

window.onload = function()
{
	input = document.getElementById("code");
	nickname = document.getElementById("nickname");
	badges = document.getElementById("badges");
	orbs = document.getElementById("orbs");
	titles = document.getElementById("titles");

	getWiki();
}
