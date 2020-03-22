const MaxLengthForLinks=40;export class AuditsReportRenderer extends ReportRenderer{static addViewTraceButton(el,artifacts){if(!artifacts||!artifacts.traces||!artifacts.traces.defaultPass){return;}
const container=el.querySelector('.lh-audit-group');const columnsEl=container.querySelector('.lh-columns');if(!columnsEl){return;}
const defaultPassTrace=artifacts.traces.defaultPass;const timelineButton=UI.createTextButton(Common.UIString('View Trace'),onViewTraceClick,'view-trace');container.insertBefore(timelineButton,columnsEl.nextSibling);async function onViewTraceClick(){Host.userMetrics.actionTaken(Host.UserMetrics.Action.AuditsViewTrace);await UI.inspectorView.showPanel('timeline');Timeline.TimelinePanel.instance().loadFromEvents(defaultPassTrace.traceEvents);}}
static async linkifyNodeDetails(el){const mainTarget=SDK.targetManager.mainTarget();const domModel=mainTarget.model(SDK.DOMModel);for(const origElement of el.getElementsByClassName('lh-node')){const detailsItem=origElement.dataset;if(!detailsItem.path){continue;}
const nodeId=await domModel.pushNodeByPathToFrontend(detailsItem.path);if(!nodeId){continue;}
const node=domModel.nodeForId(nodeId);if(!node){continue;}
const element=await Common.Linkifier.linkify(node,{tooltip:detailsItem.snippet});origElement.title='';origElement.textContent='';origElement.appendChild(element);}}
static async linkifySourceLocationDetails(el){for(const origElement of el.getElementsByClassName('lh-source-location')){const detailsItem=origElement.dataset;if(!detailsItem.sourceUrl||!detailsItem.sourceLine||!detailsItem.sourceColumn){continue;}
const url=detailsItem.sourceUrl;const line=Number(detailsItem.sourceLine);const column=Number(detailsItem.sourceColumn);const element=await Components.Linkifier.linkifyURL(url,{lineNumber:line,column,maxLength:MaxLengthForLinks});origElement.title='';origElement.textContent='';origElement.appendChild(element);}}
static handleDarkMode(el){if(UI.themeSupport.themeName()==='dark'){el.classList.add('dark');}}}
export class AuditsReportUIFeatures extends ReportUIFeatures{constructor(dom){super(dom);this._beforePrint=null;this._afterPrint=null;}
setBeforePrint(beforePrint){this._beforePrint=beforePrint;}
setAfterPrint(afterPrint){this._afterPrint=afterPrint;}
getReportHtml(){this.resetUIState();return Lighthouse.ReportGenerator.generateReportHtml(this.json);}
async _saveFile(blob){const domain=new Common.ParsedURL(this.json.finalUrl).domain();const sanitizedDomain=domain.replace(/[^a-z0-9.-]+/gi,'_');const timestamp=new Date(this.json.fetchTime).toISO8601Compact();const ext=blob.type.match('json')?'.json':'.html';const basename=`${sanitizedDomain}-${timestamp}${ext}`;const text=await blob.text();Workspace.fileManager.save(basename,text,true);}
async _print(){const document=this.getDocument();const clonedReport=document.querySelector('.lh-root').cloneNode(true);const printWindow=window.open('','_blank','channelmode=1,status=1,resizable=1');const style=printWindow.document.createElement('style');style.textContent=Root.Runtime.cachedResources['audits/lighthouse/report.css'];printWindow.document.head.appendChild(style);printWindow.document.body.replaceWith(clonedReport);await Audits.ReportRenderer.linkifyNodeDetails(clonedReport);if(this._beforePrint){this._beforePrint();}
printWindow.focus();printWindow.print();printWindow.close();if(this._afterPrint){this._afterPrint();}}
getDocument(){return this._document;}
resetUIState(){this._resetUIState();}}
self.Audits=self.Audits||{};Audits=Audits||{};Audits.ReportRenderer=AuditsReportRenderer;Audits.ReportUIFeatures=AuditsReportUIFeatures;