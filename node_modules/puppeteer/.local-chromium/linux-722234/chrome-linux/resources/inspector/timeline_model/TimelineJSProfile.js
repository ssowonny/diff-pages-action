export class TimelineJSProfileProcessor{static generateTracingEventsFromCpuProfile(jsProfileModel,thread){const idleNode=jsProfileModel.idleNode;const programNode=jsProfileModel.programNode;const gcNode=jsProfileModel.gcNode;const samples=jsProfileModel.samples;const timestamps=jsProfileModel.timestamps;const jsEvents=[];const nodeToStackMap=new Map();nodeToStackMap.set(programNode,[]);for(let i=0;i<samples.length;++i){let node=jsProfileModel.nodeByIndex(i);if(!node){console.error(`Node with unknown id ${samples[i]} at index ${i}`);continue;}
if(node===gcNode||node===idleNode){continue;}
let callFrames=nodeToStackMap.get(node);if(!callFrames){callFrames=(new Array(node.depth+1));nodeToStackMap.set(node,callFrames);for(let j=0;node.parent;node=node.parent){callFrames[j++]=(node);}}
const jsSampleEvent=new SDK.TracingModel.Event(SDK.TracingModel.DevToolsTimelineEventCategory,TimelineModel.TimelineModel.RecordType.JSSample,SDK.TracingModel.Phase.Instant,timestamps[i],thread);jsSampleEvent.args['data']={stackTrace:callFrames};jsEvents.push(jsSampleEvent);}
return jsEvents;}
static generateJSFrameEvents(events){function equalFrames(frame1,frame2){return frame1.scriptId===frame2.scriptId&&frame1.functionName===frame2.functionName&&frame1.lineNumber===frame2.lineNumber;}
function isJSInvocationEvent(e){switch(e.name){case TimelineModel.TimelineModel.RecordType.RunMicrotasks:case TimelineModel.TimelineModel.RecordType.FunctionCall:case TimelineModel.TimelineModel.RecordType.EvaluateScript:case TimelineModel.TimelineModel.RecordType.EvaluateModule:case TimelineModel.TimelineModel.RecordType.EventDispatch:case TimelineModel.TimelineModel.RecordType.V8Execute:return true;}
return false;}
const jsFrameEvents=[];const jsFramesStack=[];const lockedJsStackDepth=[];let ordinal=0;const showAllEvents=Root.Runtime.experiments.isEnabled('timelineShowAllEvents');const showRuntimeCallStats=Root.Runtime.experiments.isEnabled('timelineV8RuntimeCallStats');const showNativeFunctions=Common.moduleSetting('showNativeFunctionsInJSProfile').get();function onStartEvent(e){e.ordinal=++ordinal;extractStackTrace(e);lockedJsStackDepth.push(jsFramesStack.length);}
function onInstantEvent(e,parent){e.ordinal=++ordinal;if(parent&&isJSInvocationEvent(parent)){extractStackTrace(e);}}
function onEndEvent(e){truncateJSStack(lockedJsStackDepth.pop(),e.endTime);}
function truncateJSStack(depth,time){if(lockedJsStackDepth.length){const lockedDepth=lockedJsStackDepth.peekLast();if(depth<lockedDepth){console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);depth=lockedDepth;}}
if(jsFramesStack.length<depth){console.error(`Trying to truncate higher than the current stack size at ${time}`);depth=jsFramesStack.length;}
for(let k=0;k<jsFramesStack.length;++k){jsFramesStack[k].setEndTime(time);}
jsFramesStack.length=depth;}
function showNativeName(name){return showRuntimeCallStats&&!!TimelineJSProfileProcessor.nativeGroup(name);}
function filterStackFrames(stack){if(showAllEvents){return;}
let previousNativeFrameName=null;let j=0;for(let i=0;i<stack.length;++i){const frame=stack[i];const url=frame.url;const isNativeFrame=url&&url.startsWith('native ');if(!showNativeFunctions&&isNativeFrame){continue;}
const isNativeRuntimeFrame=TimelineJSProfileProcessor.isNativeRuntimeFrame(frame);if(isNativeRuntimeFrame&&!showNativeName(frame.functionName)){continue;}
const nativeFrameName=isNativeRuntimeFrame?TimelineJSProfileProcessor.nativeGroup(frame.functionName):null;if(previousNativeFrameName&&previousNativeFrameName===nativeFrameName){continue;}
previousNativeFrameName=nativeFrameName;stack[j++]=frame;}
stack.length=j;}
function extractStackTrace(e){const recordTypes=TimelineModel.TimelineModel.RecordType;const callFrames=e.name===recordTypes.JSSample?e.args['data']['stackTrace'].slice().reverse():jsFramesStack.map(frameEvent=>frameEvent.args['data']);filterStackFrames(callFrames);const endTime=e.endTime||e.startTime;const minFrames=Math.min(callFrames.length,jsFramesStack.length);let i;for(i=lockedJsStackDepth.peekLast()||0;i<minFrames;++i){const newFrame=callFrames[i];const oldFrame=jsFramesStack[i].args['data'];if(!equalFrames(newFrame,oldFrame)){break;}
jsFramesStack[i].setEndTime(Math.max(jsFramesStack[i].endTime,endTime));}
truncateJSStack(i,e.startTime);for(;i<callFrames.length;++i){const frame=callFrames[i];const jsFrameEvent=new SDK.TracingModel.Event(SDK.TracingModel.DevToolsTimelineEventCategory,recordTypes.JSFrame,SDK.TracingModel.Phase.Complete,e.startTime,e.thread);jsFrameEvent.ordinal=e.ordinal;jsFrameEvent.addArgs({data:frame});jsFrameEvent.setEndTime(endTime);jsFramesStack.push(jsFrameEvent);jsFrameEvents.push(jsFrameEvent);}}
const firstTopLevelEvent=events.find(SDK.TracingModel.isTopLevelEvent);const startTime=firstTopLevelEvent?firstTopLevelEvent.startTime:0;TimelineModel.TimelineModel.forEachEvent(events,onStartEvent,onEndEvent,onInstantEvent,startTime);return jsFrameEvents;}
static isNativeRuntimeFrame(frame){return frame.url==='native V8Runtime';}
static nativeGroup(nativeName){if(nativeName.startsWith('Parse')){return TimelineJSProfileProcessor.NativeGroups.Parse;}
if(nativeName.startsWith('Compile')||nativeName.startsWith('Recompile')){return TimelineJSProfileProcessor.NativeGroups.Compile;}
return null;}
static buildTraceProfileFromCpuProfile(profile,tid,injectPageEvent,name){const events=[];if(injectPageEvent){appendEvent('TracingStartedInPage',{data:{'sessionId':'1'}},0,0,'M');}
if(!name){name=ls`Thread ${tid}`;}
appendEvent(SDK.TracingModel.MetadataEvent.ThreadName,{name},0,0,'M','__metadata');if(!profile){return events;}
const idToNode=new Map();const nodes=profile['nodes'];for(let i=0;i<nodes.length;++i){idToNode.set(nodes[i].id,nodes[i]);}
let programEvent=null;let functionEvent=null;let nextTime=profile.startTime;let currentTime;const samples=profile['samples'];const timeDeltas=profile['timeDeltas'];for(let i=0;i<samples.length;++i){currentTime=nextTime;nextTime+=timeDeltas[i];const node=idToNode.get(samples[i]);const name=node.callFrame.functionName;if(name==='(idle)'){closeEvents();continue;}
if(!programEvent){programEvent=appendEvent('MessageLoop::RunTask',{},currentTime,0,'X','toplevel');}
if(name==='(program)'){if(functionEvent){functionEvent.dur=currentTime-functionEvent.ts;functionEvent=null;}}else{if(!functionEvent){functionEvent=appendEvent('FunctionCall',{data:{'sessionId':'1'}},currentTime);}}}
closeEvents();appendEvent('CpuProfile',{data:{'cpuProfile':profile}},profile.endTime,0,'I');return events;function closeEvents(){if(programEvent){programEvent.dur=currentTime-programEvent.ts;}
if(functionEvent){functionEvent.dur=currentTime-functionEvent.ts;}
programEvent=null;functionEvent=null;}
function appendEvent(name,args,ts,dur,ph,cat){const event=({cat:cat||'disabled-by-default-devtools.timeline',name,ph:ph||'X',pid:1,tid,ts,args});if(dur){event.dur=dur;}
events.push(event);return event;}}}
TimelineJSProfileProcessor.NativeGroups={'Compile':'Compile','Parse':'Parse'};self.TimelineModel=self.TimelineModel||{};TimelineModel=TimelineModel||{};TimelineModel.TimelineJSProfileProcessor=TimelineJSProfileProcessor;