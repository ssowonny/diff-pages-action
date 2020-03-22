export default class AccessibilitySidebarView extends UI.ThrottledWidget{constructor(){super();this._node=null;this._axNode=null;this._skipNextPullNode=false;this._sidebarPaneStack=UI.viewManager.createStackLocation();this._breadcrumbsSubPane=new Accessibility.AXBreadcrumbsPane(this);this._sidebarPaneStack.showView(this._breadcrumbsSubPane);this._ariaSubPane=new Accessibility.ARIAAttributesPane();this._sidebarPaneStack.showView(this._ariaSubPane);this._axNodeSubPane=new Accessibility.AXNodeSubPane();this._sidebarPaneStack.showView(this._axNodeSubPane);this._sidebarPaneStack.widget().show(this.element);UI.context.addFlavorChangeListener(SDK.DOMNode,this._pullNode,this);this._pullNode();}
node(){return this._node;}
axNode(){return this._axNode;}
setNode(node,fromAXTree){this._skipNextPullNode=!!fromAXTree;this._node=node;this.update();}
accessibilityNodeCallback(axNode){if(!axNode){return;}
this._axNode=axNode;if(axNode.isDOMNode()){this._sidebarPaneStack.showView(this._ariaSubPane,this._axNodeSubPane);}else{this._sidebarPaneStack.removeView(this._ariaSubPane);}
if(this._axNodeSubPane){this._axNodeSubPane.setAXNode(axNode);}
if(this._breadcrumbsSubPane){this._breadcrumbsSubPane.setAXNode(axNode);}}
doUpdate(){const node=this.node();this._axNodeSubPane.setNode(node);this._ariaSubPane.setNode(node);this._breadcrumbsSubPane.setNode(node);if(!node){return Promise.resolve();}
const accessibilityModel=node.domModel().target().model(Accessibility.AccessibilityModel);accessibilityModel.clear();return accessibilityModel.requestPartialAXTree(node).then(()=>{this.accessibilityNodeCallback(accessibilityModel.axNodeForDOMNode(node));});}
wasShown(){super.wasShown();this.doUpdate();SDK.targetManager.addModelListener(SDK.DOMModel,SDK.DOMModel.Events.AttrModified,this._onAttrChange,this);SDK.targetManager.addModelListener(SDK.DOMModel,SDK.DOMModel.Events.AttrRemoved,this._onAttrChange,this);SDK.targetManager.addModelListener(SDK.DOMModel,SDK.DOMModel.Events.CharacterDataModified,this._onNodeChange,this);SDK.targetManager.addModelListener(SDK.DOMModel,SDK.DOMModel.Events.ChildNodeCountUpdated,this._onNodeChange,this);}
willHide(){SDK.targetManager.removeModelListener(SDK.DOMModel,SDK.DOMModel.Events.AttrModified,this._onAttrChange,this);SDK.targetManager.removeModelListener(SDK.DOMModel,SDK.DOMModel.Events.AttrRemoved,this._onAttrChange,this);SDK.targetManager.removeModelListener(SDK.DOMModel,SDK.DOMModel.Events.CharacterDataModified,this._onNodeChange,this);SDK.targetManager.removeModelListener(SDK.DOMModel,SDK.DOMModel.Events.ChildNodeCountUpdated,this._onNodeChange,this);}
_pullNode(){if(this._skipNextPullNode){this._skipNextPullNode=false;return;}
this.setNode(UI.context.flavor(SDK.DOMNode));}
_onAttrChange(event){if(!this.node()){return;}
const node=event.data.node;if(this.node()!==node){return;}
this.update();}
_onNodeChange(event){if(!this.node()){return;}
const node=event.data;if(this.node()!==node){return;}
this.update();}}
export class AccessibilitySubPane extends UI.SimpleView{constructor(name){super(name);this._axNode=null;this.registerRequiredCSS('accessibility/accessibilityProperties.css');}
setAXNode(axNode){}
node(){return this._node;}
setNode(node){this._node=node;}
createInfo(textContent,className){const classNameOrDefault=className||'gray-info-message';const info=this.element.createChild('div',classNameOrDefault);info.textContent=textContent;return info;}
createTreeOutline(){const treeOutline=new UI.TreeOutlineInShadow();treeOutline.registerRequiredCSS('accessibility/accessibilityNode.css');treeOutline.registerRequiredCSS('accessibility/accessibilityProperties.css');treeOutline.registerRequiredCSS('object_ui/objectValue.css');treeOutline.element.classList.add('hidden');treeOutline.hideOverflow();this.element.appendChild(treeOutline.element);return treeOutline;}}
self.Accessibility=self.Accessibility||{};Accessibility=Accessibility||{};Accessibility.AccessibilitySidebarView=AccessibilitySidebarView;Accessibility.AccessibilitySubPane=AccessibilitySubPane;