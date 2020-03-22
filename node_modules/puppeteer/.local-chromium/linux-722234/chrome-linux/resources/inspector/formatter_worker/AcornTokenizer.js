export class AcornTokenizer{constructor(content){this._content=content;this._comments=[];this._tokenizer=acorn.tokenizer(this._content,{onComment:this._comments});this._textCursor=new TextUtils.TextCursor(this._content.computeLineEndings());this._tokenLineStart=0;this._tokenLineEnd=0;this._nextTokenInternal();}
static punctuator(token,values){return token.type!==acorn.tokTypes.num&&token.type!==acorn.tokTypes.regexp&&token.type!==acorn.tokTypes.string&&token.type!==acorn.tokTypes.name&&!token.type.keyword&&(!values||(token.type.label.length===1&&values.indexOf(token.type.label)!==-1));}
static keyword(token,keyword){return!!token.type.keyword&&token.type!==acorn.tokTypes['_true']&&token.type!==acorn.tokTypes['_false']&&token.type!==acorn.tokTypes['_null']&&(!keyword||token.type.keyword===keyword);}
static identifier(token,identifier){return token.type===acorn.tokTypes.name&&(!identifier||token.value===identifier);}
static lineComment(token){return token.type==='Line';}
static blockComment(token){return token.type==='Block';}
_nextTokenInternal(){if(this._comments.length){return this._comments.shift();}
const token=this._bufferedToken;this._bufferedToken=this._tokenizer.getToken();return token;}
nextToken(){const token=this._nextTokenInternal();if(token.type===acorn.tokTypes.eof){return null;}
this._textCursor.advance(token.start);this._tokenLineStart=this._textCursor.lineNumber();this._tokenColumnStart=this._textCursor.columnNumber();this._textCursor.advance(token.end);this._tokenLineEnd=this._textCursor.lineNumber();return token;}
peekToken(){if(this._comments.length){return this._comments[0];}
return this._bufferedToken.type!==acorn.tokTypes.eof?this._bufferedToken:null;}
tokenLineStart(){return this._tokenLineStart;}
tokenLineEnd(){return this._tokenLineEnd;}
tokenColumnStart(){return this._tokenColumnStart;}}
self.FormatterWorker=self.FormatterWorker||{};FormatterWorker=FormatterWorker||{};FormatterWorker.AcornTokenizer=AcornTokenizer;