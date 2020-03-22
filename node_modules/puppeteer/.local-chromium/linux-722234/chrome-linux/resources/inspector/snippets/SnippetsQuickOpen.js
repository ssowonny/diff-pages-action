export default class SnippetsQuickOpen extends QuickOpen.FilteredListWidget.Provider{constructor(){super();this._snippets=[];}
selectItem(itemIndex,promptValue){if(itemIndex===null){return;}
Snippets.evaluateScriptSnippet(this._snippets[itemIndex]);}
notFoundText(query){return Common.UIString('No snippets found.');}
attach(){this._snippets=Snippets.project.uiSourceCodes();}
detach(){this._snippets=[];}
itemCount(){return this._snippets.length;}
itemKeyAt(itemIndex){return this._snippets[itemIndex].name();}
renderItem(itemIndex,query,titleElement,subtitleElement){titleElement.textContent=unescape(this._snippets[itemIndex].name());titleElement.classList.add('monospace');QuickOpen.FilteredListWidget.highlightRanges(titleElement,query,true);}}
self.Snippets=self.Snippets||{};Snippets=Snippets||{};Snippets.SnippetsQuickOpen=SnippetsQuickOpen;