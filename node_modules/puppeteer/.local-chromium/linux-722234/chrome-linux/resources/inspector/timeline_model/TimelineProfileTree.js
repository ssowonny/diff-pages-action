export class Node{constructor(id,event){this.totalTime=0;this.selfTime=0;this.id=id;this.event=event;this.parent;this._groupId='';this._isGroupNode=false;}
isGroupNode(){return this._isGroupNode;}
hasChildren(){throw'Not implemented';}
children(){throw'Not implemented';}
searchTree(matchFunction,results){results=results||[];if(this.event&&matchFunction(this.event)){results.push(this);}
for(const child of this.children().values()){child.searchTree(matchFunction,results);}
return results;}}
export class TopDownNode extends Node{constructor(id,event,parent){super(id,event);this._root=parent&&parent._root;this._hasChildren=false;this._children=null;this.parent=parent;}
hasChildren(){return this._hasChildren;}
children(){return this._children||this._buildChildren();}
_buildChildren(){const path=[];for(let node=this;node.parent&&!node._isGroupNode;node=node.parent){path.push((node));}
path.reverse();const children=new Map();const self=this;const root=this._root;const startTime=root._startTime;const endTime=root._endTime;const instantEventCallback=root._doNotAggregate?onInstantEvent:undefined;const eventIdCallback=root._doNotAggregate?undefined:_eventId;const eventGroupIdCallback=root._eventGroupIdCallback;let depth=0;let matchedDepth=0;let currentDirectChild=null;TimelineModel.TimelineModel.forEachEvent(root._events,onStartEvent,onEndEvent,instantEventCallback,startTime,endTime,root._filter);function onStartEvent(e){++depth;if(depth>path.length+2){return;}
if(!matchPath(e)){return;}
const duration=Math.min(endTime,e.endTime)-Math.max(startTime,e.startTime);if(duration<0){console.error('Negative event duration');}
processEvent(e,duration);}
function onInstantEvent(e){++depth;if(matchedDepth===path.length&&depth<=path.length+2){processEvent(e,0);}
--depth;}
function processEvent(e,duration){if(depth===path.length+2){currentDirectChild._hasChildren=true;currentDirectChild.selfTime-=duration;return;}
let id;let groupId='';if(!eventIdCallback){id=Symbol('uniqueId');}else{id=eventIdCallback(e);groupId=eventGroupIdCallback?eventGroupIdCallback(e):'';if(groupId){id+='/'+groupId;}}
let node=children.get(id);if(!node){node=new TopDownNode(id,e,self);node._groupId=groupId;children.set(id,node);}
node.selfTime+=duration;node.totalTime+=duration;currentDirectChild=node;}
function matchPath(e){if(matchedDepth===path.length){return true;}
if(matchedDepth!==depth-1){return false;}
if(!e.endTime){return false;}
if(!eventIdCallback){if(e===path[matchedDepth].event){++matchedDepth;}
return false;}
let id=eventIdCallback(e);const groupId=eventGroupIdCallback?eventGroupIdCallback(e):'';if(groupId){id+='/'+groupId;}
if(id===path[matchedDepth].id){++matchedDepth;}
return false;}
function onEndEvent(e){--depth;if(matchedDepth>depth){matchedDepth=depth;}}
this._children=children;return children;}}
export class TopDownRootNode extends TopDownNode{constructor(events,filters,startTime,endTime,doNotAggregate,eventGroupIdCallback){super('',null,null);this._root=this;this._events=events;this._filter=e=>filters.every(f=>f.accept(e));this._startTime=startTime;this._endTime=endTime;this._eventGroupIdCallback=eventGroupIdCallback;this._doNotAggregate=doNotAggregate;this.totalTime=endTime-startTime;this.selfTime=this.totalTime;}
children(){return this._children||this._grouppedTopNodes();}
_grouppedTopNodes(){const flatNodes=super.children();for(const node of flatNodes.values()){this.selfTime-=node.totalTime;}
if(!this._eventGroupIdCallback){return flatNodes;}
const groupNodes=new Map();for(const node of flatNodes.values()){const groupId=this._eventGroupIdCallback((node.event));let groupNode=groupNodes.get(groupId);if(!groupNode){groupNode=new GroupNode(groupId,this,(node.event));groupNodes.set(groupId,groupNode);}
groupNode.addChild(node,node.selfTime,node.totalTime);}
this._children=groupNodes;return groupNodes;}}
export class BottomUpRootNode extends Node{constructor(events,textFilter,filters,startTime,endTime,eventGroupIdCallback){super('',null);this._children=null;this._events=events;this._textFilter=textFilter;this._filter=e=>filters.every(f=>f.accept(e));this._startTime=startTime;this._endTime=endTime;this._eventGroupIdCallback=eventGroupIdCallback;this.totalTime=endTime-startTime;}
hasChildren(){return true;}
_filterChildren(children){for(const[id,child]of children){if(child.event&&!this._textFilter.accept(child.event)){children.delete((id));}}
return children;}
children(){if(!this._children){this._children=this._filterChildren(this._grouppedTopNodes());}
return this._children;}
_ungrouppedTopNodes(){const root=this;const startTime=this._startTime;const endTime=this._endTime;const nodeById=new Map();const selfTimeStack=[endTime-startTime];const firstNodeStack=[];const totalTimeById=new Map();TimelineModel.TimelineModel.forEachEvent(this._events,onStartEvent,onEndEvent,undefined,startTime,endTime,this._filter);function onStartEvent(e){const duration=Math.min(e.endTime,endTime)-Math.max(e.startTime,startTime);selfTimeStack[selfTimeStack.length-1]-=duration;selfTimeStack.push(duration);const id=_eventId(e);const noNodeOnStack=!totalTimeById.has(id);if(noNodeOnStack){totalTimeById.set(id,duration);}
firstNodeStack.push(noNodeOnStack);}
function onEndEvent(e){const id=_eventId(e);let node=nodeById.get(id);if(!node){node=new BottomUpNode(root,id,e,false,root);nodeById.set(id,node);}
node.selfTime+=selfTimeStack.pop();if(firstNodeStack.pop()){node.totalTime+=totalTimeById.get(id);totalTimeById.delete(id);}
if(firstNodeStack.length){node.setHasChildren();}}
this.selfTime=selfTimeStack.pop();for(const pair of nodeById){if(pair[1].selfTime<=0){nodeById.delete((pair[0]));}}
return nodeById;}
_grouppedTopNodes(){const flatNodes=this._ungrouppedTopNodes();if(!this._eventGroupIdCallback){return flatNodes;}
const groupNodes=new Map();for(const node of flatNodes.values()){const groupId=this._eventGroupIdCallback((node.event));let groupNode=groupNodes.get(groupId);if(!groupNode){groupNode=new GroupNode(groupId,this,(node.event));groupNodes.set(groupId,groupNode);}
groupNode.addChild(node,node.selfTime,node.selfTime);}
return groupNodes;}}
export class GroupNode extends Node{constructor(id,parent,event){super(id,event);this._children=new Map();this.parent=parent;this._isGroupNode=true;}
addChild(child,selfTime,totalTime){this._children.set(child.id,child);this.selfTime+=selfTime;this.totalTime+=totalTime;child.parent=this;}
hasChildren(){return true;}
children(){return this._children;}}
export class BottomUpNode extends Node{constructor(root,id,event,hasChildren,parent){super(id,event);this.parent=parent;this._root=root;this._depth=(parent._depth||0)+1;this._cachedChildren=null;this._hasChildren=hasChildren;}
setHasChildren(){this._hasChildren=true;}
hasChildren(){return this._hasChildren;}
children(){if(this._cachedChildren){return this._cachedChildren;}
const selfTimeStack=[0];const eventIdStack=[];const eventStack=[];const nodeById=new Map();const startTime=this._root._startTime;const endTime=this._root._endTime;let lastTimeMarker=startTime;const self=this;TimelineModel.TimelineModel.forEachEvent(this._root._events,onStartEvent,onEndEvent,undefined,startTime,endTime,this._root._filter);function onStartEvent(e){const duration=Math.min(e.endTime,endTime)-Math.max(e.startTime,startTime);if(duration<0){console.assert(false,'Negative duration of an event');}
selfTimeStack[selfTimeStack.length-1]-=duration;selfTimeStack.push(duration);const id=_eventId(e);eventIdStack.push(id);eventStack.push(e);}
function onEndEvent(e){const selfTime=selfTimeStack.pop();const id=eventIdStack.pop();eventStack.pop();let node;for(node=self;node._depth>1;node=node.parent){if(node.id!==eventIdStack[eventIdStack.length+1-node._depth]){return;}}
if(node.id!==id||eventIdStack.length<self._depth){return;}
const childId=eventIdStack[eventIdStack.length-self._depth];node=nodeById.get(childId);if(!node){const event=eventStack[eventStack.length-self._depth];const hasChildren=eventStack.length>self._depth;node=new BottomUpNode(self._root,childId,event,hasChildren,self);nodeById.set(childId,node);}
const totalTime=Math.min(e.endTime,endTime)-Math.max(e.startTime,lastTimeMarker);node.selfTime+=selfTime;node.totalTime+=totalTime;lastTimeMarker=Math.min(e.endTime,endTime);}
this._cachedChildren=this._root._filterChildren(nodeById);return this._cachedChildren;}
searchTree(matchFunction,results){results=results||[];if(this.event&&matchFunction(this.event)){results.push(this);}
return results;}}
export function eventURL(event){const data=event.args['data']||event.args['beginData'];if(data&&data['url']){return data['url'];}
let frame=eventStackFrame(event);while(frame){const url=frame['url'];if(url){return url;}
frame=frame.parent;}
return null;}
export function eventStackFrame(event){if(event.name===TimelineModel.TimelineModel.RecordType.JSFrame){return(event.args['data']||null);}
return TimelineModel.TimelineData.forEvent(event).topFrame();}
export function _eventId(event){if(event.name===TimelineModel.TimelineModel.RecordType.TimeStamp){return`${event.name}:${event.args.data.message}`;}
if(event.name!==TimelineModel.TimelineModel.RecordType.JSFrame){return event.name;}
const frame=event.args['data'];const location=frame['scriptId']||frame['url']||'';const functionName=frame['functionName'];const name=TimelineModel.TimelineJSProfileProcessor.isNativeRuntimeFrame(frame)?TimelineModel.TimelineJSProfileProcessor.nativeGroup(functionName)||functionName:`${functionName}:${frame['lineNumber']}:${frame['columnNumber']}`;return`f:${name}@${location}`;}
self.TimelineModel=self.TimelineModel||{};TimelineModel=TimelineModel||{};TimelineModel.TimelineProfileTree={};TimelineModel.TimelineProfileTree.Node=Node;TimelineModel.TimelineProfileTree.TopDownNode=TopDownNode;TimelineModel.TimelineProfileTree.TopDownRootNode=TopDownRootNode;TimelineModel.TimelineProfileTree.BottomUpRootNode=BottomUpRootNode;TimelineModel.TimelineProfileTree.GroupNode=GroupNode;TimelineModel.TimelineProfileTree.BottomUpNode=BottomUpNode;TimelineModel.TimelineProfileTree.eventURL=eventURL;TimelineModel.TimelineProfileTree.eventStackFrame=eventStackFrame;TimelineModel.TimelineProfileTree._eventId=_eventId;TimelineModel.TimelineProfileTree.ChildrenCache;