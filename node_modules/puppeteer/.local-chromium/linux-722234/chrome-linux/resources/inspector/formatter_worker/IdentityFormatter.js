export class IdentityFormatter{constructor(builder){this._builder=builder;}
format(text,lineEndings,fromOffset,toOffset){const content=text.substring(fromOffset,toOffset);this._builder.addToken(content,fromOffset);}}
self.FormatterWorker=self.FormatterWorker||{};FormatterWorker=FormatterWorker||{};FormatterWorker.IdentityFormatter=IdentityFormatter;