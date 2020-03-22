export default class ConsoleFilter{constructor(name,parsedFilters,executionContext,levelsMask){this.name=name;this.parsedFilters=parsedFilters;this.executionContext=executionContext;this.levelsMask=levelsMask||Console.ConsoleFilter.defaultLevelsFilterValue();}
static allLevelsFilterValue(){const result={};for(const name of Object.values(SDK.ConsoleMessage.MessageLevel)){result[name]=true;}
return result;}
static defaultLevelsFilterValue(){const result=Console.ConsoleFilter.allLevelsFilterValue();result[SDK.ConsoleMessage.MessageLevel.Verbose]=false;return result;}
static singleLevelMask(level){const result={};result[level]=true;return result;}
clone(){const parsedFilters=this.parsedFilters.map(TextUtils.FilterParser.cloneFilter);const levelsMask=Object.assign({},this.levelsMask);return new Console.ConsoleFilter(this.name,parsedFilters,this.executionContext,levelsMask);}
shouldBeVisible(viewMessage){const message=viewMessage.consoleMessage();if(this.executionContext&&(this.executionContext.runtimeModel!==message.runtimeModel()||this.executionContext.id!==message.executionContextId)){return false;}
if(message.type===SDK.ConsoleMessage.MessageType.Command||message.type===SDK.ConsoleMessage.MessageType.Result||message.isGroupMessage()){return true;}
if(message.level&&!this.levelsMask[(message.level)]){return false;}
for(const filter of this.parsedFilters){if(!filter.key){if(filter.regex&&viewMessage.matchesFilterRegex(filter.regex)===filter.negative){return false;}
if(filter.text&&viewMessage.matchesFilterText(filter.text)===filter.negative){return false;}}else{switch(filter.key){case FilterType.Context:if(!passesFilter(filter,message.context,false)){return false;}
break;case FilterType.Source:const sourceNameForMessage=message.source?SDK.ConsoleMessage.MessageSourceDisplayName.get((message.source)):message.source;if(!passesFilter(filter,sourceNameForMessage,true)){return false;}
break;case FilterType.Url:if(!passesFilter(filter,message.url,false)){return false;}
break;}}}
return true;function passesFilter(filter,value,exactMatch){if(!filter.text){return!!value===filter.negative;}
if(!value){return!filter.text===!filter.negative;}
const filterText=(filter.text).toLowerCase();const lowerCaseValue=value.toLowerCase();if(exactMatch&&(lowerCaseValue===filterText)===filter.negative){return false;}
if(!exactMatch&&lowerCaseValue.includes(filterText)===filter.negative){return false;}
return true;}}}
export const FilterType={Context:'context',Source:'source',Url:'url'};self.Console=self.Console||{};Console=Console||{};Console.ConsoleFilter=ConsoleFilter;Console.ConsoleFilter.FilterType=FilterType;