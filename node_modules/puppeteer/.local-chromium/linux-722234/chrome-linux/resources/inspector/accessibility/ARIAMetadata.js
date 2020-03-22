export default class ARIAMetadata{constructor(config){this._attributes=new Map();if(config){this._initialize(config);}}
_initialize(config){const attributes=config['attributes'];const booleanEnum=['true','false'];for(const attributeConfig of attributes){if(attributeConfig.type==='boolean'){attributeConfig.enum=booleanEnum;}
this._attributes.set(attributeConfig.name,new Accessibility.ARIAMetadata.Attribute(attributeConfig));}
this._roleNames=config['roles'].map(roleConfig=>roleConfig.name);}
valuesForProperty(property){if(this._attributes.has(property)){return this._attributes.get(property).getEnum();}
if(property==='role'){return this._roleNames;}
return[];}}
export function ariaMetadata(){if(!Accessibility.ARIAMetadata._instance){Accessibility.ARIAMetadata._instance=new Accessibility.ARIAMetadata(Accessibility.ARIAMetadata._config||null);}
return Accessibility.ARIAMetadata._instance;}
export class Attribute{constructor(config){this._enum=[];if('enum'in config){this._enum=config.enum;}}
getEnum(){return this._enum;}}
self.Accessibility=self.Accessibility||{};Accessibility=Accessibility||{};Accessibility.ARIAMetadata=ARIAMetadata;Accessibility.ARIAMetadata.Attribute=Attribute;Accessibility.ariaMetadata=ariaMetadata;