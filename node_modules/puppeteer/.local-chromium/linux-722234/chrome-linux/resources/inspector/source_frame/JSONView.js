export class JSONView extends UI.VBox{constructor(parsedJSON){super();this._initialized=false;this.registerRequiredCSS('source_frame/jsonView.css');this._parsedJSON=parsedJSON;this.element.classList.add('json-view');this._searchableView;this._treeOutline;this._currentSearchFocusIndex=0;this._currentSearchTreeElements=[];this._searchRegex=null;}
static async createView(content){const parsedJSON=await JSONView._parseJSON(content);if(!parsedJSON||typeof parsedJSON.data!=='object'){return null;}
const jsonView=new JSONView(parsedJSON);const searchableView=new UI.SearchableView(jsonView);searchableView.setPlaceholder(Common.UIString('Find'));jsonView._searchableView=searchableView;jsonView.show(searchableView.element);return searchableView;}
static createViewSync(obj){const jsonView=new JSONView(new ParsedJSON(obj,'',''));const searchableView=new UI.SearchableView(jsonView);searchableView.setPlaceholder(Common.UIString('Find'));jsonView._searchableView=searchableView;jsonView.show(searchableView.element);jsonView.element.setAttribute('tabIndex',0);return searchableView;}
static _parseJSON(text){let returnObj=null;if(text){returnObj=JSONView._extractJSON((text));}
if(!returnObj){return Promise.resolve((null));}
return Formatter.formatterWorkerPool().parseJSONRelaxed(returnObj.data).then(handleReturnedJSON);function handleReturnedJSON(data){if(!data){return null;}
returnObj.data=data;return returnObj;}}
static _extractJSON(text){if(text.startsWith('<')){return null;}
let inner=JSONView._findBrackets(text,'{','}');const inner2=JSONView._findBrackets(text,'[',']');inner=inner2.length>inner.length?inner2:inner;if(inner.length===-1||text.length-inner.length>80){return null;}
const prefix=text.substring(0,inner.start);const suffix=text.substring(inner.end+1);text=text.substring(inner.start,inner.end+1);if(suffix.trim().length&&!(suffix.trim().startsWith(')')&&prefix.trim().endsWith('('))){return null;}
return new ParsedJSON(text,prefix,suffix);}
static _findBrackets(text,open,close){const start=text.indexOf(open);const end=text.lastIndexOf(close);let length=end-start-1;if(start===-1||end===-1||end<start){length=-1;}
return{start:start,end:end,length:length};}
wasShown(){this._initialize();}
_initialize(){if(this._initialized){return;}
this._initialized=true;const obj=SDK.RemoteObject.fromLocalObject(this._parsedJSON.data);const title=this._parsedJSON.prefix+obj.description+this._parsedJSON.suffix;this._treeOutline=new ObjectUI.ObjectPropertiesSection(obj,title,undefined,undefined,undefined,undefined,true);this._treeOutline.enableContextMenu();this._treeOutline.setEditable(false);this._treeOutline.expand();this.element.appendChild(this._treeOutline.element);this._treeOutline.firstChild().select(true,false);}
_jumpToMatch(index){if(!this._searchRegex){return;}
const previousFocusElement=this._currentSearchTreeElements[this._currentSearchFocusIndex];if(previousFocusElement){previousFocusElement.setSearchRegex(this._searchRegex);}
const newFocusElement=this._currentSearchTreeElements[index];if(newFocusElement){this._updateSearchIndex(index);newFocusElement.setSearchRegex(this._searchRegex,UI.highlightedCurrentSearchResultClassName);newFocusElement.reveal();}else{this._updateSearchIndex(0);}}
_updateSearchCount(count){if(!this._searchableView){return;}
this._searchableView.updateSearchMatchesCount(count);}
_updateSearchIndex(index){this._currentSearchFocusIndex=index;if(!this._searchableView){return;}
this._searchableView.updateCurrentMatchIndex(index);}
searchCanceled(){this._searchRegex=null;this._currentSearchTreeElements=[];for(let element=this._treeOutline.rootElement();element;element=element.traverseNextTreeElement(false)){if(!(element instanceof ObjectUI.ObjectPropertyTreeElement)){continue;}
element.revertHighlightChanges();}
this._updateSearchCount(0);this._updateSearchIndex(0);}
performSearch(searchConfig,shouldJump,jumpBackwards){let newIndex=this._currentSearchFocusIndex;const previousSearchFocusElement=this._currentSearchTreeElements[newIndex];this.searchCanceled();this._searchRegex=searchConfig.toSearchRegex(true);for(let element=this._treeOutline.rootElement();element;element=element.traverseNextTreeElement(false)){if(!(element instanceof ObjectUI.ObjectPropertyTreeElement)){continue;}
const hasMatch=element.setSearchRegex(this._searchRegex);if(hasMatch){this._currentSearchTreeElements.push(element);}
if(previousSearchFocusElement===element){const currentIndex=this._currentSearchTreeElements.length-1;if(hasMatch||jumpBackwards){newIndex=currentIndex;}else{newIndex=currentIndex+1;}}}
this._updateSearchCount(this._currentSearchTreeElements.length);if(!this._currentSearchTreeElements.length){this._updateSearchIndex(0);return;}
newIndex=mod(newIndex,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex);}
jumpToNextSearchResult(){if(!this._currentSearchTreeElements.length){return;}
const newIndex=mod(this._currentSearchFocusIndex+1,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex);}
jumpToPreviousSearchResult(){if(!this._currentSearchTreeElements.length){return;}
const newIndex=mod(this._currentSearchFocusIndex-1,this._currentSearchTreeElements.length);this._jumpToMatch(newIndex);}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return true;}}
export class ParsedJSON{constructor(data,prefix,suffix){this.data=data;this.prefix=prefix;this.suffix=suffix;}}
self.SourceFrame=self.SourceFrame||{};SourceFrame=SourceFrame||{};SourceFrame.JSONView=JSONView;SourceFrame.ParsedJSON=ParsedJSON;