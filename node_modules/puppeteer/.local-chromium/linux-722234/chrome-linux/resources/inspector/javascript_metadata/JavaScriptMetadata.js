export default class JavaScriptMetadataImpl{constructor(){this._uniqueFunctions=new Map();this._instanceMethods=new Map();this._staticMethods=new Map();for(const nativeFunction of JavaScriptMetadata.NativeFunctions){if(!nativeFunction.receiver){this._uniqueFunctions.set(nativeFunction.name,nativeFunction.signatures);}else if(nativeFunction.static){if(!this._staticMethods.has(nativeFunction.receiver)){this._staticMethods.set(nativeFunction.receiver,new Map());}
this._staticMethods.get(nativeFunction.receiver).set(nativeFunction.name,nativeFunction.signatures);}else{if(!this._instanceMethods.has(nativeFunction.receiver)){this._instanceMethods.set(nativeFunction.receiver,new Map());}
this._instanceMethods.get(nativeFunction.receiver).set(nativeFunction.name,nativeFunction.signatures);}}}
signaturesForNativeFunction(name){return this._uniqueFunctions.get(name)||null;}
signaturesForInstanceMethod(name,receiverClassName){if(!this._instanceMethods.has(receiverClassName)){return null;}
return this._instanceMethods.get(receiverClassName).get(name)||null;}
signaturesForStaticMethod(name,receiverConstructorName){if(!this._staticMethods.has(receiverConstructorName)){return null;}
return this._staticMethods.get(receiverConstructorName).get(name)||null;}}
self.JavaScriptMetadata=self.JavaScriptMetadata||{};JavaScriptMetadata=JavaScriptMetadata||{};JavaScriptMetadata.JavaScriptMetadata=JavaScriptMetadataImpl;JavaScriptMetadata.NativeFunctions;