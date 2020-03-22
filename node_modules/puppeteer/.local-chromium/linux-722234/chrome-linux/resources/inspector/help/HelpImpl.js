export const releaseNoteViewId='release-note';export function latestReleaseNote(){if(!Help._latestReleaseNote){Help._latestReleaseNote=Help.releaseNoteText.reduce((acc,note)=>note.version>acc.version?note:acc);}
return Help._latestReleaseNote;}
function _showReleaseNoteIfNeeded(){_innerShowReleaseNoteIfNeeded(Help._releaseNoteVersionSetting.get(),latestReleaseNote().version,Common.settings.moduleSetting('help.show-release-note').get());}
function _innerShowReleaseNoteIfNeeded(lastSeenVersion,latestVersion,showReleaseNote){if(!lastSeenVersion){Help._releaseNoteVersionSetting.set(latestVersion);return;}
if(!showReleaseNote){return;}
if(lastSeenVersion>=latestVersion){return;}
Help._releaseNoteVersionSetting.set(latestVersion);UI.viewManager.showView(releaseNoteViewId,true);}
export class HelpLateInitialization{async run(){if(!Host.isUnderTest()){_showReleaseNoteIfNeeded();}}}
export class ReleaseNotesActionDelegate{handleAction(context,actionId){Host.InspectorFrontendHost.openInNewTab(latestReleaseNote().link);return true;}}
export class ReportIssueActionDelegate{handleAction(context,actionId){Host.InspectorFrontendHost.openInNewTab('https://bugs.chromium.org/p/chromium/issues/entry?template=DevTools+issue');return true;}}
self.Help=self.Help||{};Help=Help||{};Help.releaseNoteViewId=releaseNoteViewId;Help.latestReleaseNote=latestReleaseNote;Help._innerShowReleaseNoteIfNeeded=_innerShowReleaseNoteIfNeeded;Help._showReleaseNoteIfNeeded=_showReleaseNoteIfNeeded;Help._releaseNoteVersionSetting=Common.settings.createSetting('releaseNoteVersionSeen',0);Help.ReleaseNoteHighlight;Help.ReleaseNote;Help.HelpLateInitialization=HelpLateInitialization;Help.ReleaseNotesActionDelegate=ReleaseNotesActionDelegate;Help.ReportIssueActionDelegate=ReportIssueActionDelegate;