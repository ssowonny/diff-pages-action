export class SourceCodeDiff{constructor(textEditor){this._textEditor=textEditor;this._animatedLines=[];this._animationTimeout=null;}
highlightModifiedLines(oldContent,newContent){if(typeof oldContent!=='string'||typeof newContent!=='string'){return;}
const diff=SourceCodeDiff.computeDiff(Diff.Diff.lineDiff(oldContent.split('\n'),newContent.split('\n')));const changedLines=[];for(let i=0;i<diff.length;++i){const diffEntry=diff[i];if(diffEntry.type===EditType.Delete){continue;}
for(let lineNumber=diffEntry.from;lineNumber<diffEntry.to;++lineNumber){const position=this._textEditor.textEditorPositionHandle(lineNumber,0);if(position){changedLines.push(position);}}}
this._updateHighlightedLines(changedLines);this._animationTimeout=setTimeout(this._updateHighlightedLines.bind(this,[]),400);}
_updateHighlightedLines(newLines){if(this._animationTimeout){clearTimeout(this._animationTimeout);}
this._animationTimeout=null;this._textEditor.operation(operation.bind(this));function operation(){toggleLines.call(this,false);this._animatedLines=newLines;toggleLines.call(this,true);}
function toggleLines(value){for(let i=0;i<this._animatedLines.length;++i){const location=this._animatedLines[i].resolve();if(location){this._textEditor.toggleLineClass(location.lineNumber,'highlight-line-modification',value);}}}}
static computeDiff(diff){const result=[];let hasAdded=false;let hasRemoved=false;let blockStartLineNumber=0;let currentLineNumber=0;let isInsideBlock=false;for(let i=0;i<diff.length;++i){const token=diff[i];if(token[0]===Diff.Diff.Operation.Equal){if(isInsideBlock){flush();}
currentLineNumber+=token[1].length;continue;}
if(!isInsideBlock){isInsideBlock=true;blockStartLineNumber=currentLineNumber;}
if(token[0]===Diff.Diff.Operation.Delete){hasRemoved=true;}else{currentLineNumber+=token[1].length;hasAdded=true;}}
if(isInsideBlock){flush();}
if(result.length>1&&result[0].from===0&&result[1].from===0){const merged={type:EditType.Modify,from:0,to:result[1].to};result.splice(0,2,merged);}
return result;function flush(){let type=EditType.Insert;let from=blockStartLineNumber;let to=currentLineNumber;if(hasAdded&&hasRemoved){type=EditType.Modify;}else if(!hasAdded&&hasRemoved&&from===0&&to===0){type=EditType.Modify;to=1;}else if(!hasAdded&&hasRemoved){type=EditType.Delete;from-=1;}
result.push({type:type,from:from,to:to});isInsideBlock=false;hasAdded=false;hasRemoved=false;}}}
export const EditType={Insert:Symbol('Insert'),Delete:Symbol('Delete'),Modify:Symbol('Modify'),};self.SourceFrame=self.SourceFrame||{};SourceFrame=SourceFrame||{};SourceFrame.SourceCodeDiff=SourceCodeDiff;SourceFrame.SourceCodeDiff.EditType=EditType;