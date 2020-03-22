export class XMLView extends UI.Widget{constructor(parsedXML){super(true);this.registerRequiredCSS('source_frame/xmlView.css');this.contentElement.classList.add('shadow-xml-view','source-code');this._treeOutline=new UI.TreeOutlineInShadow();this._treeOutline.registerRequiredCSS('source_frame/xmlTree.css');this.contentElement.appendChild(this._treeOutline.element);this._searchableView;this._currentSearchFocusIndex=0;this._currentSearchTreeElements=[];this._searchConfig;XMLViewNode.populate(this._treeOutline,parsedXML,this);this._treeOutline.firstChild().select(true,false);}
static createSearchableView(parsedXML){const xmlView=new XMLView(parsedXML);const searchableView=new UI.SearchableView(xmlView);searchableView.setPlaceholder(Common.UIString('Find'));xmlView._searchableView=searchableView;xmlView.show(searchableView.element);return searchableView;}
static parseXML(text,mimeType){let parsedXML;try{parsedXML=(new DOMParser()).parseFromString(text,mimeType);}catch(e){return null;}
if(parsedXML.body){return null;}
return parsedXML;}
_jumpToMatch(index,shouldJump){if(!this._searchConfig){return;}
const regex=this._searchConfig.toSearchRegex(true);const previousFocusElement=this._currentSearchTreeElements[this._currentSearchFocusIndex];if(previousFocusElement){previousFocusElement.setSearchRegex(regex);}
const newFocusElement=this._currentSearchTreeElements[index];if(newFocusElement){this._updateSearchIndex(index);if(shouldJump){newFocusElement.reveal(true);}
newFocusElement.setSearchRegex(regex,UI.highlightedCurrentSearchResultClassName);}else{this._updateSearchIndex(0);}}
_updateSearchCount(count){if(!this._searchableView){return;}
this._searchableView.updateSearchMatchesCount(count);}
_updateSearchIndex(index){this._currentSearchFocusIndex=index;if(!this._searchableView){return;}
this._searchableView.updateCurrentMatchIndex(index);}
_innerPerformSearch(shouldJump,jumpBackwards){if(!this._searchConfig){return;}
let newIndex=this._currentSearchFocusIndex;const previousSearchFocusElement=this._currentSearchTreeElements[newIndex];this._innerSearchCanceled();this._currentSearchTreeElements=[];const regex=this._searchConfig.toSearchRegex(true);for(let element=this._treeOutline.rootElement();element;element=element.traverseNextTreeElement(false)){if(!(element instanceof XMLViewNode)){continue;}
const hasMatch=element.setSearchRegex(regex);if(hasMatch){this._currentSearchTreeElements.push(element);}
if(previousSearchFocusElement===element){const currentIndex=this._currentSearchTreeElements.length-1;if(hasMatch||jumpBackwards){newIndex=currentIndex;}else{newIndex=currentIndex+1;}}}
this._updateSearchCount(this._currentSearchTreeElements.length);if(!this._currentSearchTreeElements.length){this._updateSearchIndex(0);return;}
newIndex=mod(newIndex,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex,shouldJump);}
_innerSearchCanceled(){for(let element=this._treeOutline.rootElement();element;element=element.traverseNextTreeElement(false)){if(!(element instanceof XMLViewNode)){continue;}
element.revertHighlightChanges();}
this._updateSearchCount(0);this._updateSearchIndex(0);}
searchCanceled(){this._searchConfig=null;this._currentSearchTreeElements=[];this._innerSearchCanceled();}
performSearch(searchConfig,shouldJump,jumpBackwards){this._searchConfig=searchConfig;this._innerPerformSearch(shouldJump,jumpBackwards);}
jumpToNextSearchResult(){if(!this._currentSearchTreeElements.length){return;}
const newIndex=mod(this._currentSearchFocusIndex+1,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex,true);}
jumpToPreviousSearchResult(){if(!this._currentSearchTreeElements.length){return;}
const newIndex=mod(this._currentSearchFocusIndex-1,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex,true);}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return true;}}
export class XMLViewNode extends UI.TreeElement{constructor(node,closeTag,xmlView){super('',!closeTag&&!!node.childElementCount);this._node=node;this._closeTag=closeTag;this.selectable=true;this._highlightChanges=[];this._xmlView=xmlView;this._updateTitle();}
static populate(root,xmlNode,xmlView){let node=xmlNode.firstChild;while(node){const currentNode=node;node=node.nextSibling;const nodeType=currentNode.nodeType;if(nodeType===3&&currentNode.nodeValue.match(/\s+/)){continue;}
if((nodeType!==1)&&(nodeType!==3)&&(nodeType!==4)&&(nodeType!==7)&&(nodeType!==8)){continue;}
root.appendChild(new XMLViewNode(currentNode,false,xmlView));}}
setSearchRegex(regex,additionalCssClassName){this.revertHighlightChanges();if(!regex){return false;}
if(this._closeTag&&this.parent&&!this.parent.expanded){return false;}
regex.lastIndex=0;let cssClasses=UI.highlightedSearchResultClassName;if(additionalCssClassName){cssClasses+=' '+additionalCssClassName;}
const content=this.listItemElement.textContent.replace(/\xA0/g,' ');let match=regex.exec(content);const ranges=[];while(match){ranges.push(new TextUtils.SourceRange(match.index,match[0].length));match=regex.exec(content);}
if(ranges.length){UI.highlightRangesWithStyleClass(this.listItemElement,ranges,cssClasses,this._highlightChanges);}
return!!this._highlightChanges.length;}
revertHighlightChanges(){UI.revertDomChanges(this._highlightChanges);this._highlightChanges=[];}
_updateTitle(){const node=this._node;switch(node.nodeType){case 1:const tag=node.tagName;if(this._closeTag){this._setTitle(['</'+tag+'>','shadow-xml-view-tag']);return;}
const titleItems=['<'+tag,'shadow-xml-view-tag'];const attributes=node.attributes;for(let i=0;i<attributes.length;++i){const attributeNode=attributes.item(i);titleItems.push('\xA0','shadow-xml-view-tag',attributeNode.name,'shadow-xml-view-attribute-name','="','shadow-xml-view-tag',attributeNode.value,'shadow-xml-view-attribute-value','"','shadow-xml-view-tag');}
if(!this.expanded){if(node.childElementCount){titleItems.push('>','shadow-xml-view-tag','\u2026','shadow-xml-view-comment','</'+tag,'shadow-xml-view-tag');}else if(this._node.textContent){titleItems.push('>','shadow-xml-view-tag',node.textContent,'shadow-xml-view-text','</'+tag,'shadow-xml-view-tag');}else{titleItems.push(' /','shadow-xml-view-tag');}}
titleItems.push('>','shadow-xml-view-tag');this._setTitle(titleItems);return;case 3:this._setTitle([node.nodeValue,'shadow-xml-view-text']);return;case 4:this._setTitle(['<![CDATA[','shadow-xml-view-cdata',node.nodeValue,'shadow-xml-view-text',']]>','shadow-xml-view-cdata']);return;case 7:this._setTitle(['<?'+node.nodeName+' '+node.nodeValue+'?>','shadow-xml-view-processing-instruction']);return;case 8:this._setTitle(['<!--'+node.nodeValue+'-->','shadow-xml-view-comment']);return;}}
_setTitle(items){const titleFragment=createDocumentFragment();for(let i=0;i<items.length;i+=2){titleFragment.createChild('span',items[i+1]).textContent=items[i];}
this.title=titleFragment;this._xmlView._innerPerformSearch(false,false);}
onattach(){this.listItemElement.classList.toggle('shadow-xml-view-close-tag',this._closeTag);}
onexpand(){this._updateTitle();}
oncollapse(){this._updateTitle();}
async onpopulate(){XMLViewNode.populate(this,this._node,this._xmlView);this.appendChild(new XMLViewNode(this._node,true,this._xmlView));}}
self.SourceFrame=self.SourceFrame||{};SourceFrame=SourceFrame||{};SourceFrame.XMLView=XMLView;SourceFrame.XMLView.Node=XMLViewNode;