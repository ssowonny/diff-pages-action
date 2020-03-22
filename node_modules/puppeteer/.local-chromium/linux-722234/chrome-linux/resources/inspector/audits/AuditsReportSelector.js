export default class ReportSelector{constructor(renderNewAuditView){this._renderNewAuditView=renderNewAuditView;this._newAuditItem=createElement('option');this._comboBox=new UI.ToolbarComboBox(this._handleChange.bind(this),ls`Reports`,'audits-report');this._comboBox.setMaxWidth(180);this._comboBox.setMinWidth(140);this._itemByOptionElement=new Map();this._setEmptyState();}
_setEmptyState(){this._comboBox.selectElement().removeChildren();this._comboBox.setEnabled(false);this._newAuditItem=createElement('option');this._newAuditItem.label=Common.UIString('(new audit)');this._comboBox.selectElement().appendChild(this._newAuditItem);this._comboBox.select(this._newAuditItem);}
_handleChange(event){const item=this._selectedItem();if(item){item.select();}else{this._renderNewAuditView();}}
_selectedItem(){const option=this._comboBox.selectedOption();return this._itemByOptionElement.get(option);}
hasCurrentSelection(){return!!this._selectedItem();}
hasItems(){return this._itemByOptionElement.size>0;}
comboBox(){return this._comboBox;}
prepend(item){const optionEl=item.optionElement();const selectEl=this._comboBox.selectElement();this._itemByOptionElement.set(optionEl,item);selectEl.insertBefore(optionEl,selectEl.firstElementChild);this._comboBox.setEnabled(true);this._comboBox.select(optionEl);item.select();}
clearAll(){for(const elem of this._comboBox.options()){if(elem===this._newAuditItem){continue;}
this._itemByOptionElement.get(elem).delete();this._itemByOptionElement.delete(elem);}
this._setEmptyState();}
selectNewAudit(){this._comboBox.select(this._newAuditItem);}}
export class Item{constructor(lighthouseResult,renderReport,showLandingCallback){this._lighthouseResult=lighthouseResult;this._renderReport=renderReport;this._showLandingCallback=showLandingCallback;const url=new Common.ParsedURL(lighthouseResult.finalUrl);const timestamp=lighthouseResult.fetchTime;this._element=createElement('option');this._element.label=`${new Date(timestamp).toLocaleTimeString()} - ${url.domain()}`;}
select(){this._renderReport();}
optionElement(){return this._element;}
delete(){if(this._element){this._element.remove();}
this._showLandingCallback();}}
self.Audits=self.Audits||{};Audits=Audits||{};Audits.ReportSelector=ReportSelector;Audits.ReportSelector.Item=Item;