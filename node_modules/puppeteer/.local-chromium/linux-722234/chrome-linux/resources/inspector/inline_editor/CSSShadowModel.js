export class CSSShadowModel{constructor(isBoxShadow){this._isBoxShadow=isBoxShadow;this._inset=false;this._offsetX=InlineEditor.CSSLength.zero();this._offsetY=InlineEditor.CSSLength.zero();this._blurRadius=InlineEditor.CSSLength.zero();this._spreadRadius=InlineEditor.CSSLength.zero();this._color=(Common.Color.parse('black'));this._format=[_Part.OffsetX,_Part.OffsetY];}
static parseTextShadow(text){return CSSShadowModel._parseShadow(text,false);}
static parseBoxShadow(text){return CSSShadowModel._parseShadow(text,true);}
static _parseShadow(text,isBoxShadow){const shadowTexts=[];const splits=TextUtils.TextUtils.splitStringByRegexes(text,[Common.Color.Regex,/,/g]);let currentIndex=0;for(let i=0;i<splits.length;i++){if(splits[i].regexIndex===1){const comma=splits[i];shadowTexts.push(text.substring(currentIndex,comma.position));currentIndex=comma.position+1;}}
shadowTexts.push(text.substring(currentIndex,text.length));const shadows=[];for(let i=0;i<shadowTexts.length;i++){const shadow=new CSSShadowModel(isBoxShadow);shadow._format=[];let nextPartAllowed=true;const regexes=[/inset/gi,Common.Color.Regex,InlineEditor.CSSLength.Regex];const results=TextUtils.TextUtils.splitStringByRegexes(shadowTexts[i],regexes);for(let j=0;j<results.length;j++){const result=results[j];if(result.regexIndex===-1){if(/\S/.test(result.value)){return[];}
nextPartAllowed=true;}else{if(!nextPartAllowed){return[];}
nextPartAllowed=false;if(result.regexIndex===0){shadow._inset=true;shadow._format.push(_Part.Inset);}else if(result.regexIndex===1){const color=Common.Color.parse(result.value);if(!color){return[];}
shadow._color=color;shadow._format.push(_Part.Color);}else if(result.regexIndex===2){const length=InlineEditor.CSSLength.parse(result.value);if(!length){return[];}
const previousPart=shadow._format.length>0?shadow._format[shadow._format.length-1]:'';if(previousPart===_Part.OffsetX){shadow._offsetY=length;shadow._format.push(_Part.OffsetY);}else if(previousPart===_Part.OffsetY){shadow._blurRadius=length;shadow._format.push(_Part.BlurRadius);}else if(previousPart===_Part.BlurRadius){shadow._spreadRadius=length;shadow._format.push(_Part.SpreadRadius);}else{shadow._offsetX=length;shadow._format.push(_Part.OffsetX);}}}}
if(invalidCount(shadow,_Part.OffsetX,1,1)||invalidCount(shadow,_Part.OffsetY,1,1)||invalidCount(shadow,_Part.Color,0,1)||invalidCount(shadow,_Part.BlurRadius,0,1)||invalidCount(shadow,_Part.Inset,0,isBoxShadow?1:0)||invalidCount(shadow,_Part.SpreadRadius,0,isBoxShadow?1:0)){return[];}
shadows.push(shadow);}
return shadows;function invalidCount(shadow,part,min,max){let count=0;for(let i=0;i<shadow._format.length;i++){if(shadow._format[i]===part){count++;}}
return count<min||count>max;}}
setInset(inset){this._inset=inset;if(this._format.indexOf(_Part.Inset)===-1){this._format.unshift(_Part.Inset);}}
setOffsetX(offsetX){this._offsetX=offsetX;}
setOffsetY(offsetY){this._offsetY=offsetY;}
setBlurRadius(blurRadius){this._blurRadius=blurRadius;if(this._format.indexOf(_Part.BlurRadius)===-1){const yIndex=this._format.indexOf(_Part.OffsetY);this._format.splice(yIndex+1,0,_Part.BlurRadius);}}
setSpreadRadius(spreadRadius){this._spreadRadius=spreadRadius;if(this._format.indexOf(_Part.SpreadRadius)===-1){this.setBlurRadius(this._blurRadius);const blurIndex=this._format.indexOf(_Part.BlurRadius);this._format.splice(blurIndex+1,0,_Part.SpreadRadius);}}
setColor(color){this._color=color;if(this._format.indexOf(_Part.Color)===-1){this._format.push(_Part.Color);}}
isBoxShadow(){return this._isBoxShadow;}
inset(){return this._inset;}
offsetX(){return this._offsetX;}
offsetY(){return this._offsetY;}
blurRadius(){return this._blurRadius;}
spreadRadius(){return this._spreadRadius;}
color(){return this._color;}
asCSSText(){const parts=[];for(let i=0;i<this._format.length;i++){const part=this._format[i];if(part===_Part.Inset&&this._inset){parts.push('inset');}else if(part===_Part.OffsetX){parts.push(this._offsetX.asCSSText());}else if(part===_Part.OffsetY){parts.push(this._offsetY.asCSSText());}else if(part===_Part.BlurRadius){parts.push(this._blurRadius.asCSSText());}else if(part===_Part.SpreadRadius){parts.push(this._spreadRadius.asCSSText());}else if(part===_Part.Color){parts.push(this._color.asString(this._color.format()));}}
return parts.join(' ');}}
export const _Part={Inset:'I',OffsetX:'X',OffsetY:'Y',BlurRadius:'B',SpreadRadius:'S',Color:'C'};export class CSSLength{constructor(amount,unit){this.amount=amount;this.unit=unit;}
static parse(text){const lengthRegex=new RegExp('^(?:'+InlineEditor.CSSLength.Regex.source+')$','i');const match=text.match(lengthRegex);if(!match){return null;}
if(match.length>2&&match[2]){return new InlineEditor.CSSLength(parseFloat(match[1]),match[2]);}
return InlineEditor.CSSLength.zero();}
static zero(){return new InlineEditor.CSSLength(0,'');}
asCSSText(){return this.amount+this.unit;}}
CSSLength.Regex=(function(){const number='([+-]?(?:[0-9]*[.])?[0-9]+(?:[eE][+-]?[0-9]+)?)';const unit='(ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmax|vmin|vw)';const zero='[+-]?(?:0*[.])?0+(?:[eE][+-]?[0-9]+)?';return new RegExp(number+unit+'|'+zero,'gi');})();self.InlineEditor=self.InlineEditor||{};InlineEditor=InlineEditor||{};InlineEditor.CSSShadowModel=CSSShadowModel;InlineEditor.CSSShadowModel._Part=_Part;InlineEditor.CSSLength=CSSLength;