export class TimelineFrameModel{constructor(categoryMapper){this._categoryMapper=categoryMapper;this.reset();}
frames(startTime,endTime){if(!startTime&&!endTime){return this._frames;}
const firstFrame=this._frames.lowerBound(startTime||0,(time,frame)=>time-frame.endTime);const lastFrame=this._frames.lowerBound(endTime||Infinity,(time,frame)=>time-frame.startTime);return this._frames.slice(firstFrame,lastFrame);}
hasRasterTile(rasterTask){const data=rasterTask.args['tileData'];if(!data){return false;}
const frameId=data['sourceFrameNumber'];const frame=frameId&&this._frameById[frameId];if(!frame||!frame.layerTree){return false;}
return true;}
rasterTilePromise(rasterTask){if(!this._target){return Promise.resolve(null);}
const data=rasterTask.args['tileData'];const frameId=data['sourceFrameNumber'];const tileId=data['tileId']&&data['tileId']['id_ref'];const frame=frameId&&this._frameById[frameId];if(!frame||!frame.layerTree||!tileId){return Promise.resolve(null);}
return frame.layerTree.layerTreePromise().then(layerTree=>layerTree&&layerTree.pictureForRasterTile(tileId));}
reset(){this._minimumRecordTime=Infinity;this._frames=[];this._frameById={};this._lastFrame=null;this._lastLayerTree=null;this._mainFrameCommitted=false;this._mainFrameRequested=false;this._framePendingCommit=null;this._lastBeginFrame=null;this._lastNeedsBeginFrame=null;this._framePendingActivation=null;this._lastTaskBeginTime=null;this._target=null;this._layerTreeId=null;this._currentTaskTimeByCategory={};}
handleBeginFrame(startTime){if(!this._lastFrame){this._startFrame(startTime);}
this._lastBeginFrame=startTime;}
handleDrawFrame(startTime){if(!this._lastFrame){this._startFrame(startTime);return;}
if(this._mainFrameCommitted||!this._mainFrameRequested){if(this._lastNeedsBeginFrame){const idleTimeEnd=this._framePendingActivation?this._framePendingActivation.triggerTime:(this._lastBeginFrame||this._lastNeedsBeginFrame);if(idleTimeEnd>this._lastFrame.startTime){this._lastFrame.idle=true;this._startFrame(idleTimeEnd);if(this._framePendingActivation){this._commitPendingFrame();}
this._lastBeginFrame=null;}
this._lastNeedsBeginFrame=null;}
this._startFrame(startTime);}
this._mainFrameCommitted=false;}
handleActivateLayerTree(){if(!this._lastFrame){return;}
if(this._framePendingActivation&&!this._lastNeedsBeginFrame){this._commitPendingFrame();}}
handleRequestMainThreadFrame(){if(!this._lastFrame){return;}
this._mainFrameRequested=true;}
handleCompositeLayers(){if(!this._framePendingCommit){return;}
this._framePendingActivation=this._framePendingCommit;this._framePendingCommit=null;this._mainFrameRequested=false;this._mainFrameCommitted=true;}
handleLayerTreeSnapshot(layerTree){this._lastLayerTree=layerTree;}
handleNeedFrameChanged(startTime,needsBeginFrame){if(needsBeginFrame){this._lastNeedsBeginFrame=startTime;}}
_startFrame(startTime){if(this._lastFrame){this._flushFrame(this._lastFrame,startTime);}
this._lastFrame=new TimelineFrame(startTime,startTime-this._minimumRecordTime);}
_flushFrame(frame,endTime){frame._setLayerTree(this._lastLayerTree);frame._setEndTime(endTime);if(this._lastLayerTree){this._lastLayerTree._setPaints(frame._paints);}
if(this._frames.length&&(frame.startTime!==this._frames.peekLast().endTime||frame.startTime>frame.endTime)){console.assert(false,`Inconsistent frame time for frame ${this._frames.length} (${frame.startTime} - ${frame.endTime})`);}
this._frames.push(frame);if(typeof frame._mainFrameId==='number'){this._frameById[frame._mainFrameId]=frame;}}
_commitPendingFrame(){this._lastFrame._addTimeForCategories(this._framePendingActivation.timeByCategory);this._lastFrame._paints=this._framePendingActivation.paints;this._lastFrame._mainFrameId=this._framePendingActivation.mainFrameId;this._framePendingActivation=null;}
addTraceEvents(target,events,threadData){this._target=target;let j=0;this._currentProcessMainThread=threadData.length&&threadData[0].thread||null;for(let i=0;i<events.length;++i){while(j+1<threadData.length&&threadData[j+1].time<=events[i].startTime){this._currentProcessMainThread=threadData[++j].thread;}
this._addTraceEvent(events[i]);}
this._currentProcessMainThread=null;}
_addTraceEvent(event){const eventNames=TimelineModel.TimelineModel.RecordType;if(event.startTime&&event.startTime<this._minimumRecordTime){this._minimumRecordTime=event.startTime;}
if(event.name===eventNames.SetLayerTreeId){this._layerTreeId=event.args['layerTreeId']||event.args['data']['layerTreeId'];}else if(event.phase===SDK.TracingModel.Phase.SnapshotObject&&event.name===eventNames.LayerTreeHostImplSnapshot&&parseInt(event.id,0)===this._layerTreeId){const snapshot=(event);this.handleLayerTreeSnapshot(new TracingFrameLayerTree(this._target,snapshot));}else{this._processCompositorEvents(event);if(event.thread===this._currentProcessMainThread){this._addMainThreadTraceEvent(event);}else if(this._lastFrame&&event.selfTime&&!SDK.TracingModel.isTopLevelEvent(event)){this._lastFrame._addTimeForCategory(this._categoryMapper(event),event.selfTime);}}}
_processCompositorEvents(event){const eventNames=TimelineModel.TimelineModel.RecordType;if(event.args['layerTreeId']!==this._layerTreeId){return;}
const timestamp=event.startTime;if(event.name===eventNames.BeginFrame){this.handleBeginFrame(timestamp);}else if(event.name===eventNames.DrawFrame){this.handleDrawFrame(timestamp);}else if(event.name===eventNames.ActivateLayerTree){this.handleActivateLayerTree();}else if(event.name===eventNames.RequestMainThreadFrame){this.handleRequestMainThreadFrame();}else if(event.name===eventNames.NeedsBeginFrameChanged){this.handleNeedFrameChanged(timestamp,event.args['data']&&event.args['data']['needsBeginFrame']);}}
_addMainThreadTraceEvent(event){const eventNames=TimelineModel.TimelineModel.RecordType;if(SDK.TracingModel.isTopLevelEvent(event)){this._currentTaskTimeByCategory={};this._lastTaskBeginTime=event.startTime;}
if(!this._framePendingCommit&&TimelineFrameModel._mainFrameMarkers.indexOf(event.name)>=0){this._framePendingCommit=new TimelineModel.PendingFrame(this._lastTaskBeginTime||event.startTime,this._currentTaskTimeByCategory);}
if(!this._framePendingCommit){this._addTimeForCategory(this._currentTaskTimeByCategory,event);return;}
this._addTimeForCategory(this._framePendingCommit.timeByCategory,event);if(event.name===eventNames.BeginMainThreadFrame&&event.args['data']&&event.args['data']['frameId']){this._framePendingCommit.mainFrameId=event.args['data']['frameId'];}
if(event.name===eventNames.Paint&&event.args['data']['layerId']&&TimelineModel.TimelineData.forEvent(event).picture&&this._target){this._framePendingCommit.paints.push(new LayerPaintEvent(event,this._target));}
if(event.name===eventNames.CompositeLayers&&event.args['layerTreeId']===this._layerTreeId){this.handleCompositeLayers();}}
_addTimeForCategory(timeByCategory,event){if(!event.selfTime){return;}
const categoryName=this._categoryMapper(event);timeByCategory[categoryName]=(timeByCategory[categoryName]||0)+event.selfTime;}}
TimelineFrameModel._mainFrameMarkers=[TimelineModel.TimelineModel.RecordType.ScheduleStyleRecalculation,TimelineModel.TimelineModel.RecordType.InvalidateLayout,TimelineModel.TimelineModel.RecordType.BeginMainThreadFrame,TimelineModel.TimelineModel.RecordType.ScrollLayer];export class TracingFrameLayerTree{constructor(target,snapshot){this._target=target;this._snapshot=snapshot;this._paints;}
async layerTreePromise(){const result=await this._snapshot.objectPromise();if(!result){return null;}
const viewport=result['device_viewport_size'];const tiles=result['active_tiles'];const rootLayer=result['active_tree']['root_layer'];const layers=result['active_tree']['layers'];const layerTree=new TimelineModel.TracingLayerTree(this._target);layerTree.setViewportSize(viewport);layerTree.setTiles(tiles);await layerTree.setLayers(rootLayer,layers,this._paints||[]);return layerTree;}
paints(){return this._paints||[];}
_setPaints(paints){this._paints=paints;}}
export class TimelineFrame{constructor(startTime,startTimeOffset){this.startTime=startTime;this.startTimeOffset=startTimeOffset;this.endTime=this.startTime;this.duration=0;this.timeByCategory={};this.cpuTime=0;this.idle=false;this.layerTree=null;this._paints=[];this._mainFrameId=undefined;}
hasWarnings(){return false;}
_setEndTime(endTime){this.endTime=endTime;this.duration=this.endTime-this.startTime;}
_setLayerTree(layerTree){this.layerTree=layerTree;}
_addTimeForCategories(timeByCategory){for(const category in timeByCategory){this._addTimeForCategory(category,timeByCategory[category]);}}
_addTimeForCategory(category,time){this.timeByCategory[category]=(this.timeByCategory[category]||0)+time;this.cpuTime+=time;}}
export class LayerPaintEvent{constructor(event,target){this._event=event;this._target=target;}
layerId(){return this._event.args['data']['layerId'];}
event(){return this._event;}
picturePromise(){const picture=TimelineModel.TimelineData.forEvent(this._event).picture;return picture.objectPromise().then(result=>{if(!result){return null;}
const rect=result['params']&&result['params']['layer_rect'];const picture=result['skp64'];return rect&&picture?{rect:rect,serializedPicture:picture}:null;});}
snapshotPromise(){const paintProfilerModel=this._target&&this._target.model(SDK.PaintProfilerModel);return this.picturePromise().then(picture=>{if(!picture||!paintProfilerModel){return null;}
return paintProfilerModel.loadSnapshot(picture.serializedPicture).then(snapshot=>snapshot?{rect:picture.rect,snapshot:snapshot}:null);});}}
export class PendingFrame{constructor(triggerTime,timeByCategory){this.timeByCategory=timeByCategory;this.paints=[];this.mainFrameId=undefined;this.triggerTime=triggerTime;}}
self.TimelineModel=self.TimelineModel||{};TimelineModel=TimelineModel||{};TimelineModel.TimelineFrameModel=TimelineFrameModel;TimelineModel.TracingFrameLayerTree=TracingFrameLayerTree;TimelineModel.TimelineFrame=TimelineFrame;TimelineModel.LayerPaintEvent=LayerPaintEvent;TimelineModel.PendingFrame=PendingFrame;