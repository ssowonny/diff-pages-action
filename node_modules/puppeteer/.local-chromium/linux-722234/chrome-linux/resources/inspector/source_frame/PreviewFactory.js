export class PreviewFactory{static async createPreview(provider,mimeType){let resourceType=Common.ResourceType.fromMimeType(mimeType);if(resourceType===Common.resourceTypes.Other){resourceType=provider.contentType();}
switch(resourceType){case Common.resourceTypes.Image:return new SourceFrame.ImageView(mimeType,provider);case Common.resourceTypes.Font:return new SourceFrame.FontView(mimeType,provider);}
const deferredContent=await provider.requestContent();if(deferredContent.error){return new UI.EmptyWidget(deferredContent.error);}else if(!deferredContent.content){return new UI.EmptyWidget(Common.UIString('Nothing to preview'));}
let content=deferredContent.content;if(await provider.contentEncoded()){content=window.atob(content);}
const parsedXML=SourceFrame.XMLView.parseXML(content,mimeType);if(parsedXML){return SourceFrame.XMLView.createSearchableView(parsedXML);}
const jsonView=await SourceFrame.JSONView.createView(content);if(jsonView){return jsonView;}
if(resourceType.isTextType()){const highlighterType=provider.contentType().canonicalMimeType()||mimeType.replace(/;.*/,'');return SourceFrame.ResourceSourceFrame.createSearchableView(provider,highlighterType,true);}
return null;}}
self.SourceFrame=self.SourceFrame||{};SourceFrame=SourceFrame||{};SourceFrame.PreviewFactory=PreviewFactory;