export default class AnimationModel extends SDK.SDKModel{constructor(target){super(target);this._runtimeModel=(target.model(SDK.RuntimeModel));this._agent=target.animationAgent();target.registerAnimationDispatcher(new Animation.AnimationDispatcher(this));this._animationsById=new Map();this._animationGroups=new Map();this._pendingAnimations=[];this._playbackRate=1;const resourceTreeModel=(target.model(SDK.ResourceTreeModel));resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.MainFrameNavigated,this._reset,this);const screenCaptureModel=target.model(SDK.ScreenCaptureModel);if(screenCaptureModel){this._screenshotCapture=new ScreenshotCapture(this,screenCaptureModel);}}
_reset(){this._animationsById.clear();this._animationGroups.clear();this._pendingAnimations=[];this.dispatchEventToListeners(Events.ModelReset);}
animationCreated(id){this._pendingAnimations.push(id);}
_animationCanceled(id){this._pendingAnimations.remove(id);this._flushPendingAnimationsIfNeeded();}
animationStarted(payload){if(!payload.source||!payload.source.backendNodeId){return;}
const animation=AnimationImpl.parsePayload(this,payload);if(animation.type()==='WebAnimation'&&animation.source().keyframesRule().keyframes().length===0){this._pendingAnimations.remove(animation.id());}else{this._animationsById.set(animation.id(),animation);if(this._pendingAnimations.indexOf(animation.id())===-1){this._pendingAnimations.push(animation.id());}}
this._flushPendingAnimationsIfNeeded();}
_flushPendingAnimationsIfNeeded(){for(const id of this._pendingAnimations){if(!this._animationsById.get(id)){return;}}
while(this._pendingAnimations.length){this._matchExistingGroups(this._createGroupFromPendingAnimations());}}
_matchExistingGroups(incomingGroup){let matchedGroup=null;for(const group of this._animationGroups.values()){if(group._matches(incomingGroup)){matchedGroup=group;group._update(incomingGroup);break;}}
if(!matchedGroup){this._animationGroups.set(incomingGroup.id(),incomingGroup);if(this._screenshotCapture){this._screenshotCapture.captureScreenshots(incomingGroup.finiteDuration(),incomingGroup._screenshots);}}
this.dispatchEventToListeners(Events.AnimationGroupStarted,matchedGroup||incomingGroup);return!!matchedGroup;}
_createGroupFromPendingAnimations(){console.assert(this._pendingAnimations.length);const groupedAnimations=[this._animationsById.get(this._pendingAnimations.shift())];const remainingAnimations=[];for(const id of this._pendingAnimations){const anim=this._animationsById.get(id);if(anim.startTime()===groupedAnimations[0].startTime()){groupedAnimations.push(anim);}else{remainingAnimations.push(id);}}
this._pendingAnimations=remainingAnimations;return new AnimationGroup(this,groupedAnimations[0].id(),groupedAnimations);}
setPlaybackRate(playbackRate){this._playbackRate=playbackRate;this._agent.setPlaybackRate(playbackRate);}
_releaseAnimations(animations){this._agent.releaseAnimations(animations);}
suspendModel(){this._reset();return this._agent.disable();}
resumeModel(){if(!this._enabled){return Promise.resolve();}
return this._agent.enable();}
ensureEnabled(){if(this._enabled){return;}
this._agent.enable();this._enabled=true;}}
export const Events={AnimationGroupStarted:Symbol('AnimationGroupStarted'),ModelReset:Symbol('ModelReset')};export class AnimationImpl{constructor(animationModel,payload){this._animationModel=animationModel;this._payload=payload;this._source=new AnimationEffect(animationModel,(this._payload.source));}
static parsePayload(animationModel,payload){return new AnimationImpl(animationModel,payload);}
payload(){return this._payload;}
id(){return this._payload.id;}
name(){return this._payload.name;}
paused(){return this._payload.pausedState;}
playState(){return this._playState||this._payload.playState;}
setPlayState(playState){this._playState=playState;}
playbackRate(){return this._payload.playbackRate;}
startTime(){return this._payload.startTime;}
endTime(){if(!this.source().iterations){return Infinity;}
return this.startTime()+this.source().delay()+this.source().duration()*this.source().iterations()+
this.source().endDelay();}
_finiteDuration(){const iterations=Math.min(this.source().iterations(),3);return this.source().delay()+this.source().duration()*iterations;}
currentTime(){return this._payload.currentTime;}
source(){return this._source;}
type(){return(this._payload.type);}
overlaps(animation){if(!this.source().iterations()||!animation.source().iterations()){return true;}
const firstAnimation=this.startTime()<animation.startTime()?this:animation;const secondAnimation=firstAnimation===this?animation:this;return firstAnimation.endTime()>=secondAnimation.startTime();}
setTiming(duration,delay){this._source.node().then(this._updateNodeStyle.bind(this,duration,delay));this._source._duration=duration;this._source._delay=delay;this._animationModel._agent.setTiming(this.id(),duration,delay);}
_updateNodeStyle(duration,delay,node){let animationPrefix;if(this.type()===Type.CSSTransition){animationPrefix='transition-';}else if(this.type()===Type.CSSAnimation){animationPrefix='animation-';}else{return;}
const cssModel=node.domModel().cssModel();cssModel.setEffectivePropertyValueForNode(node.id,animationPrefix+'duration',duration+'ms');cssModel.setEffectivePropertyValueForNode(node.id,animationPrefix+'delay',delay+'ms');}
remoteObjectPromise(){return this._animationModel._agent.resolveAnimation(this.id()).then(payload=>payload&&this._animationModel._runtimeModel.createRemoteObject(payload));}
_cssId(){return this._payload.cssId||'';}}
export const Type={CSSTransition:'CSSTransition',CSSAnimation:'CSSAnimation',WebAnimation:'WebAnimation'};export class AnimationEffect{constructor(animationModel,payload){this._animationModel=animationModel;this._payload=payload;if(payload.keyframesRule){this._keyframesRule=new KeyframesRule(payload.keyframesRule);}
this._delay=this._payload.delay;this._duration=this._payload.duration;}
delay(){return this._delay;}
endDelay(){return this._payload.endDelay;}
iterationStart(){return this._payload.iterationStart;}
iterations(){if(!this.delay()&&!this.endDelay()&&!this.duration()){return 0;}
return this._payload.iterations||Infinity;}
duration(){return this._duration;}
direction(){return this._payload.direction;}
fill(){return this._payload.fill;}
node(){if(!this._deferredNode){this._deferredNode=new SDK.DeferredDOMNode(this._animationModel.target(),this.backendNodeId());}
return this._deferredNode.resolvePromise();}
deferredNode(){return new SDK.DeferredDOMNode(this._animationModel.target(),this.backendNodeId());}
backendNodeId(){return(this._payload.backendNodeId);}
keyframesRule(){return this._keyframesRule;}
easing(){return this._payload.easing;}}
export class KeyframesRule{constructor(payload){this._payload=payload;this._keyframes=this._payload.keyframes.map(function(keyframeStyle){return new KeyframeStyle(keyframeStyle);});}
_setKeyframesPayload(payload){this._keyframes=payload.map(function(keyframeStyle){return new KeyframeStyle(keyframeStyle);});}
name(){return this._payload.name;}
keyframes(){return this._keyframes;}}
export class KeyframeStyle{constructor(payload){this._payload=payload;this._offset=this._payload.offset;}
offset(){return this._offset;}
setOffset(offset){this._offset=offset*100+'%';}
offsetAsNumber(){return parseFloat(this._offset)/100;}
easing(){return this._payload.easing;}}
export class AnimationGroup{constructor(animationModel,id,animations){this._animationModel=animationModel;this._id=id;this._animations=animations;this._paused=false;this._screenshots=[];this._screenshotImages=[];}
id(){return this._id;}
animations(){return this._animations;}
release(){this._animationModel._animationGroups.remove(this.id());this._animationModel._releaseAnimations(this._animationIds());}
_animationIds(){function extractId(animation){return animation.id();}
return this._animations.map(extractId);}
startTime(){return this._animations[0].startTime();}
finiteDuration(){let maxDuration=0;for(let i=0;i<this._animations.length;++i){maxDuration=Math.max(maxDuration,this._animations[i]._finiteDuration());}
return maxDuration;}
seekTo(currentTime){this._animationModel._agent.seekAnimations(this._animationIds(),currentTime);}
paused(){return this._paused;}
togglePause(paused){if(paused===this._paused){return;}
this._paused=paused;this._animationModel._agent.setPaused(this._animationIds(),paused);}
currentTimePromise(){let longestAnim=null;for(const anim of this._animations){if(!longestAnim||anim.endTime()>longestAnim.endTime()){longestAnim=anim;}}
return this._animationModel._agent.getCurrentTime(longestAnim.id()).then(currentTime=>currentTime||0);}
_matches(group){function extractId(anim){if(anim.type()===Type.WebAnimation){return anim.type()+anim.id();}else{return anim._cssId();}}
if(this._animations.length!==group._animations.length){return false;}
const left=this._animations.map(extractId).sort();const right=group._animations.map(extractId).sort();for(let i=0;i<left.length;i++){if(left[i]!==right[i]){return false;}}
return true;}
_update(group){this._animationModel._releaseAnimations(this._animationIds());this._animations=group._animations;}
screenshots(){for(let i=0;i<this._screenshots.length;++i){const image=new Image();image.src='data:image/jpeg;base64,'+this._screenshots[i];this._screenshotImages.push(image);}
this._screenshots=[];return this._screenshotImages;}}
export class AnimationDispatcher{constructor(animationModel){this._animationModel=animationModel;}
animationCreated(id){this._animationModel.animationCreated(id);}
animationCanceled(id){this._animationModel._animationCanceled(id);}
animationStarted(payload){this._animationModel.animationStarted(payload);}}
export class ScreenshotCapture{constructor(animationModel,screenCaptureModel){this._requests=[];this._screenCaptureModel=screenCaptureModel;this._animationModel=animationModel;this._animationModel.addEventListener(Events.ModelReset,this._stopScreencast,this);}
captureScreenshots(duration,screenshots){const screencastDuration=Math.min(duration/this._animationModel._playbackRate,3000);const endTime=screencastDuration+window.performance.now();this._requests.push({endTime:endTime,screenshots:screenshots});if(!this._endTime||endTime>this._endTime){clearTimeout(this._stopTimer);this._stopTimer=setTimeout(this._stopScreencast.bind(this),screencastDuration);this._endTime=endTime;}
if(this._capturing){return;}
this._capturing=true;this._screenCaptureModel.startScreencast('jpeg',80,undefined,300,2,this._screencastFrame.bind(this),visible=>{});}
_screencastFrame(base64Data,metadata){function isAnimating(request){return request.endTime>=now;}
if(!this._capturing){return;}
const now=window.performance.now();this._requests=this._requests.filter(isAnimating);for(const request of this._requests){request.screenshots.push(base64Data);}}
_stopScreencast(){if(!this._capturing){return;}
delete this._stopTimer;delete this._endTime;this._requests=[];this._capturing=false;this._screenCaptureModel.stopScreencast();}}
SDK.SDKModel.register(AnimationModel,SDK.Target.Capability.DOM,false);self.Animation=self.Animation||{};Animation=Animation||{};Animation.AnimationModel=AnimationModel;Animation.AnimationModel.Events=Events;Animation.AnimationModel.Animation=AnimationImpl;Animation.AnimationModel.Animation.Type=Type;Animation.AnimationModel.AnimationEffect=AnimationEffect;Animation.AnimationModel.KeyframesRule=KeyframesRule;Animation.AnimationModel.KeyframeStyle=KeyframeStyle;Animation.AnimationModel.AnimationGroup=AnimationGroup;Animation.AnimationModel.ScreenshotCapture=ScreenshotCapture;Animation.AnimationModel.ScreenshotCapture.Request;Animation.AnimationDispatcher=AnimationDispatcher;