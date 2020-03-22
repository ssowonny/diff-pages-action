export class ContrastInfo extends Common.Object{constructor(contrastInfo){super();this._isNull=true;this._contrastRatio=null;this._contrastRatioThresholds=null;this._fgColor=null;this._bgColor=null;if(!contrastInfo){return;}
if(!contrastInfo.computedFontSize||!contrastInfo.computedFontWeight||!contrastInfo.backgroundColors||contrastInfo.backgroundColors.length!==1){return;}
this._isNull=false;const isLargeFont=ContrastInfo.computeIsLargeFont(contrastInfo.computedFontSize,contrastInfo.computedFontWeight);this._contrastRatioThresholds=_ContrastThresholds[(isLargeFont?'largeFont':'normalFont')];const bgColorText=contrastInfo.backgroundColors[0];const bgColor=Common.Color.parse(bgColorText);if(bgColor){this._setBgColorInternal(bgColor);}}
isNull(){return this._isNull;}
setColor(fgColor){this._fgColor=fgColor;this._updateContrastRatio();this.dispatchEventToListeners(Events.ContrastInfoUpdated);}
color(){return this._fgColor;}
contrastRatio(){return this._contrastRatio;}
setBgColor(bgColor){this._setBgColorInternal(bgColor);this.dispatchEventToListeners(Events.ContrastInfoUpdated);}
_setBgColorInternal(bgColor){this._bgColor=bgColor;if(!this._fgColor){return;}
const fgRGBA=this._fgColor.rgba();if(bgColor.hasAlpha()){const blendedRGBA=[];Common.Color.blendColors(bgColor.rgba(),fgRGBA,blendedRGBA);this._bgColor=new Common.Color(blendedRGBA,Common.Color.Format.RGBA);}
this._contrastRatio=Common.Color.calculateContrastRatio(fgRGBA,this._bgColor.rgba());}
bgColor(){return this._bgColor;}
_updateContrastRatio(){if(!this._bgColor||!this._fgColor){return;}
this._contrastRatio=Common.Color.calculateContrastRatio(this._fgColor.rgba(),this._bgColor.rgba());}
contrastRatioThreshold(level){if(!this._contrastRatioThresholds){return null;}
return this._contrastRatioThresholds[level];}
static computeIsLargeFont(fontSize,fontWeight){const boldWeights=['bold','bolder','600','700','800','900'];const fontSizePx=parseFloat(fontSize.replace('px',''));const isBold=(boldWeights.indexOf(fontWeight)!==-1);const fontSizePt=fontSizePx*72/96;if(isBold){return fontSizePt>=14;}else{return fontSizePt>=18;}}}
export const Events={ContrastInfoUpdated:Symbol('ContrastInfoUpdated')};const _ContrastThresholds={largeFont:{aa:3.0,aaa:4.5},normalFont:{aa:4.5,aaa:7.0}};self.ColorPicker=self.ColorPicker||{};ColorPicker=ColorPicker||{};ColorPicker.ContrastInfo=ContrastInfo;ColorPicker.ContrastInfo.Events=Events;