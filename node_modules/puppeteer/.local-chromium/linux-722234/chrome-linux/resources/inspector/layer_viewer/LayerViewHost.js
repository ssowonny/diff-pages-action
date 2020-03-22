export class LayerView{hoverObject(selection){}
selectObject(selection){}
setLayerTree(layerTree){}}
export class Selection{constructor(type,layer){this._type=type;this._layer=layer;}
static isEqual(a,b){return a&&b?a._isEqual(b):a===b;}
type(){return this._type;}
layer(){return this._layer;}
_isEqual(other){return false;}}
export const Type={Layer:Symbol('Layer'),ScrollRect:Symbol('ScrollRect'),Snapshot:Symbol('Snapshot')};export class LayerSelection extends Selection{constructor(layer){console.assert(layer,'LayerSelection with empty layer');super(Type.Layer,layer);}
_isEqual(other){return other._type===Type.Layer&&other.layer().id()===this.layer().id();}}
export class ScrollRectSelection extends Selection{constructor(layer,scrollRectIndex){super(Type.ScrollRect,layer);this.scrollRectIndex=scrollRectIndex;}
_isEqual(other){return other._type===Type.ScrollRect&&this.layer().id()===other.layer().id()&&this.scrollRectIndex===other.scrollRectIndex;}}
export class SnapshotSelection extends Selection{constructor(layer,snapshot){super(Type.Snapshot,layer);this._snapshot=snapshot;}
_isEqual(other){return other._type===Type.Snapshot&&this.layer().id()===other.layer().id()&&this._snapshot===other._snapshot;}
snapshot(){return this._snapshot;}}
export class LayerViewHost{constructor(){this._views=[];this._selectedObject=null;this._hoveredObject=null;this._showInternalLayersSetting=Common.settings.createSetting('layersShowInternalLayers',false);}
registerView(layerView){this._views.push(layerView);}
setLayerSnapshotMap(snapshotLayers){this._snapshotLayers=snapshotLayers;}
getLayerSnapshotMap(){return this._snapshotLayers;}
setLayerTree(layerTree){this._target=layerTree.target();const selectedLayer=this._selectedObject&&this._selectedObject.layer();if(selectedLayer&&(!layerTree||!layerTree.layerById(selectedLayer.id()))){this.selectObject(null);}
const hoveredLayer=this._hoveredObject&&this._hoveredObject.layer();if(hoveredLayer&&(!layerTree||!layerTree.layerById(hoveredLayer.id()))){this.hoverObject(null);}
for(const view of this._views){view.setLayerTree(layerTree);}}
hoverObject(selection){if(Selection.isEqual(this._hoveredObject,selection)){return;}
this._hoveredObject=selection;const layer=selection&&selection.layer();this._toggleNodeHighlight(layer?layer.nodeForSelfOrAncestor():null);for(const view of this._views){view.hoverObject(selection);}}
selectObject(selection){if(Selection.isEqual(this._selectedObject,selection)){return;}
this._selectedObject=selection;for(const view of this._views){view.selectObject(selection);}}
selection(){return this._selectedObject;}
showContextMenu(contextMenu,selection){contextMenu.defaultSection().appendCheckboxItem(Common.UIString('Show internal layers'),this._toggleShowInternalLayers.bind(this),this._showInternalLayersSetting.get());const node=selection&&selection.layer()&&selection.layer().nodeForSelfOrAncestor();if(node){contextMenu.appendApplicableItems(node);}
contextMenu.show();}
showInternalLayersSetting(){return this._showInternalLayersSetting;}
_toggleShowInternalLayers(){this._showInternalLayersSetting.set(!this._showInternalLayersSetting.get());}
_toggleNodeHighlight(node){if(node){node.highlightForTwoSeconds();return;}
SDK.OverlayModel.hideDOMNodeHighlight();}}
self.LayerViewer=self.LayerViewer||{};LayerViewer=LayerViewer||{};LayerViewer.LayerView=LayerView;LayerViewer.LayerView.Selection=Selection;LayerViewer.LayerView.Selection.Type=Type;LayerViewer.LayerView.LayerSelection=LayerSelection;LayerViewer.LayerView.ScrollRectSelection=ScrollRectSelection;LayerViewer.LayerView.SnapshotSelection=SnapshotSelection;LayerViewer.LayerViewHost=LayerViewHost;