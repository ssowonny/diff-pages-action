export const _history=[];export class QuickOpenImpl{constructor(){this._prefix=null;this._query='';this._providers=new Map();this._prefixes=[];this._filteredListWidget=null;self.runtime.extensions(QuickOpen.FilteredListWidget.Provider).forEach(this._addProvider.bind(this));this._prefixes.sort((a,b)=>b.length-a.length);}
static show(query){const quickOpen=new this();const filteredListWidget=new QuickOpen.FilteredListWidget(null,this._history,quickOpen._queryChanged.bind(quickOpen));quickOpen._filteredListWidget=filteredListWidget;filteredListWidget.setPlaceholder(ls`Type '?' to see available commands`,ls`Type question mark to see available commands`);filteredListWidget.showAsDialog();filteredListWidget.setQuery(query);}
_addProvider(extension){const prefix=extension.descriptor()['prefix'];this._prefixes.push(prefix);this._providers.set(prefix,(extension.instance.bind(extension)));}
_queryChanged(query){const prefix=this._prefixes.find(prefix=>query.startsWith(prefix));if(typeof prefix!=='string'||this._prefix===prefix){return;}
this._prefix=prefix;this._filteredListWidget.setPrefix(prefix);this._filteredListWidget.setProvider(null);this._providers.get(prefix)().then(provider=>{if(this._prefix!==prefix){return;}
this._filteredListWidget.setProvider(provider);this._providerLoadedForTest(provider);});}
_providerLoadedForTest(provider){}}
export class ShowActionDelegate{handleAction(context,actionId){switch(actionId){case'quickOpen.show':QuickOpenImpl.show('');return true;}
return false;}}
self.QuickOpen=self.QuickOpen||{};QuickOpen=QuickOpen||{};QuickOpen.QuickOpen=QuickOpenImpl;QuickOpen.QuickOpen._history=_history;QuickOpen.QuickOpen.ShowActionDelegate=ShowActionDelegate;