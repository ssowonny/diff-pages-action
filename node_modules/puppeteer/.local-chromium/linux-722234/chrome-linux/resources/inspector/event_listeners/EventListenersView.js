export class EventListenersView extends UI.VBox{constructor(changeCallback){super();this._changeCallback=changeCallback;this._treeOutline=new UI.TreeOutlineInShadow();this._treeOutline.hideOverflow();this._treeOutline.registerRequiredCSS('object_ui/objectValue.css');this._treeOutline.registerRequiredCSS('event_listeners/eventListenersView.css');this._treeOutline.setComparator(EventListenersTreeElement.comparator);this._treeOutline.element.classList.add('monospace');this._treeOutline.setShowSelectionOnKeyboardFocus(true);this._treeOutline.setFocusable(true);this.element.appendChild(this._treeOutline.element);this._emptyHolder=createElementWithClass('div','gray-info-message');this._emptyHolder.textContent=Common.UIString('No event listeners');this._emptyHolder.tabIndex=-1;this._linkifier=new Components.Linkifier();this._treeItemMap=new Map();}
focus(){if(!this._emptyHolder.parentNode){this._treeOutline.forceSelect();}else{this._emptyHolder.focus();}}
async addObjects(objects){this.reset();await Promise.all(objects.map(obj=>obj?this._addObject(obj):Promise.resolve()));this.addEmptyHolderIfNeeded();this._eventListenersArrivedForTest();}
_addObject(object){let eventListeners;let frameworkEventListenersObject=null;const promises=[];const domDebuggerModel=object.runtimeModel().target().model(SDK.DOMDebuggerModel);if(domDebuggerModel){promises.push(domDebuggerModel.eventListeners(object).then(storeEventListeners));}
promises.push(EventListeners.frameworkEventListeners(object).then(storeFrameworkEventListenersObject));return Promise.all(promises).then(markInternalEventListeners).then(addEventListeners.bind(this));function storeEventListeners(result){eventListeners=result;}
function storeFrameworkEventListenersObject(result){frameworkEventListenersObject=result;}
function markInternalEventListeners(){if(!frameworkEventListenersObject.internalHandlers){return Promise.resolve(undefined);}
return frameworkEventListenersObject.internalHandlers.object().callFunctionJSON(isInternalEventListener,eventListeners.map(handlerArgument)).then(setIsInternal);function handlerArgument(listener){return SDK.RemoteObject.toCallArgument(listener.handler());}
function isInternalEventListener(){const isInternal=[];const internalHandlersSet=new Set(this);for(const handler of arguments){isInternal.push(internalHandlersSet.has(handler));}
return isInternal;}
function setIsInternal(isInternal){for(let i=0;i<eventListeners.length;++i){if(isInternal[i]){eventListeners[i].markAsFramework();}}}}
function addEventListeners(){this._addObjectEventListeners(object,eventListeners);this._addObjectEventListeners(object,frameworkEventListenersObject.eventListeners);}}
_addObjectEventListeners(object,eventListeners){if(!eventListeners){return;}
for(const eventListener of eventListeners){const treeItem=this._getOrCreateTreeElementForType(eventListener.type());treeItem.addObjectEventListener(eventListener,object);}}
showFrameworkListeners(showFramework,showPassive,showBlocking){const eventTypes=this._treeOutline.rootElement().children();for(const eventType of eventTypes){let hiddenEventType=true;for(const listenerElement of eventType.children()){const listenerOrigin=listenerElement.eventListener().origin();let hidden=false;if(listenerOrigin===SDK.EventListener.Origin.FrameworkUser&&!showFramework){hidden=true;}
if(listenerOrigin===SDK.EventListener.Origin.Framework&&showFramework){hidden=true;}
if(!showPassive&&listenerElement.eventListener().passive()){hidden=true;}
if(!showBlocking&&!listenerElement.eventListener().passive()){hidden=true;}
listenerElement.hidden=hidden;hiddenEventType=hiddenEventType&&hidden;}
eventType.hidden=hiddenEventType;}}
_getOrCreateTreeElementForType(type){let treeItem=this._treeItemMap.get(type);if(!treeItem){treeItem=new EventListenersTreeElement(type,this._linkifier,this._changeCallback);this._treeItemMap.set(type,treeItem);treeItem.hidden=true;this._treeOutline.appendChild(treeItem);}
this._emptyHolder.remove();return treeItem;}
addEmptyHolderIfNeeded(){let allHidden=true;let firstVisibleChild=null;for(const eventType of this._treeOutline.rootElement().children()){eventType.hidden=!eventType.firstChild();allHidden=allHidden&&eventType.hidden;if(!firstVisibleChild&&!eventType.hidden){firstVisibleChild=eventType;}}
if(allHidden&&!this._emptyHolder.parentNode){this.element.appendChild(this._emptyHolder);}
if(firstVisibleChild){firstVisibleChild.select(true);}}
reset(){const eventTypes=this._treeOutline.rootElement().children();for(const eventType of eventTypes){eventType.removeChildren();}
this._linkifier.reset();}
_eventListenersArrivedForTest(){}}
export class EventListenersTreeElement extends UI.TreeElement{constructor(type,linkifier,changeCallback){super(type);this.toggleOnClick=true;this._linkifier=linkifier;this._changeCallback=changeCallback;}
static comparator(element1,element2){if(element1.title===element2.title){return 0;}
return element1.title>element2.title?1:-1;}
addObjectEventListener(eventListener,object){const treeElement=new ObjectEventListenerBar(eventListener,object,this._linkifier,this._changeCallback);this.appendChild((treeElement));}}
export class ObjectEventListenerBar extends UI.TreeElement{constructor(eventListener,object,linkifier,changeCallback){super('',true);this._eventListener=eventListener;this.editable=false;this._setTitle(object,linkifier);this._changeCallback=changeCallback;}
async onpopulate(){const properties=[];const eventListener=this._eventListener;const runtimeModel=eventListener.domDebuggerModel().runtimeModel();properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('useCapture',eventListener.useCapture()));properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('passive',eventListener.passive()));properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('once',eventListener.once()));if(typeof eventListener.handler()!=='undefined'){properties.push(new SDK.RemoteObjectProperty('handler',eventListener.handler()));}
ObjectUI.ObjectPropertyTreeElement.populateWithProperties(this,properties,[],true,null);}
_setTitle(object,linkifier){const title=this.listItemElement.createChild('span','event-listener-details');const subtitle=this.listItemElement.createChild('span','event-listener-tree-subtitle');const linkElement=linkifier.linkifyRawLocation(this._eventListener.location(),this._eventListener.sourceURL());subtitle.appendChild(linkElement);this._valueTitle=ObjectUI.ObjectPropertiesSection.createValueElement(object,false,false);title.appendChild(this._valueTitle);if(this._eventListener.canRemove()){const deleteButton=title.createChild('span','event-listener-button');deleteButton.textContent=Common.UIString('Remove');deleteButton.title=Common.UIString('Delete event listener');deleteButton.addEventListener('click',event=>{this._removeListener();event.consume();},false);title.appendChild(deleteButton);}
if(this._eventListener.isScrollBlockingType()&&this._eventListener.canTogglePassive()){const passiveButton=title.createChild('span','event-listener-button');passiveButton.textContent=Common.UIString('Toggle Passive');passiveButton.title=Common.UIString('Toggle whether event listener is passive or blocking');passiveButton.addEventListener('click',event=>{this._togglePassiveListener();event.consume();},false);title.appendChild(passiveButton);}
this.listItemElement.addEventListener('contextmenu',event=>{const menu=new UI.ContextMenu(event);if(event.target!==linkElement){menu.appendApplicableItems(linkElement);}
menu.defaultSection().appendItem(ls`Delete event listener`,this._removeListener.bind(this),!this._eventListener.canRemove());menu.defaultSection().appendCheckboxItem(ls`Passive`,this._togglePassiveListener.bind(this),this._eventListener.passive(),!this._eventListener.canTogglePassive());menu.show();});}
_removeListener(){this._removeListenerBar();this._eventListener.remove();}
_togglePassiveListener(){this._eventListener.togglePassive().then(this._changeCallback());}
_removeListenerBar(){const parent=this.parent;parent.removeChild(this);if(!parent.childCount()){parent.collapse();}
let allHidden=true;for(let i=0;i<parent.childCount();++i){if(!parent.childAt(i).hidden){allHidden=false;}}
parent.hidden=allHidden;}
eventListener(){return this._eventListener;}
onenter(){if(this._valueTitle){this._valueTitle.click();return true;}
return false;}}
self.EventListeners=self.EventListeners||{};EventListeners=EventListeners||{};EventListeners.EventListenersView=EventListenersView;EventListeners.EventListenersTreeElement=EventListenersTreeElement;EventListeners.ObjectEventListenerBar=ObjectEventListenerBar;EventListeners.EventListenersResult;