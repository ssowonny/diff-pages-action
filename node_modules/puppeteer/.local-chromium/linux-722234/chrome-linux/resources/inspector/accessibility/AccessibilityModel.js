export class AccessibilityNode{constructor(accessibilityModel,payload){this._accessibilityModel=accessibilityModel;this._agent=accessibilityModel._agent;this._id=payload.nodeId;accessibilityModel._setAXNodeForAXId(this._id,this);if(payload.backendDOMNodeId){accessibilityModel._setAXNodeForBackendDOMNodeId(payload.backendDOMNodeId,this);this._backendDOMNodeId=payload.backendDOMNodeId;this._deferredDOMNode=new SDK.DeferredDOMNode(accessibilityModel.target(),payload.backendDOMNodeId);}else{this._backendDOMNodeId=null;this._deferredDOMNode=null;}
this._ignored=payload.ignored;if(this._ignored&&'ignoredReasons'in payload){this._ignoredReasons=payload.ignoredReasons;}
this._role=payload.role||null;this._name=payload.name||null;this._description=payload.description||null;this._value=payload.value||null;this._properties=payload.properties||null;this._childIds=payload.childIds||null;this._parentNode=null;}
accessibilityModel(){return this._accessibilityModel;}
ignored(){return this._ignored;}
ignoredReasons(){return this._ignoredReasons||null;}
role(){return this._role||null;}
coreProperties(){const properties=[];if(this._name){properties.push(({name:'name',value:this._name}));}
if(this._description){properties.push(({name:'description',value:this._description}));}
if(this._value){properties.push(({name:'value',value:this._value}));}
return properties;}
name(){return this._name||null;}
description(){return this._description||null;}
value(){return this._value||null;}
properties(){return this._properties||null;}
parentNode(){return this._parentNode;}
_setParentNode(parentNode){this._parentNode=parentNode;}
isDOMNode(){return!!this._backendDOMNodeId;}
backendDOMNodeId(){return this._backendDOMNodeId;}
deferredDOMNode(){return this._deferredDOMNode;}
highlightDOMNode(){if(!this.deferredDOMNode()){return;}
this.deferredDOMNode().highlight();}
children(){const children=[];if(!this._childIds){return children;}
for(const childId of this._childIds){const child=this._accessibilityModel.axNodeForId(childId);if(child){children.push(child);}}
return children;}
numChildren(){if(!this._childIds){return 0;}
return this._childIds.length;}
hasOnlyUnloadedChildren(){if(!this._childIds||!this._childIds.length){return false;}
return!this._childIds.some(id=>this._accessibilityModel.axNodeForId(id)!==undefined);}
printSelfAndChildren(inspectedNode,leadingSpace){let string=leadingSpace||'';if(this._role){string+=this._role.value;}else{string+='<no role>';}
string+=(this._name?' '+this._name.value:'');string+=' '+this._id;if(this._domNode){string+=' ('+this._domNode.nodeName()+')';}
if(this===inspectedNode){string+=' *';}
for(const child of this.children()){string+='\n'+child.printSelfAndChildren(inspectedNode,(leadingSpace||'')+'  ');}
return string;}}
export default class AccessibilityModel extends SDK.SDKModel{constructor(target){super(target);this._agent=target.accessibilityAgent();this._axIdToAXNode=new Map();this._backendDOMNodeIdToAXNode=new Map();}
clear(){this._axIdToAXNode.clear();}
async requestPartialAXTree(node){const payloads=await this._agent.getPartialAXTree(node.id,undefined,undefined,true);if(!payloads){return;}
for(const payload of payloads){new Accessibility.AccessibilityNode(this,payload);}
for(const axNode of this._axIdToAXNode.values()){for(const axChild of axNode.children()){axChild._setParentNode(axNode);}}}
axNodeForId(axId){return this._axIdToAXNode.get(axId);}
_setAXNodeForAXId(axId,axNode){this._axIdToAXNode.set(axId,axNode);}
axNodeForDOMNode(domNode){if(!domNode){return null;}
return this._backendDOMNodeIdToAXNode.get(domNode.backendNodeId());}
_setAXNodeForBackendDOMNodeId(backendDOMNodeId,axNode){this._backendDOMNodeIdToAXNode.set(backendDOMNodeId,axNode);}
logTree(inspectedNode){let rootNode=inspectedNode;while(rootNode.parentNode()){rootNode=rootNode.parentNode();}
console.log(rootNode.printSelfAndChildren(inspectedNode));}}
self.Accessibility=self.Accessibility||{};Accessibility=Accessibility||{};Accessibility.AccessibilityNode=AccessibilityNode;Accessibility.AccessibilityModel=AccessibilityModel;SDK.SDKModel.register(Accessibility.AccessibilityModel,SDK.Target.Capability.DOM,false);