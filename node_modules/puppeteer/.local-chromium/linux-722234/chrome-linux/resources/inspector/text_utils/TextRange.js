export class TextRange{constructor(startLine,startColumn,endLine,endColumn){this.startLine=startLine;this.startColumn=startColumn;this.endLine=endLine;this.endColumn=endColumn;}
static createFromLocation(line,column){return new TextRange(line,column,line,column);}
static fromObject(serializedTextRange){return new TextRange(serializedTextRange.startLine,serializedTextRange.startColumn,serializedTextRange.endLine,serializedTextRange.endColumn);}
static comparator(range1,range2){return range1.compareTo(range2);}
static fromEdit(oldRange,newText){let endLine=oldRange.startLine;let endColumn=oldRange.startColumn+newText.length;const lineEndings=newText.computeLineEndings();if(lineEndings.length>1){endLine=oldRange.startLine+lineEndings.length-1;const len=lineEndings.length;endColumn=lineEndings[len-1]-lineEndings[len-2]-1;}
return new TextRange(oldRange.startLine,oldRange.startColumn,endLine,endColumn);}
isEmpty(){return this.startLine===this.endLine&&this.startColumn===this.endColumn;}
immediatelyPrecedes(range){if(!range){return false;}
return this.endLine===range.startLine&&this.endColumn===range.startColumn;}
immediatelyFollows(range){if(!range){return false;}
return range.immediatelyPrecedes(this);}
follows(range){return(range.endLine===this.startLine&&range.endColumn<=this.startColumn)||range.endLine<this.startLine;}
get linesCount(){return this.endLine-this.startLine;}
collapseToEnd(){return new TextRange(this.endLine,this.endColumn,this.endLine,this.endColumn);}
collapseToStart(){return new TextRange(this.startLine,this.startColumn,this.startLine,this.startColumn);}
normalize(){if(this.startLine>this.endLine||(this.startLine===this.endLine&&this.startColumn>this.endColumn)){return new TextRange(this.endLine,this.endColumn,this.startLine,this.startColumn);}else{return this.clone();}}
clone(){return new TextRange(this.startLine,this.startColumn,this.endLine,this.endColumn);}
serializeToObject(){const serializedTextRange={};serializedTextRange.startLine=this.startLine;serializedTextRange.startColumn=this.startColumn;serializedTextRange.endLine=this.endLine;serializedTextRange.endColumn=this.endColumn;return serializedTextRange;}
compareTo(other){if(this.startLine>other.startLine){return 1;}
if(this.startLine<other.startLine){return-1;}
if(this.startColumn>other.startColumn){return 1;}
if(this.startColumn<other.startColumn){return-1;}
return 0;}
compareToPosition(lineNumber,columnNumber){if(lineNumber<this.startLine||(lineNumber===this.startLine&&columnNumber<this.startColumn)){return-1;}
if(lineNumber>this.endLine||(lineNumber===this.endLine&&columnNumber>this.endColumn)){return 1;}
return 0;}
equal(other){return this.startLine===other.startLine&&this.endLine===other.endLine&&this.startColumn===other.startColumn&&this.endColumn===other.endColumn;}
relativeTo(line,column){const relative=this.clone();if(this.startLine===line){relative.startColumn-=column;}
if(this.endLine===line){relative.endColumn-=column;}
relative.startLine-=line;relative.endLine-=line;return relative;}
relativeFrom(line,column){const relative=this.clone();if(this.startLine===0){relative.startColumn+=column;}
if(this.endLine===0){relative.endColumn+=column;}
relative.startLine+=line;relative.endLine+=line;return relative;}
rebaseAfterTextEdit(originalRange,editedRange){console.assert(originalRange.startLine===editedRange.startLine);console.assert(originalRange.startColumn===editedRange.startColumn);const rebase=this.clone();if(!this.follows(originalRange)){return rebase;}
const lineDelta=editedRange.endLine-originalRange.endLine;const columnDelta=editedRange.endColumn-originalRange.endColumn;rebase.startLine+=lineDelta;rebase.endLine+=lineDelta;if(rebase.startLine===editedRange.endLine){rebase.startColumn+=columnDelta;}
if(rebase.endLine===editedRange.endLine){rebase.endColumn+=columnDelta;}
return rebase;}
toString(){return JSON.stringify(this);}
containsLocation(lineNumber,columnNumber){if(this.startLine===this.endLine){return this.startLine===lineNumber&&this.startColumn<=columnNumber&&columnNumber<=this.endColumn;}
if(this.startLine===lineNumber){return this.startColumn<=columnNumber;}
if(this.endLine===lineNumber){return columnNumber<=this.endColumn;}
return this.startLine<lineNumber&&lineNumber<this.endLine;}}
export class SourceRange{constructor(offset,length){this.offset=offset;this.length=length;}}
export class SourceEdit{constructor(sourceURL,oldRange,newText){this.sourceURL=sourceURL;this.oldRange=oldRange;this.newText=newText;}
static comparator(edit1,edit2){return TextRange.comparator(edit1.oldRange,edit2.oldRange);}
newRange(){return TextRange.fromEdit(this.oldRange,this.newText);}}
self.TextUtils=self.TextUtils||{};TextUtils=TextUtils||{};TextUtils.TextRange=TextRange;TextUtils.SourceRange=SourceRange;TextUtils.SourceEdit=SourceEdit;