export class HeapSnapshotWorkerDispatcher{constructor(globalObject,postMessage){this._objects=[];this._global=globalObject;this._postMessage=postMessage;}
_findFunction(name){const path=name.split('.');let result=this._global;for(let i=0;i<path.length;++i){result=result[path[i]];}
return result;}
sendEvent(name,data){this._postMessage({eventName:name,data:data});}
dispatchMessage(event){const data=(event.data);const response={callId:data.callId};try{switch(data.disposition){case'create':const constructorFunction=this._findFunction(data.methodName);this._objects[data.objectId]=new constructorFunction(this);break;case'dispose':delete this._objects[data.objectId];break;case'getter':{const object=this._objects[data.objectId];const result=object[data.methodName];response.result=result;break;}
case'factory':{const object=this._objects[data.objectId];const result=object[data.methodName].apply(object,data.methodArguments);if(result){this._objects[data.newObjectId]=result;}
response.result=!!result;break;}
case'method':{const object=this._objects[data.objectId];response.result=object[data.methodName].apply(object,data.methodArguments);break;}
case'evaluateForTest':try{response.result=self.eval(data.source);}catch(e){response.result=e.toString();}
break;}}catch(e){response.error=e.toString();response.errorCallStack=e.stack;if(data.methodName){response.errorMethodName=data.methodName;}}
this._postMessage(response);}}
self.HeapSnapshotWorker=self.HeapSnapshotWorker||{};HeapSnapshotWorker=HeapSnapshotWorker||{};HeapSnapshotWorker.HeapSnapshotWorkerDispatcher=HeapSnapshotWorkerDispatcher;