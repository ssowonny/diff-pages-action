export default class CSSOverviewModel extends SDK.SDKModel{constructor(target){super(target);this._runtimeAgent=target.runtimeAgent();this._cssAgent=target.cssAgent();this._domAgent=target.domAgent();this._domSnapshotAgent=target.domsnapshotAgent();this._overlayAgent=target.overlayAgent();}
highlightNode(node){const highlightConfig={contentColor:Common.Color.PageHighlight.Content.toProtocolRGBA(),showInfo:true};this._overlayAgent.invoke_hideHighlight({});this._overlayAgent.invoke_highlightNode({backendNodeId:node,highlightConfig});}
async getNodeStyleStats(){const backgroundColors=new Map();const textColors=new Map();const fillColors=new Map();const borderColors=new Map();const fontInfo=new Map();const unusedDeclarations=new Map();const snapshotConfig={computedStyles:['background-color','color','fill','border-top-width','border-top-color','border-bottom-width','border-bottom-color','border-left-width','border-left-color','border-right-width','border-right-color','font-family','font-size','font-weight','line-height','position','top','right','bottom','left','display','width','height','vertical-align']};const storeColor=(id,nodeId,target)=>{if(id===-1){return;}
const colorText=strings[id];const color=Common.Color.parse(colorText);if(!color||color.rgba()[3]===0){return;}
const colorFormatted=color.hasAlpha()?color.asString(Common.Color.Format.HEXA):color.asString(Common.Color.Format.HEX);const colorValues=target.get(colorFormatted)||new Set();colorValues.add(nodeId);target.set(colorFormatted,colorValues);};const isSVGNode=nodeName=>{const validNodes=new Set(['altglyph','circle','ellipse','path','polygon','polyline','rect','svg','text','textpath','tref','tspan']);return validNodes.has(nodeName.toLowerCase());};const isReplacedContent=nodeName=>{const validNodes=new Set(['iframe','video','embed','img']);return validNodes.has(nodeName.toLowerCase());};const isTableElementWithDefaultStyles=(nodeName,display)=>{const validNodes=new Set(['tr','td','thead','tbody']);return validNodes.has(nodeName.toLowerCase())&&display.startsWith('table');};let elementCount=0;const{documents,strings}=await this._domSnapshotAgent.invoke_captureSnapshot(snapshotConfig);for(const{nodes,layout}of documents){elementCount+=layout.nodeIndex.length;for(let idx=0;idx<layout.styles.length;idx++){const styles=layout.styles[idx];const nodeIdx=layout.nodeIndex[idx];const nodeId=nodes.backendNodeId[nodeIdx];const nodeName=nodes.nodeName[nodeIdx];const[backgroundColorIdx,textColorIdx,fillIdx,borderTopWidthIdx,borderTopColorIdx,borderBottomWidthIdx,borderBottomColorIdx,borderLeftWidthIdx,borderLeftColorIdx,borderRightWidthIdx,borderRightColorIdx,fontFamilyIdx,fontSizeIdx,fontWeightIdx,lineHeightIdx,positionIdx,topIdx,rightIdx,bottomIdx,leftIdx,displayIdx,widthIdx,heightIdx,verticalAlignIdx]=styles;storeColor(backgroundColorIdx,nodeId,backgroundColors);storeColor(textColorIdx,nodeId,textColors);if(isSVGNode(strings[nodeName])){storeColor(fillIdx,nodeId,fillColors);}
if(strings[borderTopWidthIdx]!=='0px'){storeColor(borderTopColorIdx,nodeId,borderColors);}
if(strings[borderBottomWidthIdx]!=='0px'){storeColor(borderBottomColorIdx,nodeId,borderColors);}
if(strings[borderLeftWidthIdx]!=='0px'){storeColor(borderLeftColorIdx,nodeId,borderColors);}
if(strings[borderRightWidthIdx]!=='0px'){storeColor(borderRightColorIdx,nodeId,borderColors);}
if(fontFamilyIdx!==-1){const fontFamily=strings[fontFamilyIdx];const fontFamilyInfo=fontInfo.get(fontFamily)||new Map();const sizeLabel='font-size';const weightLabel='font-weight';const lineHeightLabel='line-height';const size=fontFamilyInfo.get(sizeLabel)||new Map();const weight=fontFamilyInfo.get(weightLabel)||new Map();const lineHeight=fontFamilyInfo.get(lineHeightLabel)||new Map();if(fontSizeIdx!==-1){const fontSizeValue=strings[fontSizeIdx];const nodes=size.get(fontSizeValue)||[];nodes.push(nodeId);size.set(fontSizeValue,nodes);}
if(fontWeightIdx!==-1){const fontWeightValue=strings[fontWeightIdx];const nodes=weight.get(fontWeightValue)||[];nodes.push(nodeId);weight.set(fontWeightValue,nodes);}
if(lineHeightIdx!==-1){const lineHeightValue=strings[lineHeightIdx];const nodes=lineHeight.get(lineHeightValue)||[];nodes.push(nodeId);lineHeight.set(lineHeightValue,nodes);}
fontFamilyInfo.set(sizeLabel,size);fontFamilyInfo.set(weightLabel,weight);fontFamilyInfo.set(lineHeightLabel,lineHeight);fontInfo.set(fontFamily,fontFamilyInfo);}
CssOverview.CSSOverviewUnusedDeclarations.checkForUnusedPositionValues(unusedDeclarations,nodeId,strings,positionIdx,topIdx,leftIdx,rightIdx,bottomIdx);if(!isSVGNode(strings[nodeName])&&!isReplacedContent(strings[nodeName])){CssOverview.CSSOverviewUnusedDeclarations.checkForUnusedWidthAndHeightValues(unusedDeclarations,nodeId,strings,displayIdx,widthIdx,heightIdx);}
if(verticalAlignIdx!==-1&&!isTableElementWithDefaultStyles(strings[nodeName],strings[displayIdx])){CssOverview.CSSOverviewUnusedDeclarations.checkForInvalidVerticalAlignment(unusedDeclarations,nodeId,strings,displayIdx,verticalAlignIdx);}}}
return{backgroundColors,textColors,fillColors,borderColors,fontInfo,unusedDeclarations,elementCount};}
getComputedStyleForNode(nodeId){return this._cssAgent.getComputedStyleForNode(nodeId);}
async getMediaQueries(){const queries=await this._cssAgent.getMediaQueries();const queryMap=new Map();if(!queries){return queryMap;}
for(const query of queries){if(query.source==='linkedSheet'){continue;}
const entries=queryMap.get(query.text)||[];entries.push(query);queryMap.set(query.text,entries);}
return queryMap;}
async getGlobalStylesheetStats(){const expression=`(function() {
      let styleRules = 0;
      let inlineStyles = 0;
      let externalSheets = 0;
      const stats = {
        // Simple.
        type: new Set(),
        class: new Set(),
        id: new Set(),
        universal: new Set(),
        attribute: new Set(),

        // Non-simple.
        nonSimple: new Set()
      };

      for (const styleSheet of document.styleSheets) {
        if (styleSheet.href) {
          externalSheets++;
        } else {
          inlineStyles++;
        }

        // Attempting to grab rules can trigger a DOMException.
        // Try it and if it fails skip to the next stylesheet.
        let rules;
        try {
          rules = styleSheet.rules;
        } catch (err) {
          continue;
        }

        for (const rule of rules) {
          if ('selectorText' in rule) {
            styleRules++;

            // Each group that was used.
            for (const selectorGroup of rule.selectorText.split(',')) {
              // Each selector in the group.
              for (const selector of selectorGroup.split(\/[\\t\\n\\f\\r ]+\/g)) {
                if (selector.startsWith('.')) {
                  // Class.
                  stats.class.add(selector);
                } else if (selector.startsWith('#')) {
                  // Id.
                  stats.id.add(selector);
                } else if (selector.startsWith('*')) {
                  // Universal.
                  stats.universal.add(selector);
                } else if (selector.startsWith('[')) {
                  // Attribute.
                  stats.attribute.add(selector);
                } else {
                  // Type or non-simple selector.
                  const specialChars = \/[#\.:\\[\\]|\\+>~]\/;
                  if (specialChars.test(selector)) {
                    stats.nonSimple.add(selector);
                  } else {
                    stats.type.add(selector);
                  }
                }
              }
            }
          }
        }
      }

      return {
        styleRules,
        inlineStyles,
        externalSheets,
        stats: {
          // Simple.
          type: stats.type.size,
          class: stats.class.size,
          id: stats.id.size,
          universal: stats.universal.size,
          attribute: stats.attribute.size,

          // Non-simple.
          nonSimple: stats.nonSimple.size
        }
      }
    })()`;const{result}=await this._runtimeAgent.invoke_evaluate({expression,returnByValue:true});if(result.type!=='object'){return;}
return result.value;}}
SDK.SDKModel.register(CSSOverviewModel,SDK.Target.Capability.DOM,false);self.CssOverview=self.CssOverview||{};CssOverview=CssOverview||{};CssOverview.CSSOverviewModel=CSSOverviewModel;