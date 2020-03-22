export class TimelineModelImpl{constructor(){this._reset();}
static forEachEvent(events,onStartEvent,onEndEvent,onInstantEvent,startTime,endTime,filter){startTime=startTime||0;endTime=endTime||Infinity;const stack=[];const startEvent=TimelineModelImpl._topLevelEventEndingAfter(events,startTime);for(let i=startEvent;i<events.length;++i){const e=events[i];if((e.endTime||e.startTime)<startTime){continue;}
if(e.startTime>=endTime){break;}
if(SDK.TracingModel.isAsyncPhase(e.phase)||SDK.TracingModel.isFlowPhase(e.phase)){continue;}
while(stack.length&&stack.peekLast().endTime<=e.startTime){onEndEvent(stack.pop());}
if(filter&&!filter(e)){continue;}
if(e.duration){onStartEvent(e);stack.push(e);}else{onInstantEvent&&onInstantEvent(e,stack.peekLast()||null);}}
while(stack.length){onEndEvent(stack.pop());}}
static _topLevelEventEndingAfter(events,time){let index=events.upperBound(time,(time,event)=>time-event.startTime)-1;while(index>0&&!SDK.TracingModel.isTopLevelEvent(events[index])){index--;}
return Math.max(index,0);}
isMarkerEvent(event){const recordTypes=RecordType;switch(event.name){case recordTypes.TimeStamp:return true;case recordTypes.MarkFirstPaint:case recordTypes.MarkFCP:case recordTypes.MarkFMP:return this._mainFrame&&event.args.frame===this._mainFrame.frameId&&!!event.args.data;case recordTypes.MarkDOMContent:case recordTypes.MarkLoad:case recordTypes.MarkLCPCandidate:case recordTypes.MarkLCPInvalidate:return!!event.args['data']['isMainFrame'];default:return false;}}
isLCPCandidateEvent(event){return event.name===RecordType.MarkLCPCandidate&&!!event.args['data']['isMainFrame'];}
isLCPInvalidateEvent(event){return event.name===RecordType.MarkLCPInvalidate&&!!event.args['data']['isMainFrame'];}
static globalEventId(event,field){const data=event.args['data']||event.args['beginData'];const id=data&&data[field];if(!id){return'';}
return`${event.thread.process().id()}.${id}`;}
static eventFrameId(event){const data=event.args['data']||event.args['beginData'];return data&&data['frame']||'';}
cpuProfiles(){return this._cpuProfiles;}
targetByEvent(event){const workerId=this._workerIdByThread.get(event.thread);const mainTarget=SDK.targetManager.mainTarget();return workerId?SDK.targetManager.targetById(workerId):mainTarget;}
setEvents(tracingModel){this._reset();this._resetProcessingState();this._tracingModel=tracingModel;this._minimumRecordTime=tracingModel.minimumRecordTime();this._maximumRecordTime=tracingModel.maximumRecordTime();this._processSyncBrowserEvents(tracingModel);if(this._browserFrameTracking){this._processThreadsForBrowserFrames(tracingModel);}else{const metadataEvents=this._processMetadataEvents(tracingModel);this._isGenericTrace=!metadataEvents;if(metadataEvents){this._processMetadataAndThreads(tracingModel,metadataEvents);}else{this._processGenericTrace(tracingModel);}}
this._inspectedTargetEvents.sort(SDK.TracingModel.Event.compareStartTime);this._processAsyncBrowserEvents(tracingModel);this._buildGPUEvents(tracingModel);this._resetProcessingState();}
_processGenericTrace(tracingModel){let browserMainThread=SDK.TracingModel.browserMainThread(tracingModel);if(!browserMainThread&&tracingModel.sortedProcesses().length){browserMainThread=tracingModel.sortedProcesses()[0].sortedThreads()[0];}
for(const process of tracingModel.sortedProcesses()){for(const thread of process.sortedThreads()){this._processThreadEvents(tracingModel,[{from:0,to:Infinity}],thread,thread===browserMainThread,false,true,null);}}}
_processMetadataAndThreads(tracingModel,metadataEvents){let startTime=0;for(let i=0,length=metadataEvents.page.length;i<length;i++){const metaEvent=metadataEvents.page[i];const process=metaEvent.thread.process();const endTime=i+1<length?metadataEvents.page[i+1].startTime:Infinity;if(startTime===endTime){continue;}
this._legacyCurrentPage=metaEvent.args['data']&&metaEvent.args['data']['page'];for(const thread of process.sortedThreads()){let workerUrl=null;if(thread.name()===TimelineModelImpl.WorkerThreadName||thread.name()===TimelineModelImpl.WorkerThreadNameLegacy){const workerMetaEvent=metadataEvents.workers.find(e=>{if(e.args['data']['workerThreadId']!==thread.id()){return false;}
if(e.args['data']['sessionId']===this._sessionId){return true;}
return!!this._pageFrames.get(TimelineModelImpl.eventFrameId(e));});if(!workerMetaEvent){continue;}
const workerId=workerMetaEvent.args['data']['workerId'];if(workerId){this._workerIdByThread.set(thread,workerId);}
workerUrl=workerMetaEvent.args['data']['url']||'';}
this._processThreadEvents(tracingModel,[{from:startTime,to:endTime}],thread,thread===metaEvent.thread,!!workerUrl,true,workerUrl);}
startTime=endTime;}}
_processThreadsForBrowserFrames(tracingModel){const processData=new Map();for(const frame of this._pageFrames.values()){for(let i=0;i<frame.processes.length;i++){const pid=frame.processes[i].processId;let data=processData.get(pid);if(!data){data=[];processData.set(pid,data);}
const to=i===frame.processes.length-1?(frame.deletedTime||Infinity):frame.processes[i+1].time;data.push({from:frame.processes[i].time,to:to,main:!frame.parent,url:frame.processes[i].url});}}
const allMetadataEvents=tracingModel.devToolsMetadataEvents();for(const process of tracingModel.sortedProcesses()){const data=processData.get(process.id());if(!data){continue;}
data.sort((a,b)=>a.from-b.from||a.to-b.to);const ranges=[];let lastUrl=null;let lastMainUrl=null;let hasMain=false;for(const item of data){if(!ranges.length||item.from>ranges.peekLast().to){ranges.push({from:item.from,to:item.to});}else{ranges.peekLast().to=item.to;}
if(item.main){hasMain=true;}
if(item.url){if(item.main){lastMainUrl=item.url;}
lastUrl=item.url;}}
for(const thread of process.sortedThreads()){if(thread.name()===TimelineModelImpl.RendererMainThreadName){this._processThreadEvents(tracingModel,ranges,thread,true,false,hasMain,hasMain?lastMainUrl:lastUrl);}else if(thread.name()===TimelineModelImpl.WorkerThreadName||thread.name()===TimelineModelImpl.WorkerThreadNameLegacy){const workerMetaEvent=allMetadataEvents.find(e=>{if(e.name!==TimelineModelImpl.DevToolsMetadataEvent.TracingSessionIdForWorker){return false;}
if(e.thread.process()!==process){return false;}
if(e.args['data']['workerThreadId']!==thread.id()){return false;}
return!!this._pageFrames.get(TimelineModelImpl.eventFrameId(e));});if(!workerMetaEvent){continue;}
this._workerIdByThread.set(thread,workerMetaEvent.args['data']['workerId']||'');this._processThreadEvents(tracingModel,ranges,thread,false,true,false,workerMetaEvent.args['data']['url']||'');}else{this._processThreadEvents(tracingModel,ranges,thread,false,false,false,null);}}}}
_processMetadataEvents(tracingModel){const metadataEvents=tracingModel.devToolsMetadataEvents();const pageDevToolsMetadataEvents=[];const workersDevToolsMetadataEvents=[];for(const event of metadataEvents){if(event.name===TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInPage){pageDevToolsMetadataEvents.push(event);if(event.args['data']&&event.args['data']['persistentIds']){this._persistentIds=true;}
const frames=((event.args['data']&&event.args['data']['frames'])||[]);frames.forEach(payload=>this._addPageFrame(event,payload));this._mainFrame=this.rootFrames()[0];}else if(event.name===TimelineModelImpl.DevToolsMetadataEvent.TracingSessionIdForWorker){workersDevToolsMetadataEvents.push(event);}else if(event.name===TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser){console.assert(!this._mainFrameNodeId,'Multiple sessions in trace');this._mainFrameNodeId=event.args['frameTreeNodeId'];}}
if(!pageDevToolsMetadataEvents.length){return null;}
const sessionId=pageDevToolsMetadataEvents[0].args['sessionId']||pageDevToolsMetadataEvents[0].args['data']['sessionId'];this._sessionId=sessionId;const mismatchingIds=new Set();function checkSessionId(event){let args=event.args;if(args['data']){args=args['data'];}
const id=args['sessionId'];if(id===sessionId){return true;}
mismatchingIds.add(id);return false;}
const result={page:pageDevToolsMetadataEvents.filter(checkSessionId).sort(SDK.TracingModel.Event.compareStartTime),workers:workersDevToolsMetadataEvents.sort(SDK.TracingModel.Event.compareStartTime)};if(mismatchingIds.size){Common.console.error('Timeline recording was started in more than one page simultaneously. Session id mismatch: '+
this._sessionId+' and '+mismatchingIds.valuesArray()+'.');}
return result;}
_processSyncBrowserEvents(tracingModel){const browserMain=SDK.TracingModel.browserMainThread(tracingModel);if(browserMain){browserMain.events().forEach(this._processBrowserEvent,this);}}
_processAsyncBrowserEvents(tracingModel){const browserMain=SDK.TracingModel.browserMainThread(tracingModel);if(browserMain){this._processAsyncEvents(browserMain,[{from:0,to:Infinity}]);}}
_buildGPUEvents(tracingModel){const thread=tracingModel.threadByName('GPU Process','CrGpuMain');if(!thread){return;}
const gpuEventName=RecordType.GPUTask;const track=this._ensureNamedTrack(TrackType.GPU);track.thread=thread;track.events=thread.events().filter(event=>event.name===gpuEventName);}
_resetProcessingState(){this._asyncEventTracker=new TimelineAsyncEventTracker();this._invalidationTracker=new InvalidationTracker();this._layoutInvalidate={};this._lastScheduleStyleRecalculation={};this._paintImageEventByPixelRefId={};this._lastPaintForLayer={};this._lastRecalculateStylesEvent=null;this._currentScriptEvent=null;this._eventStack=[];this._knownInputEvents=new Set();this._browserFrameTracking=false;this._persistentIds=false;this._legacyCurrentPage=null;}
_extractCpuProfile(tracingModel,thread){const events=thread.events();let cpuProfile;let target=null;let cpuProfileEvent=events.peekLast();if(cpuProfileEvent&&cpuProfileEvent.name===RecordType.CpuProfile){const eventData=cpuProfileEvent.args['data'];cpuProfile=(eventData&&eventData['cpuProfile']);target=this.targetByEvent(cpuProfileEvent);}
if(!cpuProfile){cpuProfileEvent=events.find(e=>e.name===RecordType.Profile);if(!cpuProfileEvent){return null;}
target=this.targetByEvent(cpuProfileEvent);const profileGroup=tracingModel.profileGroup(cpuProfileEvent);if(!profileGroup){Common.console.error('Invalid CPU profile format.');return null;}
cpuProfile=({startTime:cpuProfileEvent.args['data']['startTime'],endTime:0,nodes:[],samples:[],timeDeltas:[],lines:[]});for(const profileEvent of profileGroup.children){const eventData=profileEvent.args['data'];if('startTime'in eventData){cpuProfile.startTime=eventData['startTime'];}
if('endTime'in eventData){cpuProfile.endTime=eventData['endTime'];}
const nodesAndSamples=eventData['cpuProfile']||{};const samples=nodesAndSamples['samples']||[];const lines=eventData['lines']||Array(samples.length).fill(0);cpuProfile.nodes.pushAll(nodesAndSamples['nodes']||[]);cpuProfile.lines.pushAll(lines);cpuProfile.samples.pushAll(samples);cpuProfile.timeDeltas.pushAll(eventData['timeDeltas']||[]);if(cpuProfile.samples.length!==cpuProfile.timeDeltas.length){Common.console.error('Failed to parse CPU profile.');return null;}}
if(!cpuProfile.endTime){cpuProfile.endTime=cpuProfile.timeDeltas.reduce((x,y)=>x+y,cpuProfile.startTime);}}
try{const jsProfileModel=new SDK.CPUProfileDataModel(cpuProfile,target);this._cpuProfiles.push(jsProfileModel);return jsProfileModel;}catch(e){Common.console.error('Failed to parse CPU profile.');}
return null;}
_injectJSFrameEvents(tracingModel,thread){const jsProfileModel=this._extractCpuProfile(tracingModel,thread);let events=thread.events();const jsSamples=jsProfileModel?TimelineModel.TimelineJSProfileProcessor.generateTracingEventsFromCpuProfile(jsProfileModel,thread):null;if(jsSamples&&jsSamples.length){events=events.mergeOrdered(jsSamples,SDK.TracingModel.Event.orderedCompareStartTime);}
if(jsSamples||events.some(e=>e.name===RecordType.JSSample)){const jsFrameEvents=TimelineModel.TimelineJSProfileProcessor.generateJSFrameEvents(events);if(jsFrameEvents&&jsFrameEvents.length){events=jsFrameEvents.mergeOrdered(events,SDK.TracingModel.Event.orderedCompareStartTime);}}
return events;}
_processThreadEvents(tracingModel,ranges,thread,isMainThread,isWorker,forMainFrame,url){const track=new Track();track.name=thread.name()||ls`Thread ${thread.id()}`;track.type=TrackType.Other;track.thread=thread;if(isMainThread){track.type=TrackType.MainThread;track.url=url||null;track.forMainFrame=forMainFrame;}else if(isWorker){track.type=TrackType.Worker;track.url=url;}else if(thread.name().startsWith('CompositorTileWorker')){track.type=TrackType.Raster;}
this._tracks.push(track);const events=this._injectJSFrameEvents(tracingModel,thread);this._eventStack=[];const eventStack=this._eventStack;for(const range of ranges){let i=events.lowerBound(range.from,(time,event)=>time-event.startTime);for(;i<events.length;i++){const event=events[i];if(event.startTime>=range.to){break;}
while(eventStack.length&&eventStack.peekLast().endTime<=event.startTime){eventStack.pop();}
if(!this._processEvent(event)){continue;}
if(!SDK.TracingModel.isAsyncPhase(event.phase)&&event.duration){if(eventStack.length){const parent=eventStack.peekLast();parent.selfTime-=event.duration;if(parent.selfTime<0){this._fixNegativeDuration(parent,event);}}
event.selfTime=event.duration;if(!eventStack.length){track.tasks.push(event);}
eventStack.push(event);}
if(this.isMarkerEvent(event)){this._timeMarkerEvents.push(event);}
track.events.push(event);this._inspectedTargetEvents.push(event);}}
this._processAsyncEvents(thread,ranges);}
_fixNegativeDuration(event,child){const epsilon=1e-3;if(event.selfTime<-epsilon){console.error(`Children are longer than parent at ${event.startTime} `+`(${(child.startTime - this.minimumRecordTime()).toFixed(3)} by ${(-event.selfTime).toFixed(3)}`);}
event.selfTime=0;}
_processAsyncEvents(thread,ranges){const asyncEvents=thread.asyncEvents();const groups=new Map();function group(type){if(!groups.has(type)){groups.set(type,[]);}
return groups.get(type);}
for(const range of ranges){let i=asyncEvents.lowerBound(range.from,function(time,asyncEvent){return time-asyncEvent.startTime;});for(;i<asyncEvents.length;++i){const asyncEvent=asyncEvents[i];if(asyncEvent.startTime>=range.to){break;}
if(asyncEvent.hasCategory(TimelineModelImpl.Category.Console)){group(TrackType.Console).push(asyncEvent);continue;}
if(asyncEvent.hasCategory(TimelineModelImpl.Category.UserTiming)){group(TrackType.Timings).push(asyncEvent);continue;}
if(asyncEvent.name===RecordType.Animation){group(TrackType.Animation).push(asyncEvent);continue;}
if(asyncEvent.hasCategory(TimelineModelImpl.Category.LatencyInfo)||asyncEvent.name===RecordType.ImplSideFling){const lastStep=asyncEvent.steps.peekLast();if(lastStep.phase!==SDK.TracingModel.Phase.AsyncEnd){continue;}
const data=lastStep.args['data'];asyncEvent.causedFrame=!!(data&&data['INPUT_EVENT_LATENCY_RENDERER_SWAP_COMPONENT']);if(asyncEvent.hasCategory(TimelineModelImpl.Category.LatencyInfo)){if(!this._knownInputEvents.has(lastStep.id)){continue;}
if(asyncEvent.name===RecordType.InputLatencyMouseMove&&!asyncEvent.causedFrame){continue;}
if(data['is_coalesced']){continue;}
const rendererMain=data['INPUT_EVENT_LATENCY_RENDERER_MAIN_COMPONENT'];if(rendererMain){const time=rendererMain['time']/1000;TimelineData.forEvent(asyncEvent.steps[0]).timeWaitingForMainThread=time-asyncEvent.steps[0].startTime;}}
group(TrackType.Input).push(asyncEvent);continue;}}}
for(const[type,events]of groups){const track=this._ensureNamedTrack(type);track.thread=thread;track.asyncEvents=track.asyncEvents.mergeOrdered(events,SDK.TracingModel.Event.compareStartTime);}}
_processEvent(event){const recordTypes=RecordType;const eventStack=this._eventStack;if(!eventStack.length){if(this._currentTaskLayoutAndRecalcEvents&&this._currentTaskLayoutAndRecalcEvents.length){const totalTime=this._currentTaskLayoutAndRecalcEvents.reduce((time,event)=>time+event.duration,0);if(totalTime>TimelineModelImpl.Thresholds.ForcedLayout){for(const e of this._currentTaskLayoutAndRecalcEvents){const timelineData=TimelineData.forEvent(e);timelineData.warning=e.name===recordTypes.Layout?TimelineModelImpl.WarningType.ForcedLayout:TimelineModelImpl.WarningType.ForcedStyle;}}}
this._currentTaskLayoutAndRecalcEvents=[];}
if(this._currentScriptEvent&&event.startTime>this._currentScriptEvent.endTime){this._currentScriptEvent=null;}
const eventData=event.args['data']||event.args['beginData']||{};const timelineData=TimelineData.forEvent(event);if(eventData['stackTrace']){timelineData.stackTrace=eventData['stackTrace'];}
if(timelineData.stackTrace&&event.name!==recordTypes.JSSample){for(let i=0;i<timelineData.stackTrace.length;++i){--timelineData.stackTrace[i].lineNumber;--timelineData.stackTrace[i].columnNumber;}}
let pageFrameId=TimelineModelImpl.eventFrameId(event);if(!pageFrameId&&eventStack.length){pageFrameId=TimelineData.forEvent(eventStack.peekLast()).frameId;}
timelineData.frameId=pageFrameId||(this._mainFrame&&this._mainFrame.frameId)||'';this._asyncEventTracker.processEvent(event);if(this.isMarkerEvent(event)){this._ensureNamedTrack(TrackType.Timings);}
switch(event.name){case recordTypes.ResourceSendRequest:case recordTypes.WebSocketCreate:timelineData.setInitiator(eventStack.peekLast()||null);timelineData.url=eventData['url'];break;case recordTypes.ScheduleStyleRecalculation:this._lastScheduleStyleRecalculation[eventData['frame']]=event;break;case recordTypes.UpdateLayoutTree:case recordTypes.RecalculateStyles:this._invalidationTracker.didRecalcStyle(event);if(event.args['beginData']){timelineData.setInitiator(this._lastScheduleStyleRecalculation[event.args['beginData']['frame']]);}
this._lastRecalculateStylesEvent=event;if(this._currentScriptEvent){this._currentTaskLayoutAndRecalcEvents.push(event);}
break;case recordTypes.ScheduleStyleInvalidationTracking:case recordTypes.StyleRecalcInvalidationTracking:case recordTypes.StyleInvalidatorInvalidationTracking:case recordTypes.LayoutInvalidationTracking:this._invalidationTracker.addInvalidation(new InvalidationTrackingEvent(event));break;case recordTypes.InvalidateLayout:{let layoutInitator=event;const frameId=eventData['frame'];if(!this._layoutInvalidate[frameId]&&this._lastRecalculateStylesEvent&&this._lastRecalculateStylesEvent.endTime>event.startTime){layoutInitator=TimelineData.forEvent(this._lastRecalculateStylesEvent).initiator();}
this._layoutInvalidate[frameId]=layoutInitator;break;}
case recordTypes.Layout:{this._invalidationTracker.didLayout(event);const frameId=event.args['beginData']['frame'];timelineData.setInitiator(this._layoutInvalidate[frameId]);if(event.args['endData']){timelineData.backendNodeId=event.args['endData']['rootNode'];}
this._layoutInvalidate[frameId]=null;if(this._currentScriptEvent){this._currentTaskLayoutAndRecalcEvents.push(event);}
break;}
case recordTypes.Task:if(event.duration>TimelineModelImpl.Thresholds.LongTask){timelineData.warning=TimelineModelImpl.WarningType.LongTask;}
break;case recordTypes.EventDispatch:if(event.duration>TimelineModelImpl.Thresholds.RecurringHandler){timelineData.warning=TimelineModelImpl.WarningType.LongHandler;}
break;case recordTypes.TimerFire:case recordTypes.FireAnimationFrame:if(event.duration>TimelineModelImpl.Thresholds.RecurringHandler){timelineData.warning=TimelineModelImpl.WarningType.LongRecurringHandler;}
break;case recordTypes.FunctionCall:if(typeof eventData['scriptName']==='string'){eventData['url']=eventData['scriptName'];}
if(typeof eventData['scriptLine']==='number'){eventData['lineNumber']=eventData['scriptLine'];}
case recordTypes.EvaluateScript:case recordTypes.CompileScript:if(typeof eventData['lineNumber']==='number'){--eventData['lineNumber'];}
if(typeof eventData['columnNumber']==='number'){--eventData['columnNumber'];}
case recordTypes.RunMicrotasks:if(!this._currentScriptEvent){this._currentScriptEvent=event;}
break;case recordTypes.SetLayerTreeId:if(this._sessionId&&eventData['sessionId']&&this._sessionId===eventData['sessionId']){this._mainFrameLayerTreeId=eventData['layerTreeId'];break;}
const frameId=TimelineModelImpl.eventFrameId(event);const pageFrame=this._pageFrames.get(frameId);if(!pageFrame||pageFrame.parent){return false;}
this._mainFrameLayerTreeId=eventData['layerTreeId'];break;case recordTypes.Paint:{this._invalidationTracker.didPaint(event);timelineData.backendNodeId=eventData['nodeId'];if(!eventData['layerId']){break;}
const layerId=eventData['layerId'];this._lastPaintForLayer[layerId]=event;break;}
case recordTypes.DisplayItemListSnapshot:case recordTypes.PictureSnapshot:{const layerUpdateEvent=this._findAncestorEvent(recordTypes.UpdateLayer);if(!layerUpdateEvent||layerUpdateEvent.args['layerTreeId']!==this._mainFrameLayerTreeId){break;}
const paintEvent=this._lastPaintForLayer[layerUpdateEvent.args['layerId']];if(paintEvent){TimelineData.forEvent(paintEvent).picture=(event);}
break;}
case recordTypes.ScrollLayer:timelineData.backendNodeId=eventData['nodeId'];break;case recordTypes.PaintImage:timelineData.backendNodeId=eventData['nodeId'];timelineData.url=eventData['url'];break;case recordTypes.DecodeImage:case recordTypes.ResizeImage:{let paintImageEvent=this._findAncestorEvent(recordTypes.PaintImage);if(!paintImageEvent){const decodeLazyPixelRefEvent=this._findAncestorEvent(recordTypes.DecodeLazyPixelRef);paintImageEvent=decodeLazyPixelRefEvent&&this._paintImageEventByPixelRefId[decodeLazyPixelRefEvent.args['LazyPixelRef']];}
if(!paintImageEvent){break;}
const paintImageData=TimelineData.forEvent(paintImageEvent);timelineData.backendNodeId=paintImageData.backendNodeId;timelineData.url=paintImageData.url;break;}
case recordTypes.DrawLazyPixelRef:{const paintImageEvent=this._findAncestorEvent(recordTypes.PaintImage);if(!paintImageEvent){break;}
this._paintImageEventByPixelRefId[event.args['LazyPixelRef']]=paintImageEvent;const paintImageData=TimelineData.forEvent(paintImageEvent);timelineData.backendNodeId=paintImageData.backendNodeId;timelineData.url=paintImageData.url;break;}
case recordTypes.FrameStartedLoading:if(timelineData.frameId!==event.args['frame']){return false;}
break;case recordTypes.MarkLCPCandidate:timelineData.backendNodeId=eventData['nodeId'];break;case recordTypes.MarkDOMContent:case recordTypes.MarkLoad:{const frameId=TimelineModelImpl.eventFrameId(event);if(!this._pageFrames.has(frameId)){return false;}
break;}
case recordTypes.CommitLoad:{if(this._browserFrameTracking){break;}
const frameId=TimelineModelImpl.eventFrameId(event);const isMainFrame=!!eventData['isMainFrame'];const pageFrame=this._pageFrames.get(frameId);if(pageFrame){pageFrame.update(event.startTime,eventData);}else{if(!this._persistentIds){if(eventData['page']&&eventData['page']!==this._legacyCurrentPage){return false;}}else if(isMainFrame){return false;}else if(!this._addPageFrame(event,eventData)){return false;}}
if(isMainFrame){this._mainFrame=this._pageFrames.get(frameId);}
break;}
case recordTypes.FireIdleCallback:if(event.duration>eventData['allottedMilliseconds']+TimelineModelImpl.Thresholds.IdleCallbackAddon){timelineData.warning=TimelineModelImpl.WarningType.IdleDeadlineExceeded;}
break;}
return true;}
_processBrowserEvent(event){if(event.name===RecordType.LatencyInfoFlow){const frameId=event.args['frameTreeNodeId'];if(typeof frameId==='number'&&frameId===this._mainFrameNodeId){this._knownInputEvents.add(event.bind_id);}
return;}
if(event.name===RecordType.ResourceWillSendRequest){const requestId=event.args['data']['requestId'];if(typeof requestId==='string'){this._requestsFromBrowser.set(requestId,event);}
return;}
if(event.hasCategory(SDK.TracingModel.DevToolsMetadataEventCategory)&&event.args['data']){const data=event.args['data'];if(event.name===TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser){if(!data['persistentIds']){return;}
this._browserFrameTracking=true;this._mainFrameNodeId=data['frameTreeNodeId'];const frames=data['frames']||[];frames.forEach(payload=>{const parent=payload['parent']&&this._pageFrames.get(payload['parent']);if(payload['parent']&&!parent){return;}
let frame=this._pageFrames.get(payload['frame']);if(!frame){frame=new PageFrame(payload);this._pageFrames.set(frame.frameId,frame);if(parent){parent.addChild(frame);}else{this._mainFrame=frame;}}
frame.update(this._minimumRecordTime,payload);});return;}
if(event.name===TimelineModelImpl.DevToolsMetadataEvent.FrameCommittedInBrowser&&this._browserFrameTracking){let frame=this._pageFrames.get(data['frame']);if(!frame){const parent=data['parent']&&this._pageFrames.get(data['parent']);if(!parent){return;}
frame=new PageFrame(data);this._pageFrames.set(frame.frameId,frame);parent.addChild(frame);}
frame.update(event.startTime,data);return;}
if(event.name===TimelineModelImpl.DevToolsMetadataEvent.ProcessReadyInBrowser&&this._browserFrameTracking){const frame=this._pageFrames.get(data['frame']);if(frame){frame.processReady(data['processPseudoId'],data['processId']);}
return;}
if(event.name===TimelineModelImpl.DevToolsMetadataEvent.FrameDeletedInBrowser&&this._browserFrameTracking){const frame=this._pageFrames.get(data['frame']);if(frame){frame.deletedTime=event.startTime;}
return;}}}
_ensureNamedTrack(type){if(!this._namedTracks.has(type)){const track=new Track();track.type=type;this._tracks.push(track);this._namedTracks.set(type,track);}
return this._namedTracks.get(type);}
_findAncestorEvent(name){for(let i=this._eventStack.length-1;i>=0;--i){const event=this._eventStack[i];if(event.name===name){return event;}}
return null;}
_addPageFrame(event,payload){const parent=payload['parent']&&this._pageFrames.get(payload['parent']);if(payload['parent']&&!parent){return false;}
const pageFrame=new PageFrame(payload);this._pageFrames.set(pageFrame.frameId,pageFrame);pageFrame.update(event.startTime,payload);if(parent){parent.addChild(pageFrame);}
return true;}
_reset(){this._isGenericTrace=false;this._tracks=[];this._namedTracks=new Map();this._inspectedTargetEvents=[];this._timeMarkerEvents=[];this._sessionId=null;this._mainFrameNodeId=null;this._cpuProfiles=[];this._workerIdByThread=new WeakMap();this._pageFrames=new Map();this._mainFrame=null;this._requestsFromBrowser=new Map();this._minimumRecordTime=0;this._maximumRecordTime=0;}
isGenericTrace(){return this._isGenericTrace;}
tracingModel(){return this._tracingModel;}
minimumRecordTime(){return this._minimumRecordTime;}
maximumRecordTime(){return this._maximumRecordTime;}
inspectedTargetEvents(){return this._inspectedTargetEvents;}
tracks(){return this._tracks;}
isEmpty(){return this.minimumRecordTime()===0&&this.maximumRecordTime()===0;}
timeMarkerEvents(){return this._timeMarkerEvents;}
rootFrames(){return Array.from(this._pageFrames.values()).filter(frame=>!frame.parent);}
pageURL(){return this._mainFrame&&this._mainFrame.url||'';}
pageFrameById(frameId){return frameId?this._pageFrames.get(frameId)||null:null;}
networkRequests(){if(this.isGenericTrace()){return[];}
const requests=new Map();const requestsList=[];const zeroStartRequestsList=[];const types=RecordType;const resourceTypes=new Set([types.ResourceWillSendRequest,types.ResourceSendRequest,types.ResourceReceiveResponse,types.ResourceReceivedData,types.ResourceFinish,types.ResourceMarkAsCached]);const events=this.inspectedTargetEvents();for(let i=0;i<events.length;++i){const e=events[i];if(!resourceTypes.has(e.name)){continue;}
const id=TimelineModelImpl.globalEventId(e,'requestId');if(e.name===types.ResourceSendRequest&&this._requestsFromBrowser.has(e.args.data.requestId)){addRequest(this._requestsFromBrowser.get(e.args.data.requestId),id);}
addRequest(e,id);}
function addRequest(e,id){let request=requests.get(id);if(request){request.addEvent(e);}else{request=new NetworkRequest(e);requests.set(id,request);if(request.startTime){requestsList.push(request);}else{zeroStartRequestsList.push(request);}}}
return zeroStartRequestsList.concat(requestsList);}}
export const RecordType={Task:'RunTask',Program:'Program',EventDispatch:'EventDispatch',GPUTask:'GPUTask',Animation:'Animation',RequestMainThreadFrame:'RequestMainThreadFrame',BeginFrame:'BeginFrame',NeedsBeginFrameChanged:'NeedsBeginFrameChanged',BeginMainThreadFrame:'BeginMainThreadFrame',ActivateLayerTree:'ActivateLayerTree',DrawFrame:'DrawFrame',HitTest:'HitTest',ScheduleStyleRecalculation:'ScheduleStyleRecalculation',RecalculateStyles:'RecalculateStyles',UpdateLayoutTree:'UpdateLayoutTree',InvalidateLayout:'InvalidateLayout',Layout:'Layout',UpdateLayer:'UpdateLayer',UpdateLayerTree:'UpdateLayerTree',PaintSetup:'PaintSetup',Paint:'Paint',PaintImage:'PaintImage',Rasterize:'Rasterize',RasterTask:'RasterTask',ScrollLayer:'ScrollLayer',CompositeLayers:'CompositeLayers',ScheduleStyleInvalidationTracking:'ScheduleStyleInvalidationTracking',StyleRecalcInvalidationTracking:'StyleRecalcInvalidationTracking',StyleInvalidatorInvalidationTracking:'StyleInvalidatorInvalidationTracking',LayoutInvalidationTracking:'LayoutInvalidationTracking',ParseHTML:'ParseHTML',ParseAuthorStyleSheet:'ParseAuthorStyleSheet',TimerInstall:'TimerInstall',TimerRemove:'TimerRemove',TimerFire:'TimerFire',XHRReadyStateChange:'XHRReadyStateChange',XHRLoad:'XHRLoad',CompileScript:'v8.compile',EvaluateScript:'EvaluateScript',CompileModule:'v8.compileModule',EvaluateModule:'v8.evaluateModule',WasmStreamFromResponseCallback:'v8.wasm.streamFromResponseCallback',WasmCompiledModule:'v8.wasm.compiledModule',WasmCachedModule:'v8.wasm.cachedModule',WasmModuleCacheHit:'v8.wasm.moduleCacheHit',WasmModuleCacheInvalid:'v8.wasm.moduleCacheInvalid',FrameStartedLoading:'FrameStartedLoading',CommitLoad:'CommitLoad',MarkLoad:'MarkLoad',MarkDOMContent:'MarkDOMContent',MarkFirstPaint:'firstPaint',MarkFCP:'firstContentfulPaint',MarkFMP:'firstMeaningfulPaint',MarkLCPCandidate:'largestContentfulPaint::Candidate',MarkLCPInvalidate:'largestContentfulPaint::Invalidate',TimeStamp:'TimeStamp',ConsoleTime:'ConsoleTime',UserTiming:'UserTiming',ResourceWillSendRequest:'ResourceWillSendRequest',ResourceSendRequest:'ResourceSendRequest',ResourceReceiveResponse:'ResourceReceiveResponse',ResourceReceivedData:'ResourceReceivedData',ResourceFinish:'ResourceFinish',ResourceMarkAsCached:'ResourceMarkAsCached',RunMicrotasks:'RunMicrotasks',FunctionCall:'FunctionCall',GCEvent:'GCEvent',MajorGC:'MajorGC',MinorGC:'MinorGC',JSFrame:'JSFrame',JSSample:'JSSample',V8Sample:'V8Sample',JitCodeAdded:'JitCodeAdded',JitCodeMoved:'JitCodeMoved',StreamingCompileScript:'v8.parseOnBackground',StreamingCompileScriptWaiting:'v8.parseOnBackgroundWaiting',StreamingCompileScriptParsing:'v8.parseOnBackgroundParsing',V8Execute:'V8.Execute',UpdateCounters:'UpdateCounters',RequestAnimationFrame:'RequestAnimationFrame',CancelAnimationFrame:'CancelAnimationFrame',FireAnimationFrame:'FireAnimationFrame',RequestIdleCallback:'RequestIdleCallback',CancelIdleCallback:'CancelIdleCallback',FireIdleCallback:'FireIdleCallback',WebSocketCreate:'WebSocketCreate',WebSocketSendHandshakeRequest:'WebSocketSendHandshakeRequest',WebSocketReceiveHandshakeResponse:'WebSocketReceiveHandshakeResponse',WebSocketDestroy:'WebSocketDestroy',EmbedderCallback:'EmbedderCallback',SetLayerTreeId:'SetLayerTreeId',TracingStartedInPage:'TracingStartedInPage',TracingSessionIdForWorker:'TracingSessionIdForWorker',DecodeImage:'Decode Image',ResizeImage:'Resize Image',DrawLazyPixelRef:'Draw LazyPixelRef',DecodeLazyPixelRef:'Decode LazyPixelRef',LazyPixelRef:'LazyPixelRef',LayerTreeHostImplSnapshot:'cc::LayerTreeHostImpl',PictureSnapshot:'cc::Picture',DisplayItemListSnapshot:'cc::DisplayItemList',LatencyInfo:'LatencyInfo',LatencyInfoFlow:'LatencyInfo.Flow',InputLatencyMouseMove:'InputLatency::MouseMove',InputLatencyMouseWheel:'InputLatency::MouseWheel',ImplSideFling:'InputHandlerProxy::HandleGestureFling::started',GCCollectGarbage:'BlinkGC.AtomicPhase',CryptoDoEncrypt:'DoEncrypt',CryptoDoEncryptReply:'DoEncryptReply',CryptoDoDecrypt:'DoDecrypt',CryptoDoDecryptReply:'DoDecryptReply',CryptoDoDigest:'DoDigest',CryptoDoDigestReply:'DoDigestReply',CryptoDoSign:'DoSign',CryptoDoSignReply:'DoSignReply',CryptoDoVerify:'DoVerify',CryptoDoVerifyReply:'DoVerifyReply',CpuProfile:'CpuProfile',Profile:'Profile',AsyncTask:'AsyncTask',};TimelineModelImpl.Category={Console:'blink.console',UserTiming:'blink.user_timing',LatencyInfo:'latencyInfo'};TimelineModelImpl.WarningType={LongTask:'LongTask',ForcedStyle:'ForcedStyle',ForcedLayout:'ForcedLayout',IdleDeadlineExceeded:'IdleDeadlineExceeded',LongHandler:'LongHandler',LongRecurringHandler:'LongRecurringHandler',V8Deopt:'V8Deopt'};TimelineModelImpl.WorkerThreadName='DedicatedWorker thread';TimelineModelImpl.WorkerThreadNameLegacy='DedicatedWorker Thread';TimelineModelImpl.RendererMainThreadName='CrRendererMain';TimelineModelImpl.BrowserMainThreadName='CrBrowserMain';TimelineModelImpl.DevToolsMetadataEvent={TracingStartedInBrowser:'TracingStartedInBrowser',TracingStartedInPage:'TracingStartedInPage',TracingSessionIdForWorker:'TracingSessionIdForWorker',FrameCommittedInBrowser:'FrameCommittedInBrowser',ProcessReadyInBrowser:'ProcessReadyInBrowser',FrameDeletedInBrowser:'FrameDeletedInBrowser',};TimelineModelImpl.Thresholds={LongTask:200,Handler:150,RecurringHandler:50,ForcedLayout:30,IdleCallbackAddon:5};export class Track{constructor(){this.name='';this.type=TrackType.Other;this.forMainFrame=false;this.url='';this.events=[];this.asyncEvents=[];this.tasks=[];this._syncEvents=null;this.thread=null;}
syncEvents(){if(this.events.length){return this.events;}
if(this._syncEvents){return this._syncEvents;}
const stack=[];this._syncEvents=[];for(const event of this.asyncEvents){const startTime=event.startTime;const endTime=event.endTime;while(stack.length&&startTime>=stack.peekLast().endTime){stack.pop();}
if(stack.length&&endTime>stack.peekLast().endTime){this._syncEvents=[];break;}
const syncEvent=new SDK.TracingModel.Event(event.categoriesString,event.name,SDK.TracingModel.Phase.Complete,startTime,event.thread);syncEvent.setEndTime(endTime);syncEvent.addArgs(event.args);this._syncEvents.push(syncEvent);stack.push(syncEvent);}
return this._syncEvents;}}
export const TrackType={MainThread:Symbol('MainThread'),Worker:Symbol('Worker'),Input:Symbol('Input'),Animation:Symbol('Animation'),Timings:Symbol('Timings'),Console:Symbol('Console'),Raster:Symbol('Raster'),GPU:Symbol('GPU'),Other:Symbol('Other'),};export class PageFrame{constructor(payload){this.frameId=payload['frame'];this.url=payload['url']||'';this.name=payload['name'];this.children=[];this.parent=null;this.processes=[];this.deletedTime=null;this.ownerNode=null;}
update(time,payload){this.url=payload['url']||'';this.name=payload['name'];if(payload['processId']){this.processes.push({time:time,processId:payload['processId'],processPseudoId:'',url:payload['url']||''});}else{this.processes.push({time:time,processId:-1,processPseudoId:payload['processPseudoId'],url:payload['url']||''});}}
processReady(processPseudoId,processId){for(const process of this.processes){if(process.processPseudoId===processPseudoId){process.processPseudoId='';process.processId=processId;}}}
addChild(child){this.children.push(child);child.parent=this;}}
export class NetworkRequest{constructor(event){const recordType=RecordType;const isInitial=event.name===recordType.ResourceSendRequest||event.name===recordType.ResourceWillSendRequest;this.startTime=isInitial?event.startTime:0;this.endTime=Infinity;this.encodedDataLength=0;this.decodedBodyLength=0;this.children=[];this.timing;this.mimeType;this.url;this.requestMethod;this._transferSize=0;this._maybeDiskCached=false;this._memoryCached=false;this.addEvent(event);}
addEvent(event){this.children.push(event);const recordType=RecordType;this.startTime=Math.min(this.startTime,event.startTime);const eventData=event.args['data'];if(eventData['mimeType']){this.mimeType=eventData['mimeType'];}
if('priority'in eventData){this.priority=eventData['priority'];}
if(event.name===recordType.ResourceFinish){this.endTime=event.startTime;}
if(eventData['finishTime']){this.finishTime=eventData['finishTime']*1000;}
if(!this.responseTime&&(event.name===recordType.ResourceReceiveResponse||event.name===recordType.ResourceReceivedData)){this.responseTime=event.startTime;}
const encodedDataLength=eventData['encodedDataLength']||0;if(event.name===recordType.ResourceMarkAsCached){this._memoryCached=true;}
if(event.name===recordType.ResourceReceiveResponse){if(eventData['fromCache']){this._maybeDiskCached=true;}
if(eventData['fromServiceWorker']){this.fromServiceWorker=true;}
if(eventData['hasCachedResource']){this.hasCachedResource=true;}
this.encodedDataLength=encodedDataLength;}
if(event.name===recordType.ResourceReceivedData){this.encodedDataLength+=encodedDataLength;}
if(event.name===recordType.ResourceFinish&&encodedDataLength){this.encodedDataLength=encodedDataLength;this._transferSize=encodedDataLength;}
const decodedBodyLength=eventData['decodedBodyLength'];if(event.name===recordType.ResourceFinish&&decodedBodyLength){this.decodedBodyLength=decodedBodyLength;}
if(!this.url){this.url=eventData['url'];}
if(!this.requestMethod){this.requestMethod=eventData['requestMethod'];}
if(!this.timing){this.timing=eventData['timing'];}
if(eventData['fromServiceWorker']){this.fromServiceWorker=true;}}
cached(){return!!this._memoryCached||(!!this._maybeDiskCached&&!this._transferSize&&!this.fromServiceWorker);}
memoryCached(){return this._memoryCached;}
getSendReceiveTiming(){if(this.cached()||!this.timing){return{sendStartTime:this.startTime,headersEndTime:this.startTime};}
const requestTime=this.timing.requestTime*1000;const sendStartTime=requestTime+this.timing.sendStart;const headersEndTime=requestTime+this.timing.receiveHeadersEnd;return{sendStartTime,headersEndTime};}
getStartTime(){return Math.min(this.startTime,!this.cached()&&this.timing&&this.timing.requestTime*1000||Infinity);}
beginTime(){return Math.min(this.getStartTime(),!this.cached()&&this.timing&&this.timing.pushStart*1000||Infinity);}}
export class InvalidationTrackingEvent{constructor(event){this.type=event.name;this.startTime=event.startTime;this._tracingEvent=event;const eventData=event.args['data'];this.frame=eventData['frame'];this.nodeId=eventData['nodeId'];this.nodeName=eventData['nodeName'];this.invalidationSet=eventData['invalidationSet'];this.invalidatedSelectorId=eventData['invalidatedSelectorId'];this.changedId=eventData['changedId'];this.changedClass=eventData['changedClass'];this.changedAttribute=eventData['changedAttribute'];this.changedPseudo=eventData['changedPseudo'];this.selectorPart=eventData['selectorPart'];this.extraData=eventData['extraData'];this.invalidationList=eventData['invalidationList'];this.cause={reason:eventData['reason'],stackTrace:eventData['stackTrace']};if(!this.cause.reason&&this.cause.stackTrace&&this.type===RecordType.LayoutInvalidationTracking){this.cause.reason='Layout forced';}}}
export class InvalidationTracker{constructor(){this._lastRecalcStyle=null;this._lastPaintWithLayer=null;this._didPaint=false;this._initializePerFrameState();}
static invalidationEventsFor(event){return event[InvalidationTracker._invalidationTrackingEventsSymbol]||null;}
addInvalidation(invalidation){this._startNewFrameIfNeeded();if(!invalidation.nodeId){console.error('Invalidation lacks node information.');console.error(invalidation);return;}
const recordTypes=RecordType;if(invalidation.type===recordTypes.StyleRecalcInvalidationTracking&&invalidation.cause.reason==='StyleInvalidator'){return;}
const styleRecalcInvalidation=(invalidation.type===recordTypes.ScheduleStyleInvalidationTracking||invalidation.type===recordTypes.StyleInvalidatorInvalidationTracking||invalidation.type===recordTypes.StyleRecalcInvalidationTracking);if(styleRecalcInvalidation){const duringRecalcStyle=invalidation.startTime&&this._lastRecalcStyle&&invalidation.startTime>=this._lastRecalcStyle.startTime&&invalidation.startTime<=this._lastRecalcStyle.endTime;if(duringRecalcStyle){this._associateWithLastRecalcStyleEvent(invalidation);}}
if(this._invalidations[invalidation.type]){this._invalidations[invalidation.type].push(invalidation);}else{this._invalidations[invalidation.type]=[invalidation];}
if(invalidation.nodeId){if(this._invalidationsByNodeId[invalidation.nodeId]){this._invalidationsByNodeId[invalidation.nodeId].push(invalidation);}else{this._invalidationsByNodeId[invalidation.nodeId]=[invalidation];}}}
didRecalcStyle(recalcStyleEvent){this._lastRecalcStyle=recalcStyleEvent;const types=[RecordType.ScheduleStyleInvalidationTracking,RecordType.StyleInvalidatorInvalidationTracking,RecordType.StyleRecalcInvalidationTracking];for(const invalidation of this._invalidationsOfTypes(types)){this._associateWithLastRecalcStyleEvent(invalidation);}}
_associateWithLastRecalcStyleEvent(invalidation){if(invalidation.linkedRecalcStyleEvent){return;}
const recordTypes=RecordType;const recalcStyleFrameId=this._lastRecalcStyle.args['beginData']['frame'];if(invalidation.type===recordTypes.StyleInvalidatorInvalidationTracking){this._addSyntheticStyleRecalcInvalidations(this._lastRecalcStyle,recalcStyleFrameId,invalidation);}else if(invalidation.type===recordTypes.ScheduleStyleInvalidationTracking){}else{this._addInvalidationToEvent(this._lastRecalcStyle,recalcStyleFrameId,invalidation);}
invalidation.linkedRecalcStyleEvent=true;}
_addSyntheticStyleRecalcInvalidations(event,frameId,styleInvalidatorInvalidation){if(!styleInvalidatorInvalidation.invalidationList){this._addSyntheticStyleRecalcInvalidation(styleInvalidatorInvalidation._tracingEvent,styleInvalidatorInvalidation);return;}
if(!styleInvalidatorInvalidation.nodeId){console.error('Invalidation lacks node information.');console.error(styleInvalidatorInvalidation);return;}
for(let i=0;i<styleInvalidatorInvalidation.invalidationList.length;i++){const setId=styleInvalidatorInvalidation.invalidationList[i]['id'];let lastScheduleStyleRecalculation;const nodeInvalidations=this._invalidationsByNodeId[styleInvalidatorInvalidation.nodeId]||[];for(let j=0;j<nodeInvalidations.length;j++){const invalidation=nodeInvalidations[j];if(invalidation.frame!==frameId||invalidation.invalidationSet!==setId||invalidation.type!==RecordType.ScheduleStyleInvalidationTracking){continue;}
lastScheduleStyleRecalculation=invalidation;}
if(!lastScheduleStyleRecalculation){console.error('Failed to lookup the event that scheduled a style invalidator invalidation.');continue;}
this._addSyntheticStyleRecalcInvalidation(lastScheduleStyleRecalculation._tracingEvent,styleInvalidatorInvalidation);}}
_addSyntheticStyleRecalcInvalidation(baseEvent,styleInvalidatorInvalidation){const invalidation=new InvalidationTrackingEvent(baseEvent);invalidation.type=RecordType.StyleRecalcInvalidationTracking;if(styleInvalidatorInvalidation.cause.reason){invalidation.cause.reason=styleInvalidatorInvalidation.cause.reason;}
if(styleInvalidatorInvalidation.selectorPart){invalidation.selectorPart=styleInvalidatorInvalidation.selectorPart;}
this.addInvalidation(invalidation);if(!invalidation.linkedRecalcStyleEvent){this._associateWithLastRecalcStyleEvent(invalidation);}}
didLayout(layoutEvent){const layoutFrameId=layoutEvent.args['beginData']['frame'];for(const invalidation of this._invalidationsOfTypes([RecordType.LayoutInvalidationTracking])){if(invalidation.linkedLayoutEvent){continue;}
this._addInvalidationToEvent(layoutEvent,layoutFrameId,invalidation);invalidation.linkedLayoutEvent=true;}}
didPaint(paintEvent){this._didPaint=true;}
_addInvalidationToEvent(event,eventFrameId,invalidation){if(eventFrameId!==invalidation.frame){return;}
if(!event[InvalidationTracker._invalidationTrackingEventsSymbol]){event[InvalidationTracker._invalidationTrackingEventsSymbol]=[invalidation];}else{event[InvalidationTracker._invalidationTrackingEventsSymbol].push(invalidation);}}
_invalidationsOfTypes(types){const invalidations=this._invalidations;if(!types){types=Object.keys(invalidations);}
function*generator(){for(let i=0;i<types.length;++i){const invalidationList=invalidations[types[i]]||[];for(let j=0;j<invalidationList.length;++j){yield invalidationList[j];}}}
return generator();}
_startNewFrameIfNeeded(){if(!this._didPaint){return;}
this._initializePerFrameState();}
_initializePerFrameState(){this._invalidations={};this._invalidationsByNodeId={};this._lastRecalcStyle=null;this._lastPaintWithLayer=null;this._didPaint=false;}}
InvalidationTracker._invalidationTrackingEventsSymbol=Symbol('invalidationTrackingEvents');export class TimelineAsyncEventTracker{constructor(){TimelineAsyncEventTracker._initialize();this._initiatorByType=new Map();for(const initiator of TimelineAsyncEventTracker._asyncEvents.keys()){this._initiatorByType.set(initiator,new Map());}}
static _initialize(){if(TimelineAsyncEventTracker._asyncEvents){return;}
const events=new Map();let type=RecordType;events.set(type.TimerInstall,{causes:[type.TimerFire],joinBy:'timerId'});events.set(type.ResourceSendRequest,{causes:[type.ResourceMarkAsCached,type.ResourceReceiveResponse,type.ResourceReceivedData,type.ResourceFinish],joinBy:'requestId'});events.set(type.RequestAnimationFrame,{causes:[type.FireAnimationFrame],joinBy:'id'});events.set(type.RequestIdleCallback,{causes:[type.FireIdleCallback],joinBy:'id'});events.set(type.WebSocketCreate,{causes:[type.WebSocketSendHandshakeRequest,type.WebSocketReceiveHandshakeResponse,type.WebSocketDestroy],joinBy:'identifier'});TimelineAsyncEventTracker._asyncEvents=events;TimelineAsyncEventTracker._typeToInitiator=new Map();for(const entry of events){const types=entry[1].causes;for(type of types){TimelineAsyncEventTracker._typeToInitiator.set(type,entry[0]);}}}
processEvent(event){let initiatorType=TimelineAsyncEventTracker._typeToInitiator.get((event.name));const isInitiator=!initiatorType;if(!initiatorType){initiatorType=(event.name);}
const initiatorInfo=TimelineAsyncEventTracker._asyncEvents.get(initiatorType);if(!initiatorInfo){return;}
const id=TimelineModelImpl.globalEventId(event,initiatorInfo.joinBy);if(!id){return;}
const initiatorMap=this._initiatorByType.get(initiatorType);if(isInitiator){initiatorMap.set(id,event);return;}
const initiator=initiatorMap.get(id)||null;const timelineData=TimelineData.forEvent(event);timelineData.setInitiator(initiator);if(!timelineData.frameId&&initiator){timelineData.frameId=TimelineModelImpl.eventFrameId(initiator);}}}
export class TimelineData{constructor(){this.warning=null;this.previewElement=null;this.url=null;this.backendNodeId=0;this.stackTrace=null;this.picture=null;this._initiator=null;this.frameId='';this.timeWaitingForMainThread;}
setInitiator(initiator){this._initiator=initiator;if(!initiator||this.url){return;}
const initiatorURL=TimelineData.forEvent(initiator).url;if(initiatorURL){this.url=initiatorURL;}}
initiator(){return this._initiator;}
topFrame(){const stackTrace=this.stackTraceForSelfOrInitiator();return stackTrace&&stackTrace[0]||null;}
stackTraceForSelfOrInitiator(){return this.stackTrace||(this._initiator&&TimelineData.forEvent(this._initiator).stackTrace);}
static forEvent(event){let data=event[TimelineData._symbol];if(!data){data=new TimelineData();event[TimelineData._symbol]=data;}
return data;}}
TimelineData._symbol=Symbol('timelineData');self.TimelineModel=self.TimelineModel||{};TimelineModel=TimelineModel||{};TimelineModel.TimelineModel=TimelineModelImpl;TimelineModel.TimelineModel.Track=Track;TimelineModel.TimelineModel.TrackType=TrackType;TimelineModel.TimelineModel.RecordType=RecordType;TimelineModel.TimelineModel.PageFrame=PageFrame;TimelineModel.TimelineModel.NetworkRequest=NetworkRequest;TimelineModel.InvalidationTrackingEvent=InvalidationTrackingEvent;TimelineModel.InvalidationTracker=InvalidationTracker;TimelineModel.TimelineAsyncEventTracker=TimelineAsyncEventTracker;TimelineModel.TimelineData=TimelineData;TimelineModel.InvalidationCause;TimelineModel.TimelineModel.MetadataEvents;