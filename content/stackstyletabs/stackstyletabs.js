var StackStyleTabsService = { 
	
	_mode : 0, 
	kMODE_DISABLED        : 0,
	kMODE_SHOW_TABBAR     : 1,
	kMODE_HIDE_TABBAR     : 2,
	kMODE_AUTOHIDE_TABBAR : 3,
	get mode()
	{
		return this._mode;
	},
	set mode(aValue)
	{
		var prevMode = this._mode;
		this._mode = aValue;
		if (prevMode == this.kMODE_DISABLED &&
			this._mode > this.kMODE_DISABLED) {
			window.addEventListener('keydown', this, true);
			window.addEventListener('keyup', this, true);
			window.addEventListener('keypress', this, true);
			window.addEventListener('mousedown', this, true);
		}
		else if (prevMode != this.kMODE_DISABLED &&
				this._mode == this.kMODE_DISABLED) {
			window.removeEventListener('keydown', this, true);
			window.removeEventListener('keyup', this, true);
			window.removeEventListener('keypress', this, true);
			window.removeEventListener('mousedown', this, true);
		}
		return aValue;
	},

	shouldSortByLastSelected : false,
	shouldSwitchImmediately : false,
	shouldShowImmediately : false,
 
	// properties 
	
	isMac : navigator.platform.match(/mac/i), 
 
	get ctrlTabPreviewsEnabled() 
	{
		return 'allTabs' in window &&
				this.getPref('browser.ctrlTab.previews');
	},
 
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
 
	get tabStrip() 
	{
		return this.browser.mStirp || this.browser.tabContainer.parentNode;
	},
 
	get popup() 
	{
		if (!this._popup)
			this._popup = document.getElementById('stackstyletabs-popup');
		return this._popup;
	},
	_popup : null,
  
	// initialize 
	
	init : function() 
	{
		if (!this.browser) return;

		this.initBrowser(this.browser);

		this.addPrefListener(this);

		// this.onPrefChange('stackstyletabs.mode');
		this.onPrefChange('browser.ctrlTab.previews');
		this.onPrefChange('stackstyletabs.last_selected_order');
		this.onPrefChange('stackstyletabs.show_onkeypress');
		this.onPrefChange('stackstyletabs.switch_onkeyrelease');
	},
	
	initBrowser : function(aBrowser) 
	{
		if (aBrowser.localName != 'tabbrowser') return;
		aBrowser.mTabContainer.addEventListener('select', this, true);
		aBrowser.selectedTab.__stackstyletabs__lastSelectedTime = Date.now();
	},
  
	destroy : function() 
	{
		if (!this.browser) return;

		this.mode = this.kMODE_DISABLED;

		this.destroyBrowser(this.browser);

		this.removePrefListener(this);
	},
	
	destroyBrowser : function(aBrowser) 
	{
		if (aBrowser.localName != 'tabbrowser') return;
		aBrowser.mTabContainer.removeEventListener('select', this, true);
	},
   
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				window.removeEventListener('load', this, false);
				this.init();
				break;

			case 'unload':
				window.removeEventListener('unload', this, false);
				this.destroy();
				break;

			case 'keydown':
				this.onKeyDown(aEvent);
				return;

			case 'keyup':
			case 'keypress':
				this.onKeyRelease(aEvent);
				return;

			case 'mousedown':
				this.onMouseDown(aEvent);
				return;
		}
	},
	
	onTabSelect : function(aEvent) 
	{
		if (!this.popupShown)
			this.browser.selectedTab.__stackstyletabs__lastSelectedTime = Date.now();
	},
 
	onKeyDown : function(aEvent) 
	{
		if (
			this.tabs.length > 1 &&
			!aEvent.altKey &&
			(this.isMac ? aEvent.metaKey : aEvent.ctrlKey )
			) {
			if (this.shouldShowImmediately)
				this.showTabs();
		}
		else {
			this.hideTabs();
		}
	},
 
	onKeyRelease : function(aEvent) 
	{
		var scrollDown,
			scrollUp;

		var standBy = scrollDown = scrollUp = (!aEvent.altKey && (this.isMac ? aEvent.metaKey : aEvent.ctrlKey ));

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
				this.popupShown &&
				standBy && !aEvent.shiftKey &&
				aEvent.keyCode == 16 &&
				(aEvent.type == 'keyup' || aEvent.charCode == 0)
			)
			) {
			this.showTabs(true);
			if (
				aEvent.type == 'keypress' &&
				(
					this.mode == this.kMODE_SHOW_TABBAR ||
					this.mode == this.kMODE_HIDE_TABBAR
				)
				) {
				aEvent.preventDefault();
				aEvent.stopPropagation();
				this.scrollUpDown(scrollDown ? 1 : -1 );
			}

			return;
		}


		var switchTabAction = aEvent.keyCode == (this.isMac ? aEvent.DOM_VK_META : aEvent.DOM_VK_CONTROL );

		var shown  = this.popupShown;

		this.hideTabs(!switchTabAction);

		// if this even hides the popup, re-dispatch a new event for other features.
		if (shown &&
			!this.popupShown &&
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

		if (!this.popupShown) return;

		this.onKeyRelease(aEvent);
	},
  
	observe : function(aSubject, aTopic, aData) 
	{
		if (aTopic == 'nsPref:changed')
			this.onPrefChange(aData);
	},
	
	domains : [ 
		'stackstyletabs.',
		'browser.ctrlTab.previews'
	],
 
	onPrefChange : function(aPref) 
	{
		var value = this.getPref(aPref);
		switch (aPref)
		{
			case 'browser.ctrlTab.previews':
				value = this.ctrlTabPreviewsEnabled ?
					this.kMODE_DISABLED :
					this.getPref('stackstyletabs.mode') ;
			case 'stackstyletabs.mode':
				this.mode = value;
				this.hideTabs();
				return;

			case 'stackstyletabs.last_selected_order':
				this.shouldSortByLastSelected = value;
				return;

			case 'stackstyletabs.show_onkeypress':
				this.shouldShowImmediately = value;
				return;

			case 'stackstyletabs.switch_onkeyrelease':
				this.shouldSwitchImmediately = value;
				return;

		}
	},
  
	showTabs : function() 
	{
		var b = this.browser;
		if (!b) return;

		if (
			this.mode == this.kMODE_SHOW_TABBAR ||
			this.mode == this.kMODE_HIDE_TABBAR
			) {
			this.showHidePopup(true);
		}

		var strip = this.getTabStrip(b);
		if (this.mode == this.kMODE_AUTOHIDE_TABBAR) {
			strip.collapsed = false;
			strip.removeAttribute('stackstyletabs-hidden');
		}
	},
 
	hideTabs : function(aPreventSwitchTab) 
	{
		var b = this.browser;
		if (!b) return;

		if (
			this.mode == this.kMODE_SHOW_TABBAR ||
			this.mode == this.kMODE_HIDE_TABBAR
			) {
			this.showHidePopup(false, aPreventSwitchTab);
		}

		var strip = this.getTabStrip(b);
		if (this.mode > this.kMODE_SHOW_TABBAR)
			strip.setAttribute('stackstyletabs-hidden', true);
		else
			strip.removeAttribute('stackstyletabs-hidden');
	},
 
	showHidePopup : function(aShow, aPreventSwitchTab) 
	{
		var popup = this.popup;
		if (!popup) return;

		if (!aShow) {
			if (popup.hasChildNodes()) {
				if (this.popupShown &&
					this.shouldSwitchImmediately &&
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

				this.browser.selectedTab.__stackstyletabs__lastSelectedTime = Date.now();
			}
			return;
		}


		if (popup.hasChildNodes()) return;


		var i;
		var b = this.browser;
		var tabs = this.tabs;

		if (this.shouldSortByLastSelected) {
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

		var tab, label;
		for (i = 0; i < tabs.length; i++)
		{
			popup.appendChild(document.createElement('menuitem'));

			popup.lastChild.index = this.shouldSortByLastSelected ? tabs[i].__stackstyletabs__index : i ;

			popup.lastChild.setAttribute('class', 'menuitem-iconic bookmark-item');
			popup.lastChild.setAttribute('image', tabs[i].getAttribute('image'));
			popup.lastChild.setAttribute('label', tabs[i].label);
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

		popup.currentIndex = this.shouldSortByLastSelected ? 0 :
							b.mTabContainer.selectedIndex ;
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

		if (!this.shouldSwitchImmediately) {
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
StackStyleTabsService.__proto__ = window['piro.sakura.ne.jp'].prefs;

window.addEventListener('load', StackStyleTabsService, false);
window.addEventListener('unload', StackStyleTabsService, false);
  
