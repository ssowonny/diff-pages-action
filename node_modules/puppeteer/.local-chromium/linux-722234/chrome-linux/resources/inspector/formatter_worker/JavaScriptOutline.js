export function javaScriptOutline(content){const chunkSize=100000;let outlineChunk=[];let lastReportedOffset=0;let ast;try{ast=acorn.parse(content,{ranges:false});}catch(e){ast=acorn.loose.parse(content,{ranges:false});}
const textCursor=new TextUtils.TextCursor(content.computeLineEndings());const walker=new FormatterWorker.ESTreeWalker(beforeVisit);walker.walk(ast);postMessage({chunk:outlineChunk,isLastChunk:true});function beforeVisit(node){if(node.type==='ClassDeclaration'){reportClass((node.id));}else if(node.type==='VariableDeclarator'&&isClassNode(node.init)){reportClass((node.id));}else if(node.type==='AssignmentExpression'&&isNameNode(node.left)&&isClassNode(node.right)){reportClass((node.left));}else if(node.type==='Property'&&isNameNode(node.key)&&isClassNode(node.value)){reportClass((node.key));}else if(node.type==='FunctionDeclaration'){reportFunction((node.id),node);}else if(node.type==='VariableDeclarator'&&isFunctionNode(node.init)){reportFunction((node.id),(node.init));}else if(node.type==='AssignmentExpression'&&isNameNode(node.left)&&isFunctionNode(node.right)){reportFunction((node.left),(node.right));}else if((node.type==='MethodDefinition'||node.type==='Property')&&isNameNode(node.key)&&isFunctionNode(node.value)){const namePrefix=[];if(node.kind==='get'||node.kind==='set'){namePrefix.push(node.kind);}
if(node.static){namePrefix.push('static');}
reportFunction(node.key,node.value,namePrefix.join(' '));}}
function reportClass(nameNode){const name='class '+stringifyNameNode(nameNode);textCursor.advance(nameNode.start);addOutlineItem({name:name,line:textCursor.lineNumber(),column:textCursor.columnNumber(),});}
function reportFunction(nameNode,functionNode,namePrefix){let name=stringifyNameNode(nameNode);if(functionNode.generator){name='*'+name;}
if(namePrefix){name=namePrefix+' '+name;}
if(functionNode.async){name='async '+name;}
textCursor.advance(nameNode.start);addOutlineItem({name:name,line:textCursor.lineNumber(),column:textCursor.columnNumber(),arguments:stringifyArguments((functionNode.params))});}
function isNameNode(node){if(!node){return false;}
if(node.type==='MemberExpression'){return!node.computed&&node.property.type==='Identifier';}
return node.type==='Identifier';}
function isFunctionNode(node){if(!node){return false;}
return node.type==='FunctionExpression'||node.type==='ArrowFunctionExpression';}
function isClassNode(node){return!!node&&node.type==='ClassExpression';}
function stringifyNameNode(node){if(node.type==='MemberExpression'){node=(node.property);}
console.assert(node.type==='Identifier','Cannot extract identifier from unknown type: '+node.type);return(node.name);}
function stringifyArguments(params){const result=[];for(const param of params){if(param.type==='Identifier'){result.push(param.name);}else if(param.type==='RestElement'&&param.argument.type==='Identifier'){result.push('...'+param.argument.name);}else{console.error('Error: unexpected function parameter type: '+param.type);}}
return'('+result.join(', ')+')';}
function addOutlineItem(item){outlineChunk.push(item);if(textCursor.offset()-lastReportedOffset<chunkSize){return;}
postMessage({chunk:outlineChunk,isLastChunk:false});outlineChunk=[];lastReportedOffset=textCursor.offset();}}
self.FormatterWorker=self.FormatterWorker||{};FormatterWorker=FormatterWorker||{};FormatterWorker.javaScriptOutline=javaScriptOutline;