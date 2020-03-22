export class ColorSwatch extends HTMLSpanElement{constructor(){super();const root=UI.createShadowRootWithCoreStyles(this,'inline_editor/colorSwatch.css');this._iconElement=root.createChild('span','color-swatch');this._iconElement.title=Common.UIString('Shift-click to change color format');this._swatchInner=this._iconElement.createChild('span','color-swatch-inner');this._swatchInner.addEventListener('dblclick',e=>e.consume(),false);this._swatchInner.addEventListener('mousedown',e=>e.consume(),false);this._swatchInner.addEventListener('click',this._handleClick.bind(this),true);root.createChild('slot');this._colorValueElement=this.createChild('span');}
static create(){if(!ColorSwatch._constructor){ColorSwatch._constructor=UI.registerCustomElement('span','color-swatch',ColorSwatch);}
return(ColorSwatch._constructor());}
static _nextColorFormat(color,curFormat){const cf=Common.Color.Format;switch(curFormat){case cf.Original:return!color.hasAlpha()?cf.RGB:cf.RGBA;case cf.RGB:case cf.RGBA:return!color.hasAlpha()?cf.HSL:cf.HSLA;case cf.HSL:case cf.HSLA:if(color.nickname()){return cf.Nickname;}
return color.detectHEXFormat();case cf.ShortHEX:return cf.HEX;case cf.ShortHEXA:return cf.HEXA;case cf.HEXA:case cf.HEX:return cf.Original;case cf.Nickname:return color.detectHEXFormat();default:return cf.RGBA;}}
color(){return this._color;}
setColor(color){this._color=color;this._format=this._color.format();const colorString=(this._color.asString(this._format));this.setText(colorString);this._swatchInner.style.backgroundColor=colorString;}
hideText(hide){this._colorValueElement.hidden=hide;}
setText(text,tooltip){this._colorValueElement.textContent=text;this._colorValueElement.title=tooltip;}
format(){return this._format;}
setFormat(format){this._format=format;this.setText(this._color.asString(this._format));}
toggleNextFormat(){let currentValue;do{this._format=ColorSwatch._nextColorFormat(this._color,this._format);currentValue=this._color.asString(this._format);}while(currentValue===this._colorValueElement.textContent);this.setText(currentValue);}
iconElement(){return this._iconElement;}
_handleClick(event){if(!event.shiftKey){return;}
event.target.parentNode.parentNode.host.toggleNextFormat();event.consume(true);}}
export class BezierSwatch extends HTMLSpanElement{constructor(){super();const root=UI.createShadowRootWithCoreStyles(this,'inline_editor/bezierSwatch.css');this._iconElement=UI.Icon.create('smallicon-bezier','bezier-swatch-icon');root.appendChild(this._iconElement);this._textElement=this.createChild('span');root.createChild('slot');}
static create(){if(!BezierSwatch._constructor){BezierSwatch._constructor=UI.registerCustomElement('span','bezier-swatch',BezierSwatch);}
return(BezierSwatch._constructor());}
bezierText(){return this._textElement.textContent;}
setBezierText(text){this._textElement.textContent=text;}
hideText(hide){this._textElement.hidden=hide;}
iconElement(){return this._iconElement;}}
export class CSSShadowSwatch extends HTMLSpanElement{constructor(){super();const root=UI.createShadowRootWithCoreStyles(this,'inline_editor/cssShadowSwatch.css');this._iconElement=UI.Icon.create('smallicon-shadow','shadow-swatch-icon');root.appendChild(this._iconElement);root.createChild('slot');this._contentElement=this.createChild('span');}
static create(){if(!CSSShadowSwatch._constructor){CSSShadowSwatch._constructor=UI.registerCustomElement('span','css-shadow-swatch',CSSShadowSwatch);}
return(CSSShadowSwatch._constructor());}
model(){return this._model;}
setCSSShadow(model){this._model=model;this._contentElement.removeChildren();const results=TextUtils.TextUtils.splitStringByRegexes(model.asCSSText(),[/inset/g,Common.Color.Regex]);for(let i=0;i<results.length;i++){const result=results[i];if(result.regexIndex===1){if(!this._colorSwatch){this._colorSwatch=ColorSwatch.create();}
this._colorSwatch.setColor(model.color());this._contentElement.appendChild(this._colorSwatch);}else{this._contentElement.appendChild(createTextNode(result.value));}}}
hideText(hide){this._contentElement.hidden=hide;}
iconElement(){return this._iconElement;}
colorSwatch(){return this._colorSwatch;}}
self.InlineEditor=self.InlineEditor||{};InlineEditor=InlineEditor||{};InlineEditor.ColorSwatch=ColorSwatch;InlineEditor.BezierSwatch=BezierSwatch;InlineEditor.CSSShadowSwatch=CSSShadowSwatch;