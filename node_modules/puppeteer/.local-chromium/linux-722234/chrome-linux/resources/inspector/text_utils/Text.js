export class Text{constructor(value){this._value=value;}
lineEndings(){if(!this._lineEndings){this._lineEndings=this._value.computeLineEndings();}
return this._lineEndings;}
value(){return this._value;}
lineCount(){const lineEndings=this.lineEndings();return lineEndings.length;}
offsetFromPosition(lineNumber,columnNumber){return(lineNumber?this.lineEndings()[lineNumber-1]+1:0)+columnNumber;}
positionFromOffset(offset){const lineEndings=this.lineEndings();const lineNumber=lineEndings.lowerBound(offset);return{lineNumber:lineNumber,columnNumber:offset-(lineNumber&&(lineEndings[lineNumber-1]+1))};}
lineAt(lineNumber){const lineEndings=this.lineEndings();const lineStart=lineNumber>0?lineEndings[lineNumber-1]+1:0;const lineEnd=lineEndings[lineNumber];let lineContent=this._value.substring(lineStart,lineEnd);if(lineContent.length>0&&lineContent.charAt(lineContent.length-1)==='\r'){lineContent=lineContent.substring(0,lineContent.length-1);}
return lineContent;}
toSourceRange(range){const start=this.offsetFromPosition(range.startLine,range.startColumn);const end=this.offsetFromPosition(range.endLine,range.endColumn);return new TextUtils.SourceRange(start,end-start);}
toTextRange(sourceRange){const cursor=new TextCursor(this.lineEndings());const result=TextUtils.TextRange.createFromLocation(0,0);cursor.resetTo(sourceRange.offset);result.startLine=cursor.lineNumber();result.startColumn=cursor.columnNumber();cursor.advance(sourceRange.offset+sourceRange.length);result.endLine=cursor.lineNumber();result.endColumn=cursor.columnNumber();return result;}
replaceRange(range,replacement){const sourceRange=this.toSourceRange(range);return this._value.substring(0,sourceRange.offset)+replacement+
this._value.substring(sourceRange.offset+sourceRange.length);}
extract(range){const sourceRange=this.toSourceRange(range);return this._value.substr(sourceRange.offset,sourceRange.length);}}
export class TextCursor{constructor(lineEndings){this._lineEndings=lineEndings;this._offset=0;this._lineNumber=0;this._columnNumber=0;}
advance(offset){this._offset=offset;while(this._lineNumber<this._lineEndings.length&&this._lineEndings[this._lineNumber]<this._offset){++this._lineNumber;}
this._columnNumber=this._lineNumber?this._offset-this._lineEndings[this._lineNumber-1]-1:this._offset;}
offset(){return this._offset;}
resetTo(offset){this._offset=offset;this._lineNumber=this._lineEndings.lowerBound(offset);this._columnNumber=this._lineNumber?this._offset-this._lineEndings[this._lineNumber-1]-1:this._offset;}
lineNumber(){return this._lineNumber;}
columnNumber(){return this._columnNumber;}}
self.TextUtils=self.TextUtils||{};TextUtils=TextUtils||{};TextUtils.Text=Text;TextUtils.TextCursor=TextCursor;TextUtils.Text.Position;