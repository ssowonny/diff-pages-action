class Issue{constructor(category,name,data){this._category=category;this._name=name;this._data=data;}}
Issue.Categories={SameSite:Symbol('SameSite'),};const connectedIssuesSymbol=Symbol('issues');export default class IssuesModel extends SDK.SDKModel{constructor(target){super(target);const networkManager=target.model(SDK.NetworkManager);if(networkManager){networkManager.addEventListener(SDK.NetworkManager.Events.RequestFinished,this._handleRequestFinished,this);}
this._issues=[];}
static connectWithIssue(obj,issue){if(!obj){return;}
if(!obj[connectedIssuesSymbol]){obj[connectedIssuesSymbol]=[];}
obj[connectedIssuesSymbol].push(issue);}
static hasIssues(obj){if(!obj){return false;}
return obj[connectedIssuesSymbol]&&obj[connectedIssuesSymbol].length;}
_handleRequestFinished(event){const request=(event.data);const blockedResponseCookies=request.blockedResponseCookies();for(const blockedCookie of blockedResponseCookies){const reason=blockedCookie.blockedReasons[0];const cookie=blockedCookie.cookie;const issue=new Issue(Issue.Categories.SameSite,reason,{request,cookie});IssuesModel.connectWithIssue(request,issue);IssuesModel.connectWithIssue(cookie,issue);}}}
self.SDK=self.SDK||{};SDK=SDK||{};SDK.IssuesModel=IssuesModel;SDK.SDKModel.register(IssuesModel,SDK.Target.Capability.None,true);