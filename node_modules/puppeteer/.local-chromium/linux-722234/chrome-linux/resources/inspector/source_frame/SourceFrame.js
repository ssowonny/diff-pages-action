export class SourceFrameImpl extends UI.SimpleView{constructor(lazyContent,codeMirrorOptions){super(Common.UIString('Source'));this._lazyContent=lazyContent;this._pretty=false;this._rawContent=null;this._formattedContentPromise=null;this._formattedMap=null;this._prettyToggle=new UI.ToolbarToggle(ls`Pretty print`,'largeicon-pretty-print');this._prettyToggle.addEventListener(UI.ToolbarButton.Events.Click,()=>{this._setPretty(!this._prettyToggle.toggled());});this._shouldAutoPrettyPrint=false;this._prettyToggle.setVisible(false);this._textEditor=new SourceFrame.SourcesTextEditor(this,codeMirrorOptions);this._textEditor.show(this.element);this._prettyCleanGeneration=null;this._cleanGeneration=0;this._searchConfig=null;this._delayedFindSearchMatches=null;this._currentSearchResultIndex=-1;this._searchResults=[];this._searchRegex=null;this._loadError=false;this._textEditor.addEventListener(SourceFrame.SourcesTextEditor.Events.EditorFocused,this._resetCurrentSearchResultIndex,this);this._textEditor.addEventListener(SourceFrame.SourcesTextEditor.Events.SelectionChanged,this._updateSourcePosition,this);this._textEditor.addEventListener(UI.TextEditor.Events.TextChanged,event=>{if(!this._muteChangeEventsForSetContent){this.onTextChanged(event.data.oldRange,event.data.newRange);}});this._muteChangeEventsForSetContent=false;this._sourcePosition=new UI.ToolbarText();this._searchableView=null;this._editable=false;this._textEditor.setReadOnly(true);this._positionToReveal=null;this._lineToScrollTo=null;this._selectionToSet=null;this._loaded=false;this._contentRequested=false;this._highlighterType='';this._transformer={editorToRawLocation:(editorLineNumber,editorColumnNumber=0)=>{if(!this._pretty){return[editorLineNumber,editorColumnNumber];}
return this._prettyToRawLocation(editorLineNumber,editorColumnNumber);},rawToEditorLocation:(lineNumber,columnNumber=0)=>{if(!this._pretty){return[lineNumber,columnNumber];}
return this._rawToPrettyLocation(lineNumber,columnNumber);}};}
setCanPrettyPrint(canPrettyPrint,autoPrettyPrint){this._shouldAutoPrettyPrint=canPrettyPrint&&!!autoPrettyPrint;this._prettyToggle.setVisible(canPrettyPrint);}
async _setPretty(value){this._pretty=value;this._prettyToggle.setEnabled(false);const wasLoaded=this.loaded;const selection=this.selection();let newSelection;if(this._pretty){const formatInfo=await this._requestFormattedContent();this._formattedMap=formatInfo.map;this.setContent(formatInfo.content,null);this._prettyCleanGeneration=this._textEditor.markClean();const start=this._rawToPrettyLocation(selection.startLine,selection.startColumn);const end=this._rawToPrettyLocation(selection.endLine,selection.endColumn);newSelection=new TextUtils.TextRange(start[0],start[1],end[0],end[1]);}else{this.setContent(this._rawContent,null);this._cleanGeneration=this._textEditor.markClean();const start=this._prettyToRawLocation(selection.startLine,selection.startColumn);const end=this._prettyToRawLocation(selection.endLine,selection.endColumn);newSelection=new TextUtils.TextRange(start[0],start[1],end[0],end[1]);}
if(wasLoaded){this.textEditor.revealPosition(newSelection.endLine,newSelection.endColumn,this._editable);this.textEditor.setSelection(newSelection);}
this._prettyToggle.setEnabled(true);this._updatePrettyPrintState();}
_updatePrettyPrintState(){this._prettyToggle.setToggled(this._pretty);this._textEditor.element.classList.toggle('pretty-printed',this._pretty);if(this._pretty){this._textEditor.setLineNumberFormatter(lineNumber=>{const line=this._prettyToRawLocation(lineNumber-1,0)[0]+1;if(lineNumber===1){return String(line);}
if(line!==this._prettyToRawLocation(lineNumber-2,0)[0]+1){return String(line);}
return'-';});}else{this._textEditor.setLineNumberFormatter(lineNumber=>{return String(lineNumber);});}}
transformer(){return this._transformer;}
_prettyToRawLocation(line,column){if(!this._formattedMap){return[line,column];}
return this._formattedMap.formattedToOriginal(line,column);}
_rawToPrettyLocation(line,column){if(!this._formattedMap){return[line,column];}
return this._formattedMap.originalToFormatted(line,column);}
setEditable(editable){this._editable=editable;if(this._loaded){this._textEditor.setReadOnly(!editable);}}
hasLoadError(){return this._loadError;}
wasShown(){this._ensureContentLoaded();this._wasShownOrLoaded();}
willHide(){super.willHide();this._clearPositionToReveal();}
syncToolbarItems(){return[this._prettyToggle,this._sourcePosition];}
get loaded(){return this._loaded;}
get textEditor(){return this._textEditor;}
get pretty(){return this._pretty;}
async _ensureContentLoaded(){if(!this._contentRequested){this._contentRequested=true;const{content,error}=(await this._lazyContent());this._rawContent=error||content||'';this._formattedContentPromise=null;this._formattedMap=null;this._prettyToggle.setEnabled(true);if(error){this.setContent(null,error);this._prettyToggle.setEnabled(false);setTimeout(()=>this.setHighlighterType('text/plain'),50);}else{if(this._shouldAutoPrettyPrint&&TextUtils.isMinified(content||'')){await this._setPretty(true);}else{this.setContent(this._rawContent,null);}}}}
_requestFormattedContent(){if(this._formattedContentPromise){return this._formattedContentPromise;}
let fulfill;this._formattedContentPromise=new Promise(x=>fulfill=x);new Formatter.ScriptFormatter(this._highlighterType,this._rawContent||'',(content,map)=>{fulfill({content,map});});return this._formattedContentPromise;}
revealPosition(line,column,shouldHighlight){this._lineToScrollTo=null;this._selectionToSet=null;this._positionToReveal={line:line,column:column,shouldHighlight:shouldHighlight};this._innerRevealPositionIfNeeded();}
_innerRevealPositionIfNeeded(){if(!this._positionToReveal){return;}
if(!this.loaded||!this.isShowing()){return;}
const[line,column]=this._transformer.rawToEditorLocation(this._positionToReveal.line,this._positionToReveal.column);this._textEditor.revealPosition(line,column,this._positionToReveal.shouldHighlight);this._positionToReveal=null;}
_clearPositionToReveal(){this._textEditor.clearPositionHighlight();this._positionToReveal=null;}
scrollToLine(line){this._clearPositionToReveal();this._lineToScrollTo=line;this._innerScrollToLineIfNeeded();}
_innerScrollToLineIfNeeded(){if(this._lineToScrollTo!==null){if(this.loaded&&this.isShowing()){this._textEditor.scrollToLine(this._lineToScrollTo);this._lineToScrollTo=null;}}}
selection(){return this.textEditor.selection();}
setSelection(textRange){this._selectionToSet=textRange;this._innerSetSelectionIfNeeded();}
_innerSetSelectionIfNeeded(){if(this._selectionToSet&&this.loaded&&this.isShowing()){this._textEditor.setSelection(this._selectionToSet,true);this._selectionToSet=null;}}
_wasShownOrLoaded(){this._innerRevealPositionIfNeeded();this._innerSetSelectionIfNeeded();this._innerScrollToLineIfNeeded();}
onTextChanged(oldRange,newRange){const wasPretty=this.pretty;this._pretty=this._prettyCleanGeneration!==null&&this.textEditor.isClean(this._prettyCleanGeneration);if(this._pretty!==wasPretty){this._updatePrettyPrintState();}
this._prettyToggle.setEnabled(this.isClean());if(this._searchConfig&&this._searchableView){this.performSearch(this._searchConfig,false,false);}}
isClean(){return this.textEditor.isClean(this._cleanGeneration)||(this._prettyCleanGeneration!==null&&this.textEditor.isClean(this._prettyCleanGeneration));}
contentCommitted(){this._cleanGeneration=this._textEditor.markClean();this._prettyCleanGeneration=null;this._rawContent=this.textEditor.text();this._formattedMap=null;this._formattedContentPromise=null;if(this._pretty){this._pretty=false;this._updatePrettyPrintState();}
this._prettyToggle.setEnabled(true);}
_simplifyMimeType(content,mimeType){if(!mimeType){return'';}
if(mimeType.indexOf('typescript')>=0){return'text/typescript-jsx';}
if(mimeType.indexOf('javascript')>=0||mimeType.indexOf('jscript')>=0||mimeType.indexOf('ecmascript')>=0){return'text/jsx';}
if(mimeType==='text/x-php'&&content.match(/\<\?.*\?\>/g)){return'application/x-httpd-php';}
return mimeType;}
setHighlighterType(highlighterType){this._highlighterType=highlighterType;this._updateHighlighterType('');}
highlighterType(){return this._highlighterType;}
_updateHighlighterType(content){this._textEditor.setMimeType(this._simplifyMimeType(content,this._highlighterType));}
setContent(content,loadError){this._muteChangeEventsForSetContent=true;if(!this._loaded){this._loaded=true;if(!loadError){this._textEditor.setText(content||'');this._cleanGeneration=this._textEditor.markClean();this._textEditor.setReadOnly(!this._editable);this._loadError=false;}else{this._textEditor.setText(loadError||'');this._highlighterType='text/plain';this._textEditor.setReadOnly(true);this._loadError=true;}}else{const scrollTop=this._textEditor.scrollTop();const selection=this._textEditor.selection();this._textEditor.setText(content||'');this._textEditor.setScrollTop(scrollTop);this._textEditor.setSelection(selection);}
this._updateHighlighterType(content||'');this._wasShownOrLoaded();if(this._delayedFindSearchMatches){this._delayedFindSearchMatches();this._delayedFindSearchMatches=null;}
this._muteChangeEventsForSetContent=false;}
setSearchableView(view){this._searchableView=view;}
_doFindSearchMatches(searchConfig,shouldJump,jumpBackwards){this._currentSearchResultIndex=-1;this._searchResults=[];const regex=searchConfig.toSearchRegex();this._searchRegex=regex;this._searchResults=this._collectRegexMatches(regex);if(this._searchableView){this._searchableView.updateSearchMatchesCount(this._searchResults.length);}
if(!this._searchResults.length){this._textEditor.cancelSearchResultsHighlight();}else if(shouldJump&&jumpBackwards){this.jumpToPreviousSearchResult();}else if(shouldJump){this.jumpToNextSearchResult();}else{this._textEditor.highlightSearchResults(regex,null);}}
performSearch(searchConfig,shouldJump,jumpBackwards){if(this._searchableView){this._searchableView.updateSearchMatchesCount(0);}
this._resetSearch();this._searchConfig=searchConfig;if(this.loaded){this._doFindSearchMatches(searchConfig,shouldJump,!!jumpBackwards);}else{this._delayedFindSearchMatches=this._doFindSearchMatches.bind(this,searchConfig,shouldJump,!!jumpBackwards);}
this._ensureContentLoaded();}
_resetCurrentSearchResultIndex(){if(!this._searchResults.length){return;}
this._currentSearchResultIndex=-1;if(this._searchableView){this._searchableView.updateCurrentMatchIndex(this._currentSearchResultIndex);}
this._textEditor.highlightSearchResults((this._searchRegex),null);}
_resetSearch(){this._searchConfig=null;this._delayedFindSearchMatches=null;this._currentSearchResultIndex=-1;this._searchResults=[];this._searchRegex=null;}
searchCanceled(){const range=this._currentSearchResultIndex!==-1?this._searchResults[this._currentSearchResultIndex]:null;this._resetSearch();if(!this.loaded){return;}
this._textEditor.cancelSearchResultsHighlight();if(range){this.setSelection(range);}}
jumpToLastSearchResult(){this.jumpToSearchResult(this._searchResults.length-1);}
_searchResultIndexForCurrentSelection(){return this._searchResults.lowerBound(this._textEditor.selection().collapseToEnd(),TextUtils.TextRange.comparator);}
jumpToNextSearchResult(){const currentIndex=this._searchResultIndexForCurrentSelection();const nextIndex=this._currentSearchResultIndex===-1?currentIndex:currentIndex+1;this.jumpToSearchResult(nextIndex);}
jumpToPreviousSearchResult(){const currentIndex=this._searchResultIndexForCurrentSelection();this.jumpToSearchResult(currentIndex-1);}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return true;}
jumpToSearchResult(index){if(!this.loaded||!this._searchResults.length){return;}
this._currentSearchResultIndex=(index+this._searchResults.length)%this._searchResults.length;if(this._searchableView){this._searchableView.updateCurrentMatchIndex(this._currentSearchResultIndex);}
this._textEditor.highlightSearchResults((this._searchRegex),this._searchResults[this._currentSearchResultIndex]);}
replaceSelectionWith(searchConfig,replacement){const range=this._searchResults[this._currentSearchResultIndex];if(!range){return;}
this._textEditor.highlightSearchResults((this._searchRegex),null);const oldText=this._textEditor.text(range);const regex=searchConfig.toSearchRegex();let text;if(regex.__fromRegExpQuery){text=oldText.replace(regex,replacement);}else{text=oldText.replace(regex,function(){return replacement;});}
const newRange=this._textEditor.editRange(range,text);this._textEditor.setSelection(newRange.collapseToEnd());}
replaceAllWith(searchConfig,replacement){this._resetCurrentSearchResultIndex();let text=this._textEditor.text();const range=this._textEditor.fullRange();const regex=searchConfig.toSearchRegex(true);if(regex.__fromRegExpQuery){text=text.replace(regex,replacement);}else{text=text.replace(regex,function(){return replacement;});}
const ranges=this._collectRegexMatches(regex);if(!ranges.length){return;}
const currentRangeIndex=ranges.lowerBound(this._textEditor.selection(),TextUtils.TextRange.comparator);const lastRangeIndex=mod(currentRangeIndex-1,ranges.length);const lastRange=ranges[lastRangeIndex];const replacementLineEndings=replacement.computeLineEndings();const replacementLineCount=replacementLineEndings.length;const lastLineNumber=lastRange.startLine+replacementLineEndings.length-1;let lastColumnNumber=lastRange.startColumn;if(replacementLineEndings.length>1){lastColumnNumber=replacementLineEndings[replacementLineCount-1]-replacementLineEndings[replacementLineCount-2]-1;}
this._textEditor.editRange(range,text);this._textEditor.revealPosition(lastLineNumber,lastColumnNumber);this._textEditor.setSelection(TextUtils.TextRange.createFromLocation(lastLineNumber,lastColumnNumber));}
_collectRegexMatches(regexObject){const ranges=[];for(let i=0;i<this._textEditor.linesCount;++i){let line=this._textEditor.line(i);let offset=0;let match;do{match=regexObject.exec(line);if(match){const matchEndIndex=match.index+Math.max(match[0].length,1);if(match[0].length){ranges.push(new TextUtils.TextRange(i,offset+match.index,i,offset+matchEndIndex));}
offset+=matchEndIndex;line=line.substring(matchEndIndex);}}while(match&&line);}
return ranges;}
populateLineGutterContextMenu(contextMenu,editorLineNumber){return Promise.resolve();}
populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber){return Promise.resolve();}
canEditSource(){return this._editable;}
_updateSourcePosition(){const selections=this._textEditor.selections();if(!selections.length){return;}
if(selections.length>1){this._sourcePosition.setText(Common.UIString('%d selection regions',selections.length));return;}
let textRange=selections[0];if(textRange.isEmpty()){const location=this._prettyToRawLocation(textRange.endLine,textRange.endColumn);this._sourcePosition.setText(ls`Line ${location[0] + 1}, Column ${location[1] + 1}`);return;}
textRange=textRange.normalize();const selectedText=this._textEditor.text(textRange);if(textRange.startLine===textRange.endLine){this._sourcePosition.setText(Common.UIString('%d characters selected',selectedText.length));}else{this._sourcePosition.setText(Common.UIString('%d lines, %d characters selected',textRange.endLine-textRange.startLine+1,selectedText.length));}}}
export class LineDecorator{decorate(uiSourceCode,textEditor,type){}}
self.SourceFrame=self.SourceFrame||{};SourceFrame=SourceFrame||{};SourceFrame.SourceFrame=SourceFrameImpl;SourceFrame.LineDecorator=LineDecorator;SourceFrame.Transformer;