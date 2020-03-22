export default class ConsolePanel extends UI.Panel{constructor(){super('console');this._view=Console.ConsoleView.instance();}
static instance(){return(self.runtime.sharedInstance(Console.ConsolePanel));}
static _updateContextFlavor(){const consoleView=Console.ConsolePanel.instance()._view;UI.context.setFlavor(Console.ConsoleView,consoleView.isShowing()?consoleView:null);}
wasShown(){super.wasShown();const wrapper=Console.ConsolePanel.WrapperView._instance;if(wrapper&&wrapper.isShowing()){UI.inspectorView.setDrawerMinimized(true);}
this._view.show(this.element);Console.ConsolePanel._updateContextFlavor();}
willHide(){super.willHide();UI.inspectorView.setDrawerMinimized(false);if(Console.ConsolePanel.WrapperView._instance){Console.ConsolePanel.WrapperView._instance._showViewInWrapper();}
Console.ConsolePanel._updateContextFlavor();}
searchableView(){return Console.ConsoleView.instance().searchableView();}}
export class WrapperView extends UI.VBox{constructor(){super();this.element.classList.add('console-view-wrapper');Console.ConsolePanel.WrapperView._instance=this;this._view=Console.ConsoleView.instance();}
wasShown(){if(!Console.ConsolePanel.instance().isShowing()){this._showViewInWrapper();}else{UI.inspectorView.setDrawerMinimized(true);}
Console.ConsolePanel._updateContextFlavor();}
willHide(){UI.inspectorView.setDrawerMinimized(false);Console.ConsolePanel._updateContextFlavor();}
_showViewInWrapper(){this._view.show(this.element);}}
export class ConsoleRevealer{reveal(object){const consoleView=Console.ConsoleView.instance();if(consoleView.isShowing()){consoleView.focus();return Promise.resolve();}
UI.viewManager.showView('console-view');return Promise.resolve();}}
self.Console=self.Console||{};Console=Console||{};Console.ConsolePanel=ConsolePanel;Console.ConsolePanel.WrapperView=WrapperView;Console.ConsolePanel.ConsoleRevealer=ConsoleRevealer;