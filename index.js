if (!String.format) {
	String.format = function(format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != "undefined" ? args[number] : match;
		});
	};
}

var input, nickname, badges, orbs, titles;

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

async function search()
{
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

const image = "<img src=\"{0}\" alt=\"{1}\" onerror=\"this.style.display='none'\" />"
const image2 = "<img src=\"{0}\" alt=\"{1}\" onerror=\"this.style.display='none'\" width=\"50px\" />"

const badgeImg = String.format(image, "http://www.transformice.com/images/x_transformice/x_badges/x_{0}.png");
const orbScrapper = corsUrl + "https://transformice.fandom.com/wiki/Cartouches";
const orbUrl = "https://vignette\.wikia\.nocookie\.net/transformice/images/.+?/.+?/Macaron_{0}\.png";

const counter = "<span class=\"counter\">Total: {0}</span><br><br>";

function startBox(obj)
{
	if (!obj.classList.contains("visible"))
		obj.classList.add("visible");

	obj.innerHTML = '';
}

async function populateBadges(playerBadges)
{
	startBox(badges);

	let missing = 0;

	let badge;
	for (badge = 0; badge < 74; badge++)
		if (!playerBadges[badge])
		{
			missing++;
			badges.innerHTML += String.format(badgeImg, badge);
		}

	for (badge = 120; badge < 350; badge++)
		if (badge != 162 && !playerBadges[badge])
		{
			missing++;
			badges.innerHTML += String.format(badgeImg, badge);
		}

	badges.innerHTML = String.format(counter, missing) + badges.innerHTML;
}

function getOrbUrl(wiki, id)
{
	return wiki.match(String.format(orbUrl, id));
}

async function populateOrbs(playerOrbs)
{
	let wikiOrbs = await fetch(orbScrapper);
	wikiOrbs = await wikiOrbs.text();

	startBox(orbs);

	let missing = 0;

	let orb, url;
	for (orb = 1; orb < 100; orb++)
		if (!playerOrbs[orb])
		{
			url = getOrbUrl(wikiOrbs, orb);
			if (!url) continue;

			missing++;
			orbs.innerHTML += String.format(image2, url[0], orb);
		}

	orbs.innerHTML = String.format(counter, missing) + orbs.innerHTML;
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
}
