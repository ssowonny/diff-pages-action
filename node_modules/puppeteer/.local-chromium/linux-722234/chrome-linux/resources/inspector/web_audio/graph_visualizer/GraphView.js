export class GraphView extends Common.Object{constructor(contextId){super();this.contextId=contextId;this._nodes=new Map();this._edges=new Map();this._outboundEdgeMap=new Platform.Multimap();this._inboundEdgeMap=new Platform.Multimap();this._nodeLabelGenerator=new WebAudio.GraphVisualizer.NodeLabelGenerator();this._paramIdToNodeIdMap=new Map();}
addNode(data){const label=this._nodeLabelGenerator.generateLabel(data.nodeType);const node=new WebAudio.GraphVisualizer.NodeView(data,label);this._nodes.set(data.nodeId,node);this._notifyShouldRedraw();}
removeNode(nodeId){this._outboundEdgeMap.get(nodeId).forEach(edgeId=>this._removeEdge(edgeId));this._inboundEdgeMap.get(nodeId).forEach(edgeId=>this._removeEdge(edgeId));this._nodes.delete(nodeId);this._notifyShouldRedraw();}
addParam(data){const node=this.getNodeById(data.nodeId);if(!node){console.error(`AudioNode should be added before AudioParam`);return;}
node.addParamPort(data.paramId,data.paramType);this._paramIdToNodeIdMap.set(data.paramId,data.nodeId);this._notifyShouldRedraw();}
removeParam(paramId){this._paramIdToNodeIdMap.delete(paramId);}
addNodeToNodeConnection(edgeData){const edge=new WebAudio.GraphVisualizer.EdgeView(edgeData,WebAudio.GraphVisualizer.EdgeTypes.NodeToNode);this._addEdge(edge);}
removeNodeToNodeConnection(edgeData){if(edgeData.destinationId){const{edgeId}=WebAudio.GraphVisualizer.generateEdgePortIdsByData((edgeData),WebAudio.GraphVisualizer.EdgeTypes.NodeToNode);this._removeEdge(edgeId);}else{this._outboundEdgeMap.get(edgeData.sourceId).forEach(edgeId=>this._removeEdge(edgeId));}}
addNodeToParamConnection(edgeData){const edge=new WebAudio.GraphVisualizer.EdgeView(edgeData,WebAudio.GraphVisualizer.EdgeTypes.NodeToParam);this._addEdge(edge);}
removeNodeToParamConnection(edgeData){const{edgeId}=WebAudio.GraphVisualizer.generateEdgePortIdsByData(edgeData,WebAudio.GraphVisualizer.EdgeTypes.NodeToParam);this._removeEdge(edgeId);}
getNodeById(nodeId){return this._nodes.get(nodeId);}
getNodes(){return this._nodes;}
getEdges(){return this._edges;}
getNodeIdByParamId(paramId){return this._paramIdToNodeIdMap.get(paramId);}
_addEdge(edge){const sourceId=edge.sourceId;if(this._outboundEdgeMap.hasValue(sourceId,edge.id)){return;}
this._edges.set(edge.id,edge);this._outboundEdgeMap.set(sourceId,edge.id);this._inboundEdgeMap.set(edge.destinationId,edge.id);this._notifyShouldRedraw();}
_removeEdge(edgeId){const edge=this._edges.get(edgeId);if(!edge){return;}
this._outboundEdgeMap.delete(edge.sourceId,edgeId);this._inboundEdgeMap.delete(edge.destinationId,edgeId);this._edges.delete(edgeId);this._notifyShouldRedraw();}
_notifyShouldRedraw(){this.dispatchEventToListeners(Events.ShouldRedraw,this);}}
export const Events={ShouldRedraw:Symbol('ShouldRedraw')};self.WebAudio=self.WebAudio||{};WebAudio=WebAudio||{};WebAudio.GraphVisualizer=WebAudio.GraphVisualizer||{};WebAudio.GraphVisualizer.GraphView=GraphView;WebAudio.GraphVisualizer.GraphView.Events=Events;