var gPrefs;
var gPlatformDefault = {
		mode       : 1,
		selected   : true,
		quickstart : false,
		nodynamic  : true
	};

function init()
{
	gPrefs = {
		mode       : document.getElementById('stackstyletabs.mode'),
		selected   : document.getElementById('stackstyletabs.last_selected_order'),
		quickstart : document.getElementById('stackstyletabs.show_onkeypress'),
		nodynamic  : document.getElementById('stackstyletabs.switch_onkeyrelease'),
	};

	updateRadio();
	onBasicChanged();
}
 
function onBasicChanged() 
{
	var radio = document.getElementById('basic');
	var advanced = document.getElementById('basic-custom-button');
	if (radio.value == '0') {
		for (var i in gPrefs)
		{
			gPrefs[i].value = gPlatformDefault[i];
		}
		advanced.setAttribute('disabled', true);
	}
	else {
		advanced.removeAttribute('disabled');
	}
}
 
function updateRadio()
{
	var isPlatformDefault = true;
	for (var i in gPrefs)
	{
		if (gPrefs[i].value == gPlatformDefault[i]) continue;
		isPlatformDefault = false;
		break;
	}

	var radio = document.getElementById('basic');
	radio.value = isPlatformDefault ? 0 : 1 ;
}
