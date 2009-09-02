const ID = '{149C6CC6-EC62-4ebd-B719-3C2E867930C7}'; 

var _elementIDs = [
	'mode',
	'last_selected_order',
	'show_onkeypress',
	'switch_onkeyrelease'
];

var gNodes;
var gAdvancePrefs;

function controlLinkedItems(elem, aShouldEnable, aAttr)
{
	var target = elem.getAttribute(aAttr || 'linked').split(/ +/);
	var item;

	var disabled = (aShouldEnable !== void(0)) ? !aShouldEnable :
				(elem.localName == 'textbox') ? (!elem.value || !Number(elem.value)) :
				elem.localName == 'radio' ? !elem.selected :
				!elem.checked;

	for (var i in target)
	{
		item = document.getElementById(target[i]);
		if (item) item.disabled = disabled;
	}
}
 
function advancePrefs(aURI, aData)
{
	window.openDialog(aURI, '_blank', 'chrome,dialog,modal,centerscreen', aData);

	var count = 0;

	for (var i in aData)
	{
		if (!('newValue' in aData[i])) continue;

		if ('node' in aData[i]) {
			switch (aData[i].node.localName)
			{
				case 'checkbox':
					aData[i].node.checked = aData[i].newValue == 'true';
					break;
				case 'textbox':
					aData[i].node.value = aData[i].newValue;
					break;
				case 'radiogroup':
					aData[i].node.selectedItem = aData[i].node.getElementsByAttribute('value', aData[i].newValue)[0];
					break;
			}
		}

		if ('onModified' in aData[i])
			aData[i].onModified();

		delete aData[i].newValue;
		count++;
	}

	return (count > 0);
}
 
function onBasicChanged() 
{
	var node = document.getElementById('basic');


	if (node.value == '0') {
		gNodes.mode.value = 1;
		gNodes.selected.checked = true;
		gNodes.quickstart.checked = false;
		gNodes.nodynamic.checked = true;
	}

	controlLinkedItems(document.getElementById('basic-custom'));
}
 
function updateRadio()
{
	var node = document.getElementById('basic');
	if (gNodes.mode.value == '1' &&
		gNodes.selected.checked &&
		!gNodes.quickstart.checked &&
		gNodes.nodynamic.checked)
		node.selectedItem = node.getElementsByAttribute('value', '0')[0];
	else
		node.selectedItem = node.getElementsByAttribute('value', '1')[0];
}
 
// About 
const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
function opener()
{
	return WindowManager.getMostRecentWindow('navigator:browser');
}

function loadURI(uri)
{
	if (opener())
		opener().loadURI(uri);
	else
		window.open(uri);
}
 
// Uninstall 
var STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
var msg = STRBUNDLE.createBundle('chrome://rubysupport/locale/rubysupport.properties');
var unreg;
if (location.href.indexOf('prefDialog.xul') < 0)
	unreg = new exUnregisterer(
		'chrome://stackstyletabs/content/contents.rdf',
		'jar:%chromeFolder%stackstyletabs.jar!/locale/en-US/stackstyletabs/contents.rdf',
		'jar:%chromeFolder%stackstyletabs.jar!/locale/ja-JP/stackstyletabs/contents.rdf'
	);


function Unregister()
{
	if (!confirm(msg.GetStringFromName('uninstall_confirm'))) return;

	if (!confirm(msg.GetStringFromName('uninstall_prefs_confirm')))
		window.unreg.removePrefs('rubysupport');

	window.unreg.unregister();

	alert(
		msg.GetStringFromName('uninstall_removefile').replace(/%S/i,
			window.unreg.getFilePathFromURLSpec(
				(window.unreg.exists(window.unreg.UChrome+'stackstyletabs.jar') ? window.unreg.UChrome+'stackstyletabs.jar' : window.unreg.Chrome+'stackstyletabs.jar' )
			)
		)
	);

	window.close();
}
 
var prefService = { 
	get Prefs()
	{
		if (!this._Prefs) {
			this._Prefs = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
		}
		return this._Prefs;
	},
	_Prefs : null,

	getPref : function(aPrefstring)
	{
		try {
			var type = this.Prefs.getPrefType(aPrefstring);
			switch (type)
			{
				case this.Prefs.PREF_STRING:
					return this.Prefs.getComplexValue(aPrefstring, this.knsISupportsString).data;
					break;
				case this.Prefs.PREF_INT:
					return this.Prefs.getIntPref(aPrefstring);
					break;
				default:
					return this.Prefs.getBoolPref(aPrefstring);
					break;
			}
		}
		catch(e) {
		}

		return null;
	},

	setPref : function(aPrefstring, aNewValue)
	{
		var type;
		try {
			type = typeof aNewValue;
		}
		catch(e) {
			type = null;
		}

		switch (type)
		{
			case 'string':
				var string = Components.classes[this.kSupportsString].createInstance(this.knsISupportsString);
				string.data = aNewValue;
				this.Prefs.setComplexValue(aPrefstring, this.knsISupportsString, string);
				break;
			case 'number':
				this.Prefs.setIntPref(aPrefstring, parseInt(aNewValue));
				break;
			default:
				this.Prefs.setBoolPref(aPrefstring, aNewValue);
				break;
		}
		return true;
	},

	clearPref : function(aPrefstring)
	{
		try {
			this.Prefs.clearUserPref(aPrefstring);
		}
		catch(e) {
		}

		return;
	}
};
 
