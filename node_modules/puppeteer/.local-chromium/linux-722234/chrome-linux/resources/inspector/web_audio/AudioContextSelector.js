export class AudioContextSelector extends Common.Object{constructor(){super();this._placeholderText=ls`(no recordings)`;this._items=new UI.ListModel();this._dropDown=new UI.SoftDropDown(this._items,this);this._dropDown.setPlaceholderText(this._placeholderText);this._toolbarItem=new UI.ToolbarItem(this._dropDown.element);this._toolbarItem.setEnabled(false);this._toolbarItem.setTitle(ls`Audio context: ${this._placeholderText}`);this._items.addEventListener(UI.ListModel.Events.ItemsReplaced,this._onListItemReplaced,this);this._toolbarItem.element.classList.add('toolbar-has-dropdown');this._selectedContext=null;}
_onListItemReplaced(){const hasItems=!!this._items.length;this._toolbarItem.setEnabled(hasItems);if(!hasItems){this._toolbarItem.setTitle(ls`Audio context: ${this._placeholderText}`);}}
contextCreated(event){const context=(event.data);this._items.insert(this._items.length,context);if(this._items.length===1){this._dropDown.selectItem(context);}}
contextDestroyed(event){const contextId=(event.data);const contextIndex=this._items.findIndex(context=>context.contextId===contextId);if(contextIndex>-1){this._items.remove(contextIndex);}}
contextChanged(event){const changedContext=(event.data);const contextIndex=this._items.findIndex(context=>context.contextId===changedContext.contextId);if(contextIndex>-1){this._items.replace(contextIndex,changedContext);if(this._selectedContext&&this._selectedContext.contextId===changedContext.contextId){this._dropDown.selectItem(changedContext);}}}
createElementForItem(item){const element=createElementWithClass('div');const shadowRoot=UI.createShadowRootWithCoreStyles(element,'web_audio/audioContextSelector.css');const title=shadowRoot.createChild('div','title');title.createTextChild(this.titleFor(item).trimEndWithMaxLength(100));return element;}
selectedContext(){if(!this._selectedContext){return null;}
return this._selectedContext;}
highlightedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.classList.remove('highlighted');}
if(toElement){toElement.classList.add('highlighted');}}
isItemSelectable(item){return true;}
itemSelected(item){if(!item){return;}
if(!this._selectedContext||this._selectedContext.contextId!==item.contextId){this._selectedContext=item;this._toolbarItem.setTitle(ls`Audio context: ${this.titleFor(item)}`);}
this.dispatchEventToListeners(WebAudio.AudioContextSelector.Events.ContextSelected,item);}
reset(){this._items.replaceAll([]);}
titleFor(context){return`${context.contextType} (${context.contextId.substr(-6)})`;}
toolbarItem(){return this._toolbarItem;}}
export const Events={ContextSelected:Symbol('ContextSelected')};self.WebAudio=self.WebAudio||{};WebAudio=WebAudio||{};WebAudio.AudioContextSelector=AudioContextSelector;WebAudio.AudioContextSelector.Events=Events;