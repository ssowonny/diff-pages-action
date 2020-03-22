export default class Dialog extends UI.GlassPane{constructor(){super();this.registerRequiredCSS('ui/dialog.css');this.contentElement.tabIndex=0;this.contentElement.addEventListener('focus',()=>this.widget().focus(),false);this.widget().setDefaultFocusedElement(this.contentElement);this.setPointerEventsBehavior(UI.GlassPane.PointerEventsBehavior.BlockedByGlassPane);this.setOutsideClickCallback(event=>{this.hide();event.consume(true);});UI.ARIAUtils.markAsModalDialog(this.contentElement);this._tabIndexBehavior=OutsideTabIndexBehavior.DisableAllOutsideTabIndex;this._tabIndexMap=new Map();this._focusRestorer=null;this._closeOnEscape=true;this._targetDocument;this._targetDocumentKeyDownHandler=this._onKeyDown.bind(this);}
static hasInstance(){return!!UI.Dialog._instance;}
show(where){const document=(where instanceof Document?where:(where||UI.inspectorView.element).ownerDocument);this._targetDocument=document;this._targetDocument.addEventListener('keydown',this._targetDocumentKeyDownHandler,true);if(UI.Dialog._instance){UI.Dialog._instance.hide();}
UI.Dialog._instance=this;this._disableTabIndexOnElements(document);super.show(document);this._focusRestorer=new UI.WidgetFocusRestorer(this.widget());}
hide(){this._focusRestorer.restore();super.hide();if(this._targetDocument){this._targetDocument.removeEventListener('keydown',this._targetDocumentKeyDownHandler,true);}
this._restoreTabIndexOnElements();delete UI.Dialog._instance;}
setCloseOnEscape(close){this._closeOnEscape=close;}
addCloseButton(){const closeButton=this.contentElement.createChild('div','dialog-close-button','dt-close-button');closeButton.gray=true;closeButton.addEventListener('click',()=>this.hide(),false);}
setOutsideTabIndexBehavior(tabIndexBehavior){this._tabIndexBehavior=tabIndexBehavior;}
_disableTabIndexOnElements(document){if(this._tabIndexBehavior===OutsideTabIndexBehavior.PreserveTabIndex){return;}
let exclusionSet=(null);if(this._tabIndexBehavior===OutsideTabIndexBehavior.PreserveMainViewTabIndex){exclusionSet=this._getMainWidgetTabIndexElements(UI.inspectorView.ownerSplit());}
this._tabIndexMap.clear();for(let node=document;node;node=node.traverseNextNode(document)){if(node instanceof HTMLElement){const element=(node);const tabIndex=element.tabIndex;if(tabIndex>=0&&(!exclusionSet||!exclusionSet.has(element))){this._tabIndexMap.set(element,tabIndex);element.tabIndex=-1;}}}}
_getMainWidgetTabIndexElements(splitWidget){const elementSet=(new Set());if(!splitWidget){return elementSet;}
const mainWidget=splitWidget.mainWidget();if(!mainWidget||!mainWidget.element){return elementSet;}
for(let node=mainWidget.element;node;node=node.traverseNextNode(mainWidget.element)){if(!(node instanceof HTMLElement)){continue;}
const element=(node);const tabIndex=element.tabIndex;if(tabIndex<0){continue;}
elementSet.add(element);}
return elementSet;}
_restoreTabIndexOnElements(){for(const element of this._tabIndexMap.keys()){element.tabIndex=(this._tabIndexMap.get(element));}
this._tabIndexMap.clear();}
_onKeyDown(event){if(this._closeOnEscape&&event.keyCode===UI.KeyboardShortcut.Keys.Esc.code&&UI.KeyboardShortcut.hasNoModifiers(event)){event.consume(true);this.hide();}}}
export const OutsideTabIndexBehavior={DisableAllOutsideTabIndex:Symbol('DisableAllTabIndex'),PreserveMainViewTabIndex:Symbol('PreserveMainViewTabIndex'),PreserveTabIndex:Symbol('PreserveTabIndex')};self.UI=self.UI||{};UI=UI||{};UI.Dialog=Dialog;UI.Dialog.OutsideTabIndexBehavior=OutsideTabIndexBehavior;