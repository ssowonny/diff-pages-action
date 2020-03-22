export function frameworkEventListeners(object){const domDebuggerModel=object.runtimeModel().target().model(SDK.DOMDebuggerModel);if(!domDebuggerModel){return Promise.resolve(({eventListeners:[],internalHandlers:null}));}
const listenersResult=({eventListeners:[]});return object.callFunction(frameworkEventListenersImpl,undefined).then(assertCallFunctionResult).then(getOwnProperties).then(createEventListeners).then(returnResult).catchException(listenersResult);function getOwnProperties(object){return object.getOwnProperties(false);}
function createEventListeners(result){if(!result.properties){throw new Error('Object properties is empty');}
const promises=[];for(const property of result.properties){if(property.name==='eventListeners'&&property.value){promises.push(convertToEventListeners(property.value).then(storeEventListeners));}
if(property.name==='internalHandlers'&&property.value){promises.push(convertToInternalHandlers(property.value).then(storeInternalHandlers));}
if(property.name==='errorString'&&property.value){printErrorString(property.value);}}
return(Promise.all(promises));}
function convertToEventListeners(pageEventListenersObject){return SDK.RemoteArray.objectAsArray(pageEventListenersObject).map(toEventListener).then(filterOutEmptyObjects);function toEventListener(listenerObject){let type;let useCapture;let passive;let once;let handler=null;let originalHandler=null;let location=null;let removeFunctionObject=null;const promises=[];promises.push(listenerObject.callFunctionJSON(truncatePageEventListener,undefined).then(storeTruncatedListener));function truncatePageEventListener(){return{type:this.type,useCapture:this.useCapture,passive:this.passive,once:this.once};}
function storeTruncatedListener(truncatedListener){type=truncatedListener.type;useCapture=truncatedListener.useCapture;passive=truncatedListener.passive;once=truncatedListener.once;}
promises.push(listenerObject.callFunction(handlerFunction).then(assertCallFunctionResult).then(storeOriginalHandler).then(toTargetFunction).then(storeFunctionWithDetails));function handlerFunction(){return this.handler;}
function storeOriginalHandler(functionObject){originalHandler=functionObject;return originalHandler;}
function storeFunctionWithDetails(functionObject){handler=functionObject;return(functionObject.debuggerModel().functionDetailsPromise(functionObject).then(storeFunctionDetails));}
function storeFunctionDetails(functionDetails){location=functionDetails?functionDetails.location:null;}
promises.push(listenerObject.callFunction(getRemoveFunction).then(assertCallFunctionResult).then(storeRemoveFunction));function getRemoveFunction(){return this.remove;}
function storeRemoveFunction(functionObject){if(functionObject.type!=='function'){return;}
removeFunctionObject=functionObject;}
return Promise.all(promises).then(createEventListener).catchException((null));function createEventListener(){if(!location){throw new Error('Empty event listener\'s location');}
return new SDK.EventListener((domDebuggerModel),object,type,useCapture,passive,once,handler,originalHandler,location,removeFunctionObject,SDK.EventListener.Origin.FrameworkUser);}}}
function convertToInternalHandlers(pageInternalHandlersObject){return SDK.RemoteArray.objectAsArray(pageInternalHandlersObject).map(toTargetFunction).then(SDK.RemoteArray.createFromRemoteObjects.bind(null));}
function toTargetFunction(functionObject){return SDK.RemoteFunction.objectAsFunction(functionObject).targetFunction();}
function storeEventListeners(eventListeners){listenersResult.eventListeners=eventListeners;}
function storeInternalHandlers(internalHandlers){listenersResult.internalHandlers=internalHandlers;}
function printErrorString(errorString){Common.console.error(String(errorString.value));}
function returnResult(){return listenersResult;}
function assertCallFunctionResult(result){if(result.wasThrown||!result.object){throw new Error('Exception in callFunction or empty result');}
return result.object;}
function filterOutEmptyObjects(objects){return objects.filter(filterOutEmpty);function filterOutEmpty(object){return!!object;}}
function frameworkEventListenersImpl(){const errorLines=[];let eventListeners=[];let internalHandlers=[];let fetchers=[jQueryFetcher];try{if(self.devtoolsFrameworkEventListeners&&isArrayLike(self.devtoolsFrameworkEventListeners)){fetchers=fetchers.concat(self.devtoolsFrameworkEventListeners);}}catch(e){errorLines.push('devtoolsFrameworkEventListeners call produced error: '+toString(e));}
for(let i=0;i<fetchers.length;++i){try{const fetcherResult=fetchers[i](this);if(fetcherResult.eventListeners&&isArrayLike(fetcherResult.eventListeners)){eventListeners=eventListeners.concat(fetcherResult.eventListeners.map(checkEventListener).filter(nonEmptyObject));}
if(fetcherResult.internalHandlers&&isArrayLike(fetcherResult.internalHandlers)){internalHandlers=internalHandlers.concat(fetcherResult.internalHandlers.map(checkInternalHandler).filter(nonEmptyObject));}}catch(e){errorLines.push('fetcher call produced error: '+toString(e));}}
const result={eventListeners:eventListeners};if(internalHandlers.length){result.internalHandlers=internalHandlers;}
if(errorLines.length){let errorString='Framework Event Listeners API Errors:\n\t'+errorLines.join('\n\t');errorString=errorString.substr(0,errorString.length-1);result.errorString=errorString;}
return result;function isArrayLike(obj){if(!obj||typeof obj!=='object'){return false;}
try{if(typeof obj.splice==='function'){const len=obj.length;return typeof len==='number'&&(len>>>0===len&&(len>0||1/len>0));}}catch(e){}
return false;}
function checkEventListener(eventListener){try{let errorString='';if(!eventListener){errorString+='empty event listener, ';}
const type=eventListener.type;if(!type||(typeof type!=='string')){errorString+='event listener\'s type isn\'t string or empty, ';}
const useCapture=eventListener.useCapture;if(typeof useCapture!=='boolean'){errorString+='event listener\'s useCapture isn\'t boolean or undefined, ';}
const passive=eventListener.passive;if(typeof passive!=='boolean'){errorString+='event listener\'s passive isn\'t boolean or undefined, ';}
const once=eventListener.once;if(typeof once!=='boolean'){errorString+='event listener\'s once isn\'t boolean or undefined, ';}
const handler=eventListener.handler;if(!handler||(typeof handler!=='function')){errorString+='event listener\'s handler isn\'t a function or empty, ';}
const remove=eventListener.remove;if(remove&&(typeof remove!=='function')){errorString+='event listener\'s remove isn\'t a function, ';}
if(!errorString){return{type:type,useCapture:useCapture,passive:passive,once:once,handler:handler,remove:remove};}else{errorLines.push(errorString.substr(0,errorString.length-2));return null;}}catch(e){errorLines.push(toString(e));return null;}}
function checkInternalHandler(handler){if(handler&&(typeof handler==='function')){return handler;}
errorLines.push('internal handler isn\'t a function or empty');return null;}
function toString(obj){try{return''+obj;}catch(e){return'<error>';}}
function nonEmptyObject(obj){return!!obj;}
function jQueryFetcher(node){if(!node||!(node instanceof Node)){return{eventListeners:[]};}
const jQuery=(window['jQuery']);if(!jQuery||!jQuery.fn){return{eventListeners:[]};}
const jQueryFunction=(jQuery);const data=jQuery._data||jQuery.data;const eventListeners=[];const internalHandlers=[];if(typeof data==='function'){const events=data(node,'events');for(const type in events){for(const key in events[type]){const frameworkListener=events[type][key];if(typeof frameworkListener==='object'||typeof frameworkListener==='function'){const listener={handler:frameworkListener.handler||frameworkListener,useCapture:true,passive:false,once:false,type:type};listener.remove=jQueryRemove.bind(node,frameworkListener.selector);eventListeners.push(listener);}}}
const nodeData=data(node);if(nodeData&&typeof nodeData.handle==='function'){internalHandlers.push(nodeData.handle);}}
const entry=jQueryFunction(node)[0];if(entry){const entryEvents=entry['$events'];for(const type in entryEvents){const events=entryEvents[type];for(const key in events){if(typeof events[key]==='function'){const listener={handler:events[key],useCapture:true,passive:false,once:false,type:type};eventListeners.push(listener);}}}
if(entry&&entry['$handle']){internalHandlers.push(entry['$handle']);}}
return{eventListeners:eventListeners,internalHandlers:internalHandlers};}
function jQueryRemove(selector,type,handler){if(!this||!(this instanceof Node)){return;}
const node=(this);const jQuery=(window['jQuery']);if(!jQuery||!jQuery.fn){return;}
const jQueryFunction=(jQuery);jQueryFunction(node).off(type,selector,handler);}}}
self.EventListeners=self.EventListeners||{};EventListeners=EventListeners||{};EventListeners.frameworkEventListeners=frameworkEventListeners;EventListeners.FrameworkEventListenersObject;EventListeners.EventListenerObjectInInspectedPage;