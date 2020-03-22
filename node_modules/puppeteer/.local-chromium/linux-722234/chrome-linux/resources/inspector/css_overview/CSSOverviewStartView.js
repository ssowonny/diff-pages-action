export class CSSOverviewStartView extends UI.Widget{constructor(controller){super();this.registerRequiredCSS('css_overview/cssOverviewStartView.css');this._controller=controller;this._render();}
_render(){const startButton=UI.createTextButton(ls`Capture overview`,()=>this._controller.dispatchEventToListeners(CssOverview.Events.RequestOverviewStart),'',true);this.setDefaultFocusedElement(startButton);const fragment=UI.Fragment.build`
      <div class="vbox overview-start-view">
        <h1>${ls`CSS Overview`}</h1>
        <div>${startButton}</div>
      </div>
    `;this.contentElement.appendChild(fragment.element());this.contentElement.style.overflow='auto';}}
self.CssOverview=self.CssOverview||{};CssOverview=CssOverview||{};CssOverview.CSSOverviewStartView=CSSOverviewStartView;