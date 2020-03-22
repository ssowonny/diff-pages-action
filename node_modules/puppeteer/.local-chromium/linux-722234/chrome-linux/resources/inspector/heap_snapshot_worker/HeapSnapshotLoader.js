export class HeapSnapshotLoader{constructor(dispatcher){this._reset();this._progress=new HeapSnapshotWorker.HeapSnapshotProgress(dispatcher);this._buffer='';this._dataCallback=null;this._done=false;this._parseInput();}
dispose(){this._reset();}
_reset(){this._json='';this._snapshot={};}
close(){this._done=true;if(this._dataCallback){this._dataCallback('');}}
buildSnapshot(){this._progress.updateStatus(ls`Processing snapshot\u2026`);const result=new HeapSnapshotWorker.JSHeapSnapshot(this._snapshot,this._progress);this._reset();return result;}
_parseUintArray(){let index=0;const char0='0'.charCodeAt(0);const char9='9'.charCodeAt(0);const closingBracket=']'.charCodeAt(0);const length=this._json.length;while(true){while(index<length){const code=this._json.charCodeAt(index);if(char0<=code&&code<=char9){break;}else if(code===closingBracket){this._json=this._json.slice(index+1);return false;}
++index;}
if(index===length){this._json='';return true;}
let nextNumber=0;const startIndex=index;while(index<length){const code=this._json.charCodeAt(index);if(char0>code||code>char9){break;}
nextNumber*=10;nextNumber+=(code-char0);++index;}
if(index===length){this._json=this._json.slice(startIndex);return true;}
this._array[this._arrayIndex++]=nextNumber;}}
_parseStringsArray(){this._progress.updateStatus(ls`Parsing strings\u2026`);const closingBracketIndex=this._json.lastIndexOf(']');if(closingBracketIndex===-1){throw new Error('Incomplete JSON');}
this._json=this._json.slice(0,closingBracketIndex+1);this._snapshot.strings=JSON.parse(this._json);}
write(chunk){this._buffer+=chunk;if(!this._dataCallback){return;}
this._dataCallback(this._buffer);this._dataCallback=null;this._buffer='';}
_fetchChunk(){return this._done?Promise.resolve(this._buffer):new Promise(r=>this._dataCallback=r);}
async _findToken(token,startIndex){while(true){const pos=this._json.indexOf(token,startIndex||0);if(pos!==-1){return pos;}
startIndex=this._json.length-token.length+1;this._json+=await this._fetchChunk();}}
async _parseArray(name,title,length){const nameIndex=await this._findToken(name);const bracketIndex=await this._findToken('[',nameIndex);this._json=this._json.slice(bracketIndex+1);this._array=length?new Uint32Array(length):[];this._arrayIndex=0;while(this._parseUintArray()){this._progress.updateProgress(title,this._arrayIndex,this._array.length);this._json+=await this._fetchChunk();}
const result=this._array;this._array=null;return result;}
async _parseInput(){const snapshotToken='"snapshot"';const snapshotTokenIndex=await this._findToken(snapshotToken);if(snapshotTokenIndex===-1){throw new Error('Snapshot token not found');}
this._progress.updateStatus(ls`Loading snapshot info\u2026`);const json=this._json.slice(snapshotTokenIndex+snapshotToken.length+1);this._jsonTokenizer=new TextUtils.BalancedJSONTokenizer(metaJSON=>{this._json=this._jsonTokenizer.remainder();this._jsonTokenizer=null;this._snapshot.snapshot=(JSON.parse(metaJSON));});this._jsonTokenizer.write(json);while(this._jsonTokenizer){this._jsonTokenizer.write(await this._fetchChunk());}
this._snapshot.nodes=await this._parseArray('"nodes"',ls`Loading nodes\u2026 %d%%`,this._snapshot.snapshot.meta.node_fields.length*this._snapshot.snapshot.node_count);this._snapshot.edges=await this._parseArray('"edges"',ls`Loading edges\u2026 %d%%`,this._snapshot.snapshot.meta.edge_fields.length*this._snapshot.snapshot.edge_count);if(this._snapshot.snapshot.trace_function_count){this._snapshot.trace_function_infos=await this._parseArray('"trace_function_infos"',ls`Loading allocation traces\u2026 %d%%`,this._snapshot.snapshot.meta.trace_function_info_fields.length*this._snapshot.snapshot.trace_function_count);const thisTokenEndIndex=await this._findToken(':');const nextTokenIndex=await this._findToken('"',thisTokenEndIndex);const openBracketIndex=this._json.indexOf('[');const closeBracketIndex=this._json.lastIndexOf(']',nextTokenIndex);this._snapshot.trace_tree=JSON.parse(this._json.substring(openBracketIndex,closeBracketIndex+1));this._json=this._json.slice(closeBracketIndex+1);}
if(this._snapshot.snapshot.meta.sample_fields){this._snapshot.samples=await this._parseArray('"samples"',ls`Loading samples\u2026`);}
if(this._snapshot.snapshot.meta['location_fields']){this._snapshot.locations=await this._parseArray('"locations"',ls`Loading locations\u2026`);}else{this._snapshot.locations=[];}
this._progress.updateStatus(ls`Loading strings\u2026`);const stringsTokenIndex=await this._findToken('"strings"');const bracketIndex=await this._findToken('[',stringsTokenIndex);this._json=this._json.slice(bracketIndex);while(!this._done){this._json+=await this._fetchChunk();}
this._parseStringsArray();}}
self.HeapSnapshotWorker=self.HeapSnapshotWorker||{};HeapSnapshotWorker=HeapSnapshotWorker||{};HeapSnapshotWorker.HeapSnapshotLoader=HeapSnapshotLoader;