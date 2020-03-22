export class GraphManager extends Common.Object{constructor(){super();this._graphMapByContextId=new Map();}
createContext(contextId){const graph=new WebAudio.GraphVisualizer.GraphView(contextId);graph.addEventListener(WebAudio.GraphVisualizer.GraphView.Events.ShouldRedraw,this._notifyShouldRedraw,this);this._graphMapByContextId.set(contextId,graph);}
destroyContext(contextId){if(!this._graphMapByContextId.has(contextId)){return;}
const graph=this._graphMapByContextId.get(contextId);graph.removeEventListener(WebAudio.GraphVisualizer.GraphView.Events.ShouldRedraw,this._notifyShouldRedraw,this);this._graphMapByContextId.delete(contextId);}
hasContext(contextId){return this._graphMapByContextId.has(contextId);}
clearGraphs(){this._graphMapByContextId.clear();}
getGraph(contextId){return this._graphMapByContextId.get(contextId);}
_notifyShouldRedraw(event){const graph=(event.data);this.dispatchEventToListeners(WebAudio.GraphVisualizer.GraphView.Events.ShouldRedraw,graph);}}
self.WebAudio=self.WebAudio||{};WebAudio=WebAudio||{};WebAudio.GraphVisualizer=WebAudio.GraphVisualizer||{};WebAudio.GraphVisualizer.GraphManager=GraphManager;