export class ProtocolService extends Common.Object{constructor(){super();this._rawConnection=null;this._backend=null;this._backendPromise=null;this._status=null;}
async attach(){await SDK.targetManager.suspendAllTargets();const childTargetManager=SDK.targetManager.mainTarget().model(SDK.ChildTargetManager);this._rawConnection=await childTargetManager.createParallelConnection(this._dispatchProtocolMessage.bind(this));}
startLighthouse(auditURL,categoryIDs,flags){return this._send('start',{url:auditURL,categoryIDs,flags});}
async detach(){await this._send('stop');await this._backend.dispose();delete this._backend;delete this._backendPromise;await this._rawConnection.disconnect();await SDK.targetManager.resumeAllTargets();}
registerStatusCallback(callback){this._status=callback;}
_dispatchProtocolMessage(message){this._send('dispatchProtocolMessage',{message:JSON.stringify(message)});}
_initWorker(){this._backendPromise=Services.serviceManager.createAppService('audits_worker','AuditsService').then(backend=>{if(this._backend){return;}
this._backend=backend;this._backend.on('statusUpdate',result=>this._status(result.message));this._backend.on('sendProtocolMessage',result=>this._sendProtocolMessage(result.message));});}
_sendProtocolMessage(message){this._rawConnection.sendRawMessage(message);}
_send(method,params){if(!this._backendPromise){this._initWorker();}
return this._backendPromise.then(_=>this._backend.send(method,params));}}
self.Audits=self.Audits||{};Audits=Audits||{};Audits.ProtocolService=ProtocolService;