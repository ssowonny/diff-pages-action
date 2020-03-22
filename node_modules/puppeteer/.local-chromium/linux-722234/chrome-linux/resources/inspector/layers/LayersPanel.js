export default class LayersPanel extends UI.PanelWithSidebar{constructor(){super('layers',225);this._model=null;SDK.targetManager.observeTargets(this);this._layerViewHost=new LayerViewer.LayerViewHost();this._layerTreeOutline=new LayerViewer.LayerTreeOutline(this._layerViewHost);this._layerTreeOutline.addEventListener(LayerViewer.LayerTreeOutline.Events.PaintProfilerRequested,this._onPaintProfileRequested,this);this.panelSidebarElement().appendChild(this._layerTreeOutline.element);this.setDefaultFocusedElement(this._layerTreeOutline.element);this._rightSplitWidget=new UI.SplitWidget(false,true,'layerDetailsSplitViewState');this.splitWidget().setMainWidget(this._rightSplitWidget);this._layers3DView=new LayerViewer.Layers3DView(this._layerViewHost);this._rightSplitWidget.setMainWidget(this._layers3DView);this._layers3DView.addEventListener(LayerViewer.Layers3DView.Events.PaintProfilerRequested,this._onPaintProfileRequested,this);this._layers3DView.addEventListener(LayerViewer.Layers3DView.Events.ScaleChanged,this._onScaleChanged,this);this._tabbedPane=new UI.TabbedPane();this._rightSplitWidget.setSidebarWidget(this._tabbedPane);this._layerDetailsView=new LayerViewer.LayerDetailsView(this._layerViewHost);this._layerDetailsView.addEventListener(LayerViewer.LayerDetailsView.Events.PaintProfilerRequested,this._onPaintProfileRequested,this);this._tabbedPane.appendTab(Layers.LayersPanel.DetailsViewTabs.Details,Common.UIString('Details'),this._layerDetailsView);this._paintProfilerView=new Layers.LayerPaintProfilerView(this._showImage.bind(this));this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabClosed,this._onTabClosed,this);this._updateThrottler=new Common.Throttler(100);}
focus(){this._layerTreeOutline.focus();}
wasShown(){super.wasShown();if(this._model){this._model.enable();}}
willHide(){if(this._model){this._model.disable();}
super.willHide();}
targetAdded(target){if(this._model){return;}
this._model=target.model(Layers.LayerTreeModel);if(!this._model){return;}
this._model.addEventListener(Layers.LayerTreeModel.Events.LayerTreeChanged,this._onLayerTreeUpdated,this);this._model.addEventListener(Layers.LayerTreeModel.Events.LayerPainted,this._onLayerPainted,this);if(this.isShowing()){this._model.enable();}}
targetRemoved(target){if(!this._model||this._model.target()!==target){return;}
this._model.removeEventListener(Layers.LayerTreeModel.Events.LayerTreeChanged,this._onLayerTreeUpdated,this);this._model.removeEventListener(Layers.LayerTreeModel.Events.LayerPainted,this._onLayerPainted,this);this._model.disable();this._model=null;}
_onLayerTreeUpdated(){this._updateThrottler.schedule(this._update.bind(this));}
_update(){if(this._model){this._layerViewHost.setLayerTree(this._model.layerTree());}
return Promise.resolve();}
_onLayerPainted(event){if(!this._model){return;}
const layer=(event.data);if(this._layerViewHost.selection()&&this._layerViewHost.selection().layer()===layer){this._layerDetailsView.update();}
this._layers3DView.updateLayerSnapshot(layer);}
_onPaintProfileRequested(event){const selection=(event.data);this._layers3DView.snapshotForSelection(selection).then(snapshotWithRect=>{if(!snapshotWithRect){return;}
this._layerBeingProfiled=selection.layer();if(!this._tabbedPane.hasTab(Layers.LayersPanel.DetailsViewTabs.Profiler)){this._tabbedPane.appendTab(Layers.LayersPanel.DetailsViewTabs.Profiler,Common.UIString('Profiler'),this._paintProfilerView,undefined,true,true);}
this._tabbedPane.selectTab(Layers.LayersPanel.DetailsViewTabs.Profiler);this._paintProfilerView.profile(snapshotWithRect.snapshot);});}
_onTabClosed(event){if(event.data.tabId!==Layers.LayersPanel.DetailsViewTabs.Profiler||!this._layerBeingProfiled){return;}
this._paintProfilerView.reset();this._layers3DView.showImageForLayer(this._layerBeingProfiled,undefined);this._layerBeingProfiled=null;}
_showImage(imageURL){this._layers3DView.showImageForLayer(this._layerBeingProfiled,imageURL);}
_onScaleChanged(event){this._paintProfilerView.setScale((event.data));}}
export const DetailsViewTabs={Details:'details',Profiler:'profiler'};self.Layers=self.Layers||{};Layers=Layers||{};Layers.LayersPanel=LayersPanel;Layers.LayersPanel.DetailsViewTabs=DetailsViewTabs;