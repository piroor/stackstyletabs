// start of definition 
if (!window.StackStyleTabsService) {

var StackStyleTabsService = {

	get popupShown()
	{
		return (this.popup.boxObject.height > 0);
	},

	get browser()
	{
		return gBrowser;
	},

	get tabs()
	{
		var tabs = document.evaluate(
				'descendant::*[local-name()="tab"]',
				this.browser.mTabContainer,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		var array = [];
		for (var i = 0, maxi = tabs.snapshotLength; i < maxi; i++)
		{
			array.push(tabs.snapshotItem(i));
		}
		return array;
	},

	get popup()
	{
		if (!this._popup)
			this._popup = document.getElementById('stackstyletabs-popup');
		return this._popup;
	},
	_popup : null,
	
	// ƒCƒxƒ“ƒg‚Ì•ß‘¨ 
	
	init : function() 
	{
		if (!this.browser) return;

		window.addEventListener('keydown',   this.onKeyDown,    true);
		window.addEventListener('keyup',     this.onKeyRelease, true);
		window.addEventListener('keypress',  this.onKeyRelease, true);
		window.addEventListener('mousedown', this.onMouseDown,  true);

		this.browser.mTabContainer.addEventListener('select', this.onTabSelect, true);
		this.browser.selectedTab.__stackstyletabs__lastSelectedTime = (new Date()).getTime();

		StackStyleTabsService.hideTabs();

		window.addEventListener('unload', StackStyleTabsService.onKeyRelease, true);
		window.setTimeout('StackStyleTabsService.hideTabs();', 0)
		window.setTimeout('StackStyleTabsService.hideTabs();', 100)
	},
 
	destruct : function() 
	{
		var obj = StackStyleTabsService;
		if (!obj.browser) return;

		obj.browser.mTabContainer.removeEventListener('select', obj.onTabSelect, true);

		window.removeEventListener('keydown',   obj.onKeyDown,    true);
		window.removeEventListener('keyup',     obj.onKeyRelease, true);
		window.removeEventListener('keypress',  obj.onKeyRelease, true);
		window.removeEventListener('mousedown', obj.onMouseDown,  true);
	},
 
	onTabSelect : function(aEvent) 
	{
		if (!StackStyleTabsService.popupShown)
			StackStyleTabsService.browser.selectedTab.__stackstyletabs__lastSelectedTime = (new Date()).getTime();
	},
 
	onKeyDown : function(aEvent) 
	{
		if (
			StackStyleTabsService.tabs.length > 1 &&
			!aEvent.altKey &&
			(navigator.platform.match(/mac/i) ? aEvent.metaKey : aEvent.ctrlKey )
			) {
			if (window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.show_onkeypress'))
				StackStyleTabsService.showTabs();
		}
		else
			StackStyleTabsService.hideTabs();
	},
 
	onKeyRelease : function(aEvent) 
	{
		var scrollDown,
			scrollUp;
		var isMac = navigator.platform.match(/mac/i);

		var standBy = scrollDown = scrollUp = (!aEvent.altKey && (isMac ? aEvent.metaKey : aEvent.ctrlKey ));

		scrollDown = scrollDown && (
				!aEvent.shiftKey &&
				(
					aEvent.keyCode == aEvent.DOM_VK_TAB ||
					aEvent.keyCode == aEvent.DOM_VK_PAGE_DOWN
				)
			);

		scrollUp = scrollUp && (
				aEvent.shiftKey ? (aEvent.keyCode == aEvent.DOM_VK_TAB) : (aEvent.keyCode == aEvent.DOM_VK_PAGE_UP)
			);

		if (
			scrollDown ||
			scrollUp ||
			( // when you release "shift" key on the menu
				StackStyleTabsService.popupShown &&
				standBy && !aEvent.shiftKey &&
				aEvent.charCode == 0 && aEvent.keyCode == 16
			)
			) {
			StackStyleTabsService.showTabs(true);
			if (
				aEvent.type == 'keypress' &&
				(
					window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 1 ||
					window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 2
				)
				) {
				aEvent.preventDefault();
				aEvent.stopPropagation();
				StackStyleTabsService.scrollUpDown(scrollDown ? 1 : -1 );
			}

			return;
		}


		var switchTabAction = aEvent.keyCode == (isMac ? aEvent.DOM_VK_META : aEvent.DOM_VK_CONTROL );

		var shown  = StackStyleTabsService.popupShown;

		StackStyleTabsService.hideTabs(!switchTabAction);

		// if this even hides the popup, re-dispatch a new event for other features.
		if (shown &&
			!StackStyleTabsService.popupShown &&
			!switchTabAction &&
			aEvent && aEvent.type == 'keypress') {
			var event = document.createEvent('KeyEvents');
			event.initKeyEvent(
				aEvent.type,
				aEvent.canBubble,
				aEvent.cancelable,
				aEvent.view,
				aEvent.ctrlKey,
				aEvent.altKey,
				aEvent.shiftKey,
				aEvent.metaKey,
				aEvent.keyCode,
				aEvent.charCode
			);
			var target;
			try {
				target = aEvent.originalTarget;
			}
			catch(e) {
			}
			if (!target) target = aEvent.target;
			target.dispatchEvent(event);

			aEvent.preventDefault();
			aEvent.stopPropagation();
		}
	},
 
	onMouseDown : function(aEvent) 
	{
		try {
			var xpathResult = document.evaluate(
					'ancestor-or-self::*[contains("menupopup,menuitem,menu", local-name())]',
					aEvent.originalTarget,
					document.createNSResolver(document.documentElement),
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			if (xpathResult.singleNodeValue)
				return;
		}
		catch(e) {
		}

		if (!StackStyleTabsService.popupShown) return;

		StackStyleTabsService.onKeyRelease(aEvent);
	},
  
	showTabs : function() 
	{
		var b = this.browser;
		if (!b) return;

		if (
			window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 1 ||
			window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 2
			) {
			this.showHidePopup(true);
		}

		if (window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 3) {
			b.mStrip.collapsed = false;
			b.mStrip.removeAttribute('stackstyletabs-hidden');
		}
	},
 
	hideTabs : function(aPreventSwitchTab) 
	{
		var b = this.browser;
		if (!b) return;

		if (
			window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 1 ||
			window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') == 2
			) {
			this.showHidePopup(false, aPreventSwitchTab);
		}

		if (window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.mode') > 1) {
			b.mStrip.collapsed = true;
			b.mStrip.setAttribute('stackstyletabs-hidden', true);
		}
	},
 
	showHidePopup : function(aShow, aPreventSwitchTab) 
	{
		var popup = this.popup;
		if (!popup) return;

		if (!aShow) {
			if (popup.hasChildNodes()) {
				if (this.popupShown &&
					window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.switch_onkeyrelease') &&
					!aPreventSwitchTab) {
					var tab = this.tabs[popup.childNodes[popup.currentIndex].index];

					this.browser.selectedTab = tab;
				}

				popup.hidePopup();

				var range = document.createRange();
				range.selectNodeContents(popup);
				range.deleteContents();
				range.detach();

				popup.currentIndex = 0;

				this.browser.selectedTab.__stackstyletabs__lastSelectedTime = (new Date()).getTime();
			}
			return;
		}


		if (popup.hasChildNodes()) return;


		var i;
		var b = this.browser;
		var tabs = this.tabs;

		var sortLastSelected = window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.last_selected_order');

		if (sortLastSelected) {
			var tmpTabs     = [];
			var focusedTabs = [];
			for (var i = 0; i < tabs.length; i++)
			{
				tabs[i].__stackstyletabs__index = i;
				if (tabs[i].__stackstyletabs__lastSelectedTime)
					focusedTabs.push(tabs[i]);
				else
					tmpTabs.push(tabs[i]);
			}

			focusedTabs.sort(
				function(aTabA, aTabB)
				{
					return (aTabB.__stackstyletabs__lastSelectedTime - aTabA.__stackstyletabs__lastSelectedTime);
				}
			);

			tabs = focusedTabs.concat(tmpTabs);
		}
		else {
			if ('mTabs' in b &&
				window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.menu_sorting.enabled')) { // for TBE
				var root = { childTabs : [] };
				for (i in b.mTabs)
					if (!b.mTabs[i].parentTab)
						root.childTabs.push(b.mTabs[i]);
				root.childTabs.sort(b.conpareHasChildTabs);

				tabs = b.gatherChildTabsOf(root);
			}
		}

		var tab, label;
		for (i = 0; i < tabs.length; i++)
		{
			popup.appendChild(document.createElement('menuitem'));

			popup.lastChild.index = sortLastSelected ? tabs[i].__stackstyletabs__index : i ;

			popup.lastChild.setAttribute('class', 'menuitem-iconic bookmark-item');
			popup.lastChild.setAttribute('image', tabs[i].getAttribute('image'));
			popup.lastChild.setAttribute('label', tabs[i].label);


			if (!sortLastSelected && 'parentTab' in tabs[i]) { // for TBE
				label = [];
				tab   = tabs[i];
				while (tab.parentTab)
				{
					tab = tab.parentTab;
					label.push('  ');
				}
				label.push(tabs[i].label);
				popup.lastChild.setAttribute('label', label.join(''));
			}

			if ('mLabelContainer' in tabs[i] &&
				tabs[i].mLabelContainer.hasAttribute('style')) // for TBE
				popup.lastChild.setAttribute('style', tabs[i].mLabelContainer.getAttribute('style'));
		}

		popup.setAttribute('style',
			'max-height: '+parseInt(window.outerWidth/2)+'px !important;'+
			'max-height: '+parseInt(window.outerHeight/3*2)+'px !important'
		);

		popup.autoPosition = true;
		popup.showPopup(
			popup.parentNode,
			window.screenX+parseInt(window.outerWidth/3),
			window.screenY+parseInt(window.outerHeight/3),
			'popup',
			null,
			null
		);

		popup.currentIndex = sortLastSelected ? 0 :
							('tabIndex' in b.selectedTab) ? b.selectedTab.tabIndex :
							b.mTabContainer.selectedIndex ; // 'tabIndex' is for TBE
		popup.childNodes[popup.currentIndex].setAttribute('_moz-menuactive', true);
	},
 
	onItemSelect : function(aItem) 
	{
		var b = this.browser;
		b.selectedTab = this.tabs[aItem.index];

		this.showHidePopup(false);
	},
 
	scrollUpDown : function(aDir) 
	{
		var popup = this.popup;
		if (!popup) return;

		popup.childNodes[popup.currentIndex].removeAttribute('_moz-menuactive');

		if (aDir < 0)
			popup.currentIndex = (popup.currentIndex - 1 + popup.childNodes.length) % popup.childNodes.length;
		else
			popup.currentIndex = (popup.currentIndex + 1) % popup.childNodes.length;

		if (!window['piro.sakura.ne.jp'].prefs.getPref('stackstyletabs.switch_onkeyrelease')) {
			this.browser.selectedTab = this.tabs[popup.childNodes[popup.currentIndex].index];
		}

		popup.childNodes[popup.currentIndex].setAttribute('_moz-menuactive', true);

		try {
			var scrollBox = document.getAnonymousElementByAttribute(popup, 'class', 'popup-internal-box');
			if (!('mScrollBoxObject' in scrollBox)) {
				var kids = document.getAnonymousNodes(scrollBox);
				scrollBox.mScrollBoxObject = kids[1].boxObject.QueryInterface(Components.interfaces.nsIScrollBoxObject);
			}
			scrollBox.mScrollBoxObject.ensureElementIsVisible(popup.childNodes[popup.currentIndex]);
		}
		catch(e) {
		}
	}
 
}; 
  
// end of definition 
window.setTimeout('StackStyleTabsService.init();', 100);
}
 
