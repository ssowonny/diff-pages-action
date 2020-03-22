export default class CSSOverviewProcessingView extends UI.Widget{constructor(controller){super();this.registerRequiredCSS('css_overview/cssOverviewProcessingView.css');this._formatter=new Intl.NumberFormat('en-US');this._controller=controller;this._render();}
_render(){const cancelButton=UI.createTextButton(ls`Cancel`,()=>this._controller.dispatchEventToListeners(CssOverview.Events.RequestOverviewCancel),'',true);this.setDefaultFocusedElement(cancelButton);this.fragment=UI.Fragment.build`
      <div class="vbox overview-processing-view">
        <h1>Processing page</h1>
        <div>${cancelButton}</div>
      </div>
    `;this.contentElement.appendChild(this.fragment.element());this.contentElement.style.overflow='auto';}}
self.CssOverview=self.CssOverview||{};CssOverview=CssOverview||{};CssOverview.CSSOverviewProcessingView=CSSOverviewProcessingView;