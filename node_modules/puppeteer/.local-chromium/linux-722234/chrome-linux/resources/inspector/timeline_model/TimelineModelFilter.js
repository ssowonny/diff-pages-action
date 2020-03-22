export class TimelineModelFilter{accept(event){return true;}}
export class TimelineVisibleEventsFilter extends TimelineModelFilter{constructor(visibleTypes){super();this._visibleTypes=new Set(visibleTypes);}
accept(event){return this._visibleTypes.has(TimelineVisibleEventsFilter._eventType(event));}
static _eventType(event){if(event.hasCategory(TimelineModel.TimelineModel.Category.Console)){return TimelineModel.TimelineModel.RecordType.ConsoleTime;}
if(event.hasCategory(TimelineModel.TimelineModel.Category.UserTiming)){return TimelineModel.TimelineModel.RecordType.UserTiming;}
if(event.hasCategory(TimelineModel.TimelineModel.Category.LatencyInfo)){return TimelineModel.TimelineModel.RecordType.LatencyInfo;}
return(event.name);}}
export class TimelineInvisibleEventsFilter extends TimelineModelFilter{constructor(invisibleTypes){super();this._invisibleTypes=new Set(invisibleTypes);}
accept(event){return!this._invisibleTypes.has(TimelineVisibleEventsFilter._eventType(event));}}
export class ExclusiveNameFilter extends TimelineModelFilter{constructor(excludeNames){super();this._excludeNames=new Set(excludeNames);}
accept(event){return!this._excludeNames.has(event.name);}}
self.TimelineModel=self.TimelineModel||{};TimelineModel=TimelineModel||{};TimelineModel.TimelineModelFilter=TimelineModelFilter;TimelineModel.TimelineVisibleEventsFilter=TimelineVisibleEventsFilter;TimelineModel.TimelineInvisibleEventsFilter=TimelineInvisibleEventsFilter;TimelineModel.ExclusiveNameFilter=ExclusiveNameFilter;