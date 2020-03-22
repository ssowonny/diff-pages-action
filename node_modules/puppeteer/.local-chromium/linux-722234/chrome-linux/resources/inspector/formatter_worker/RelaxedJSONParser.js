const RelaxedJSONParser={parse(content){content='('+content+')';let root;try{root=acorn.parse(content,{});}catch(e){return null;}
const walker=new FormatterWorker.ESTreeWalker(beforeVisit,afterVisit);const rootTip=[];const stack=[];let stackData=({key:0,tip:rootTip,state:States.ExpectValue,parentIsArray:true});walker.setWalkNulls(true);let hasExpression=false;walker.walk(root);if(hasExpression){return null;}
return rootTip.length?rootTip[0]:null;function pushStack(newStack){stack.push(stackData);stackData=newStack;}
function popStack(){stackData=stack.pop();}
function applyValue(value){stackData.tip[stackData.key]=value;if(stackData.parentIsArray){stackData.key++;}else{stackData.state=null;}}
function beforeVisit(node){switch(node.type){case'ObjectExpression':{const newTip={};applyValue(newTip);pushStack(({key:null,tip:newTip,state:null,parentIsArray:false}));break;}
case'ArrayExpression':{const newTip=[];applyValue(newTip);pushStack(({key:0,tip:newTip,state:States.ExpectValue,parentIsArray:true}));break;}
case'Property':stackData.state=States.ExpectKey;break;case'Literal':if(stackData.state===States.ExpectKey){stackData.key=node.value;stackData.state=States.ExpectValue;}else if(stackData.state===States.ExpectValue){applyValue(extractValue(node));return FormatterWorker.ESTreeWalker.SkipSubtree;}
break;case'Identifier':if(stackData.state===States.ExpectKey){stackData.key=(node.name);stackData.state=States.ExpectValue;}else if(stackData.state===States.ExpectValue){applyValue(extractValue(node));return FormatterWorker.ESTreeWalker.SkipSubtree;}
break;case'UnaryExpression':if(stackData.state===States.ExpectValue){applyValue(extractValue(node));return FormatterWorker.ESTreeWalker.SkipSubtree;}
break;case'Program':case'ExpressionStatement':break;default:if(stackData.state===States.ExpectValue){applyValue(extractValue(node));}
return FormatterWorker.ESTreeWalker.SkipSubtree;}}
function afterVisit(node){if(node.type==='ObjectExpression'||node.type==='ArrayExpression'){popStack();}}
function extractValue(node){let isNegative=false;const originalNode=node;let value;if(node.type==='UnaryExpression'&&(node.operator==='-'||node.operator==='+')){if(node.operator==='-'){isNegative=true;}
node=(node.argument);}
if(node.type==='Literal'){value=node.value;}else if(node.type==='Identifier'&&Keywords.hasOwnProperty(node.name)){value=Keywords[node.name];}else{hasExpression=true;return content.substring(originalNode.start,originalNode.end);}
if(isNegative){if(typeof value!=='number'){hasExpression=true;return content.substring(originalNode.start,originalNode.end);}
value=-(value);}
return value;}}};export default RelaxedJSONParser;const States={ExpectKey:'ExpectKey',ExpectValue:'ExpectValue'};const Keywords={'NaN':NaN,'true':true,'false':false,'Infinity':Infinity,'undefined':undefined,'null':null};self.FormatterWorker=self.FormatterWorker||{};FormatterWorker=FormatterWorker||{};FormatterWorker.RelaxedJSONParser=RelaxedJSONParser;FormatterWorker.RelaxedJSONParser.Context;