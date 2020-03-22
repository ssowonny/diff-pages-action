export default class LayerTreeModel extends SDK.SDKModel{constructor(target){super(target);this._layerTreeAgent=target.layerTreeAgent();target.registerLayerTreeDispatcher(new LayerTreeDispatcher(this));this._paintProfilerModel=(target.model(SDK.PaintProfilerModel));const resourceTreeModel=target.model(SDK.ResourceTreeModel);if(resourceTreeModel){resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.MainFrameNavigated,this._onMainFrameNavigated,this);}
this._layerTree=null;this._throttler=new Common.Throttler(20);}
disable(){if(!this._enabled){return;}
this._enabled=false;this._layerTreeAgent.disable();}
enable(){if(this._enabled){return;}
this._enabled=true;this._forceEnable();}
_forceEnable(){this._lastPaintRectByLayerId={};if(!this._layerTree){this._layerTree=new AgentLayerTree(this);}
this._layerTreeAgent.enable();}
layerTree(){return this._layerTree;}
async _layerTreeChanged(layers){if(!this._enabled){return;}
this._throttler.schedule(this._innerSetLayers.bind(this,layers));}
async _innerSetLayers(layers){const layerTree=(this._layerTree);await layerTree.setLayers(layers);for(const layerId in this._lastPaintRectByLayerId){const lastPaintRect=this._lastPaintRectByLayerId[layerId];const layer=layerTree.layerById(layerId);if(layer){(layer)._lastPaintRect=lastPaintRect;}}
this._lastPaintRectByLayerId={};this.dispatchEventToListeners(Events.LayerTreeChanged);}
_layerPainted(layerId,clipRect){if(!this._enabled){return;}
const layerTree=(this._layerTree);const layer=(layerTree.layerById(layerId));if(!layer){this._lastPaintRectByLayerId[layerId]=clipRect;return;}
layer._didPaint(clipRect);this.dispatchEventToListeners(Events.LayerPainted,layer);}
_onMainFrameNavigated(){this._layerTree=null;if(this._enabled){this._forceEnable();}}}
SDK.SDKModel.register(LayerTreeModel,SDK.Target.Capability.DOM,false);export const Events={LayerTreeChanged:Symbol('LayerTreeChanged'),LayerPainted:Symbol('LayerPainted'),};export class AgentLayerTree extends SDK.LayerTreeBase{constructor(layerTreeModel){super(layerTreeModel.target());this._layerTreeModel=layerTreeModel;}
async setLayers(payload){if(!payload){this._innerSetLayers(payload);return;}
const idsToResolve=new Set();for(let i=0;i<payload.length;++i){const backendNodeId=payload[i].backendNodeId;if(!backendNodeId||this.backendNodeIdToNode().has(backendNodeId)){continue;}
idsToResolve.add(backendNodeId);}
await this.resolveBackendNodeIds(idsToResolve);this._innerSetLayers(payload);}
_innerSetLayers(layers){this.setRoot(null);this.setContentRoot(null);if(!layers){return;}
let root;const oldLayersById=this._layersById;this._layersById={};for(let i=0;i<layers.length;++i){const layerId=layers[i].layerId;let layer=oldLayersById[layerId];if(layer){layer._reset(layers[i]);}else{layer=new AgentLayer(this._layerTreeModel,layers[i]);}
this._layersById[layerId]=layer;const backendNodeId=layers[i].backendNodeId;if(backendNodeId){layer._setNode(this.backendNodeIdToNode().get(backendNodeId));}
if(!this.contentRoot()&&layer.drawsContent()){this.setContentRoot(layer);}
const parentId=layer.parentId();if(parentId){const parent=this._layersById[parentId];if(!parent){console.assert(parent,'missing parent '+parentId+' for layer '+layerId);}
parent.addChild(layer);}else{if(root){console.assert(false,'Multiple root layers');}
root=layer;}}
if(root){this.setRoot(root);root._calculateQuad(new WebKitCSSMatrix());}}}
export class AgentLayer{constructor(layerTreeModel,layerPayload){this._layerTreeModel=layerTreeModel;this._reset(layerPayload);}
id(){return this._layerPayload.layerId;}
parentId(){return this._layerPayload.parentLayerId;}
parent(){return this._parent;}
isRoot(){return!this.parentId();}
children(){return this._children;}
addChild(childParam){const child=(childParam);if(child._parent){console.assert(false,'Child already has a parent');}
this._children.push(child);child._parent=this;}
_setNode(node){this._node=node;}
node(){return this._node;}
nodeForSelfOrAncestor(){for(let layer=this;layer;layer=layer._parent){if(layer._node){return layer._node;}}
return null;}
offsetX(){return this._layerPayload.offsetX;}
offsetY(){return this._layerPayload.offsetY;}
width(){return this._layerPayload.width;}
height(){return this._layerPayload.height;}
transform(){return this._layerPayload.transform;}
quad(){return this._quad;}
anchorPoint(){return[this._layerPayload.anchorX||0,this._layerPayload.anchorY||0,this._layerPayload.anchorZ||0,];}
invisible(){return this._layerPayload.invisible;}
paintCount(){return this._paintCount||this._layerPayload.paintCount;}
lastPaintRect(){return this._lastPaintRect;}
scrollRects(){return this._scrollRects;}
stickyPositionConstraint(){return this._stickyPositionConstraint;}
async requestCompositingReasons(){const reasons=await this._layerTreeModel._layerTreeAgent.compositingReasons(this.id());return reasons||[];}
drawsContent(){return this._layerPayload.drawsContent;}
gpuMemoryUsage(){const bytesPerPixel=4;return this.drawsContent()?this.width()*this.height()*bytesPerPixel:0;}
snapshots(){const promise=this._layerTreeModel._paintProfilerModel.makeSnapshot(this.id()).then(snapshot=>{if(!snapshot){return null;}
return{rect:{x:0,y:0,width:this.width(),height:this.height()},snapshot:snapshot};});return[promise];}
_didPaint(rect){this._lastPaintRect=rect;this._paintCount=this.paintCount()+1;this._image=null;}
_reset(layerPayload){this._node=null;this._children=[];this._parent=null;this._paintCount=0;this._layerPayload=layerPayload;this._image=null;this._scrollRects=this._layerPayload.scrollRects||[];this._stickyPositionConstraint=this._layerPayload.stickyPositionConstraint?new SDK.Layer.StickyPositionConstraint(this._layerTreeModel.layerTree(),this._layerPayload.stickyPositionConstraint):null;}
_matrixFromArray(a){function toFixed9(x){return x.toFixed(9);}
return new WebKitCSSMatrix('matrix3d('+a.map(toFixed9).join(',')+')');}
_calculateTransformToViewport(parentTransform){const offsetMatrix=new WebKitCSSMatrix().translate(this._layerPayload.offsetX,this._layerPayload.offsetY);let matrix=offsetMatrix;if(this._layerPayload.transform){const transformMatrix=this._matrixFromArray(this._layerPayload.transform);const anchorVector=new UI.Geometry.Vector(this._layerPayload.width*this.anchorPoint()[0],this._layerPayload.height*this.anchorPoint()[1],this.anchorPoint()[2]);const anchorPoint=UI.Geometry.multiplyVectorByMatrixAndNormalize(anchorVector,matrix);const anchorMatrix=new WebKitCSSMatrix().translate(-anchorPoint.x,-anchorPoint.y,-anchorPoint.z);matrix=anchorMatrix.inverse().multiply(transformMatrix.multiply(anchorMatrix.multiply(matrix)));}
matrix=parentTransform.multiply(matrix);return matrix;}
_createVertexArrayForRect(width,height){return[0,0,0,width,0,0,width,height,0,0,height,0];}
_calculateQuad(parentTransform){const matrix=this._calculateTransformToViewport(parentTransform);this._quad=[];const vertices=this._createVertexArrayForRect(this._layerPayload.width,this._layerPayload.height);for(let i=0;i<4;++i){const point=UI.Geometry.multiplyVectorByMatrixAndNormalize(new UI.Geometry.Vector(vertices[i*3],vertices[i*3+1],vertices[i*3+2]),matrix);this._quad.push(point.x,point.y);}
function calculateQuadForLayer(layer){layer._calculateQuad(matrix);}
this._children.forEach(calculateQuadForLayer);}}
class LayerTreeDispatcher{constructor(layerTreeModel){this._layerTreeModel=layerTreeModel;}
layerTreeDidChange(layers){this._layerTreeModel._layerTreeChanged(layers||null);}
layerPainted(layerId,clipRect){this._layerTreeModel._layerPainted(layerId,clipRect);}}
self.Layers=self.Layers||{};Layers=Layers||{};Layers.LayerTreeModel=LayerTreeModel;Layers.LayerTreeModel.Events=Events;Layers.AgentLayerTree=AgentLayerTree;Layers.AgentLayer=AgentLayer;