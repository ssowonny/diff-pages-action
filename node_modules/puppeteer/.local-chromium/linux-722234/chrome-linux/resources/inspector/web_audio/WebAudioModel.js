export class WebAudioModel extends SDK.SDKModel{constructor(target){super(target);this._enabled=false;this._agent=target.webAudioAgent();target.registerWebAudioDispatcher(this);SDK.targetManager.addModelListener(SDK.ResourceTreeModel,SDK.ResourceTreeModel.Events.FrameNavigated,this._flushContexts,this);}
_flushContexts(){this.dispatchEventToListeners(Events.ModelReset);}
suspendModel(){this.dispatchEventToListeners(Events.ModelSuspend);return this._agent.disable();}
resumeModel(){if(!this._enabled){return Promise.resolve();}
return this._agent.enable();}
ensureEnabled(){if(this._enabled){return;}
this._agent.enable();this._enabled=true;}
contextCreated(context){this.dispatchEventToListeners(Events.ContextCreated,context);}
contextWillBeDestroyed(contextId){this.dispatchEventToListeners(Events.ContextDestroyed,contextId);}
contextChanged(context){this.dispatchEventToListeners(Events.ContextChanged,context);}
audioListenerCreated(listener){this.dispatchEventToListeners(Events.AudioListenerCreated,listener);}
audioListenerWillBeDestroyed(contextId,listenerId){this.dispatchEventToListeners(Events.AudioListenerWillBeDestroyed,{contextId,listenerId});}
audioNodeCreated(node){this.dispatchEventToListeners(Events.AudioNodeCreated,node);}
audioNodeWillBeDestroyed(contextId,nodeId){this.dispatchEventToListeners(Events.AudioNodeWillBeDestroyed,{contextId,nodeId});}
audioParamCreated(param){this.dispatchEventToListeners(Events.AudioParamCreated,param);}
audioParamWillBeDestroyed(contextId,nodeId,paramId){this.dispatchEventToListeners(Events.AudioParamWillBeDestroyed,{contextId,paramId});}
nodesConnected(contextId,sourceId,destinationId,sourceOutputIndex,destinationInputIndex){this.dispatchEventToListeners(Events.NodesConnected,{contextId,sourceId,destinationId,sourceOutputIndex,destinationInputIndex});}
nodesDisconnected(contextId,sourceId,destinationId,sourceOutputIndex,destinationInputIndex){this.dispatchEventToListeners(Events.NodesDisconnected,{contextId,sourceId,destinationId,sourceOutputIndex,destinationInputIndex});}
nodeParamConnected(contextId,sourceId,destinationId,sourceOutputIndex){this.dispatchEventToListeners(Events.NodeParamConnected,{contextId,sourceId,destinationId,sourceOutputIndex,});}
nodeParamDisconnected(contextId,sourceId,destinationId,sourceOutputIndex){this.dispatchEventToListeners(Events.NodeParamDisconnected,{contextId,sourceId,destinationId,sourceOutputIndex,});}
async requestRealtimeData(contextId){return await this._agent.getRealtimeData(contextId);}}
SDK.SDKModel.register(WebAudioModel,SDK.Target.Capability.DOM,false);export const Events={ContextCreated:Symbol('ContextCreated'),ContextDestroyed:Symbol('ContextDestroyed'),ContextChanged:Symbol('ContextChanged'),ModelReset:Symbol('ModelReset'),ModelSuspend:Symbol('ModelSuspend'),AudioListenerCreated:Symbol('AudioListenerCreated'),AudioListenerWillBeDestroyed:Symbol('AudioListenerWillBeDestroyed'),AudioNodeCreated:Symbol('AudioNodeCreated'),AudioNodeWillBeDestroyed:Symbol('AudioNodeWillBeDestroyed'),AudioParamCreated:Symbol('AudioParamCreated'),AudioParamWillBeDestroyed:Symbol('AudioParamWillBeDestroyed'),NodesConnected:Symbol('NodesConnected'),NodesDisconnected:Symbol('NodesDisconnected'),NodeParamConnected:Symbol('NodeParamConnected'),NodeParamDisconnected:Symbol('NodeParamDisconnected'),};self.WebAudio=self.WebAudio||{};WebAudio=WebAudio||{};WebAudio.WebAudioModel=WebAudioModel;WebAudio.WebAudioModel.Events=Events;